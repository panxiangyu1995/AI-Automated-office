# Worker服务与API设计

## Worker服务概述

Worker服务是Claude-Mem的核心处理引擎，提供HTTP API、实时推送和AI处理能力。

---

## 服务架构

### 整体结构

```
WorkerService
├── Server (HTTP服务器)
│   ├── ViewerRoutes (UI路由)
│   ├── SessionRoutes (会话路由)
│   ├── DataRoutes (数据路由)
│   ├── SearchRoutes (搜索路由)
│   ├── SettingsRoutes (设置路由)
│   └── LogsRoutes (日志路由)
├── DatabaseManager (数据库管理)
├── SessionManager (会话管理)
├── SDKAgent (AI处理代理)
├── GeminiAgent (Gemini代理)
├── OpenRouterAgent (OpenRouter代理)
├── SearchManager (搜索服务)
├── SSEBroadcaster (实时推送)
└── SessionEventBroadcaster (事件广播)
```

### 服务初始化

```typescript
export class WorkerService {
  private server: Server;
  private startTime: number = Date.now();
  private mcpClient: Client;
  
  // 初始化标志
  private mcpReady: boolean = false;
  private initializationCompleteFlag: boolean = false;
  private isShuttingDown: boolean = false;
  
  // 服务层
  private dbManager: DatabaseManager;
  private sessionManager: SessionManager;
  private sseBroadcaster: SSEBroadcaster;
  private sdkAgent: SDKAgent;
  // ...
  
  constructor() {
    // 初始化服务层
    this.dbManager = new DatabaseManager();
    this.sessionManager = new SessionManager(this.dbManager);
    this.sseBroadcaster = new SSEBroadcaster();
    this.sdkAgent = new SDKAgent(this.dbManager, this.sessionManager);
    // ...
    
    // 初始化HTTP服务器
    this.server = new Server({...});
    
    // 注册路由处理器
    this.registerRoutes();
    
    // 注册信号处理器
    this.registerSignalHandlers();
  }
}
```

---

## 启动流程

### 主启动函数

```typescript
async function start(): Promise<void> {
  const port = getWorkerPort();  // 默认37777
  const host = getWorkerHost();  // 默认localhost
  
  // 1. 首先启动HTTP服务器 - 立即使端口可用
  await this.server.listen(port, host);
  
  // 2. Worker写入自己的PID
  writePidFile({
    pid: process.pid,
    port,
    startedAt: new Date().toISOString()
  });
  
  // 3. 在后台进行慢初始化（非阻塞）
  this.initializeBackground().catch((error) => {
    logger.error('SYSTEM', 'Background initialization failed', {}, error);
  });
}
```

### 后台初始化

```typescript
private async initializeBackground(): Promise<void> {
  try {
    // 1. 清理孤儿进程
    await cleanupOrphanedProcesses();
    
    // 2. 加载模式配置
    const settings = SettingsDefaultsManager.loadFromFile(USER_SETTINGS_PATH);
    const modeId = settings.CLAUDE_MEM_MODE;
    ModeManager.getInstance().loadMode(modeId);
    
    // 3. 初始化数据库
    await this.dbManager.initialize();
    
    // 4. 恢复卡住的消息
    const pendingStore = new PendingMessageStore(this.dbManager.getSessionStore().db, 3);
    const resetCount = pendingStore.resetStuckMessages(STUCK_THRESHOLD_MS);
    
    // 5. 初始化搜索服务
    const searchManager = new SearchManager(...);
    this.searchRoutes = new SearchRoutes(searchManager);
    this.server.registerRoutes(this.searchRoutes);
    
    // 6. 连接MCP服务器
    const transport = new StdioClientTransport({
      command: 'node',
      args: [mcpServerPath],
      env: process.env
    });
    await this.mcpClient.connect(transport);
    this.mcpReady = true;
    
    // 7. 标记初始化完成
    this.initializationCompleteFlag = true;
    this.resolveInitialization();
    
    // 8. 启动孤儿收割者
    this.stopOrphanReaper = startOrphanReaper(() => {
      const activeIds = new Set<number>();
      for (const [id] of this.sessionManager['sessions']) {
        activeIds.add(id);
      }
      return activeIds;
    });
    
    // 9. 自动恢复孤立队列
    await this.processPendingQueues(50);
  } catch (error) {
    logger.error('SYSTEM', 'Background initialization failed', {}, error);
    throw error;
  }
}
```

---

## HTTP API端点

### 查看器路由 (ViewerRoutes)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/` | GET | 查看器HTML页面 |
| `/api/health` | GET | 健康检查 |
| `/api/version` | GET | 版本信息 |
| `/api/sse` | GET | SSE实时推送 |
| `/api/settings` | GET | 获取设置 |
| `/api/settings` | PUT | 更新设置 |

### 会话路由 (SessionRoutes)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/sessions` | GET | 获取会话列表 |
| `/api/sessions/:id` | GET | 获取单个会话 |
| `/api/sessions/:id` | DELETE | 删除会话 |
| `/api/sessions/:id/observations` | GET | 获取会话观察 |
| `/api/sessions/:id/summary` | GET | 获取会话摘要 |

### 数据路由 (DataRoutes)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/observations` | GET | 获取观察列表 |
| `/api/observations/:id` | GET | 获取单个观察 |
| `/api/summaries` | GET | 获取摘要列表 |
| `/api/prompts` | GET | 获取提示列表 |
| `/api/stats` | GET | 获取统计信息 |

### 搜索路由 (SearchRoutes)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/search` | GET | 统一搜索 |
| `/api/timeline` | GET | 统一时间线 |
| `/api/decisions` | GET | 决策搜索 |
| `/api/changes` | GET | 变更搜索 |
| `/api/how-it-works` | GET | 解释搜索 |
| `/api/search/observations` | GET | 观察搜索 |
| `/api/search/sessions` | GET | 会话搜索 |
| `/api/search/prompts` | GET | 提示搜索 |
| `/api/search/by-concept` | GET | 概念搜索 |
| `/api/search/by-file` | GET | 文件搜索 |
| `/api/search/by-type` | GET | 类型搜索 |
| `/api/context/recent` | GET | 最近上下文 |
| `/api/context/timeline` | GET | 上下文时间线 |
| `/api/context/preview` | GET | 上下文预览 |
| `/api/context/inject` | GET | 上下文注入 |
| `/api/timeline/by-query` | GET | 查询时间线 |
| `/api/search/help` | GET | 搜索帮助 |

### 设置路由 (SettingsRoutes)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/settings` | GET | 获取所有设置 |
| `/api/settings/:key` | GET | 获取单个设置 |
| `/api/settings/:key` | PUT | 更新设置 |

### 日志路由 (LogsRoutes)

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/logs` | GET | 获取日志列表 |
| `/api/logs/:filename` | GET | 获取日志内容 |

---

## SDK Agent

### 职责

- 通过Claude Agent SDK生成Claude子进程
- 运行事件驱动的查询循环（无轮询）
- 处理SDK响应（观察、摘要）
- 同步到数据库和Chroma

### 会话启动

```typescript
async startSession(session: ActiveSession, worker?: WorkerRef): Promise<void> {
  // 1. 查找Claude可执行文件
  const claudePath = this.findClaudeExecutable();
  
  // 2. 获取模型ID和禁用工具
  const modelId = this.getModelId();
  const disallowedTools = [
    'Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob',
    'WebFetch', 'WebSearch', 'Task', 'NotebookEdit',
    'AskUserQuestion', 'TodoWrite'
  ];
  
  // 3. 创建消息生成器
  const messageGenerator = this.createMessageGenerator(session, cwdTracker);
  
  // 4. 构建隔离环境
  const isolatedEnv = buildIsolatedEnv();
  
  // 5. 运行Agent SDK查询循环
  const queryResult = query({
    prompt: messageGenerator,
    options: {
      model: modelId,
      cwd: OBSERVER_SESSIONS_DIR,
      ...(hasRealMemorySessionId && session.lastPromptNumber > 1 && 
        { resume: session.memorySessionId }),
      disallowedTools,
      abortController: session.abortController,
      pathToClaudeCodeExecutable: claudePath,
      spawnClaudeCodeProcess: createPidCapturingSpawn(session.sessionDbId),
      env: isolatedEnv
    }
  });
  
  // 6. 处理SDK消息
  for await (const message of queryResult) {
    // 捕获memory session ID
    // 处理assistant消息
    // 提取token使用
    // 处理响应
  }
}
```

### 消息生成器

```typescript
private createMessageGenerator(
  session: ActiveSession, 
  cwdTracker: { lastCwd: string | undefined }
): AsyncGenerator<SDKUserMessage> {
  return async function* () {
    // 生成INIT提示
    if (session.lastPromptNumber === 0) {
      yield { type: 'user', content: buildInitPrompt(...) };
      return;
    }
    
    // 处理待处理消息队列
    while (true) {
      const message = await getNextPendingMessage(session.sessionDbId);
      if (!message) break;
      
      // 根据消息类型生成提示
      if (message.type === 'observation') {
        yield { type: 'user', content: buildObservationPrompt(...) };
      } else if (message.type === 'summary') {
        yield { type: 'user', content: buildSummaryPrompt(...) };
      }
    }
  };
}
```

---

## 会话管理

### SessionManager

```typescript
export class SessionManager {
  private sessions: Map<number, ActiveSession> = new Map();
  
  // 初始化会话
  initializeSession(sessionDbId: number): ActiveSession {
    const dbSession = this.dbManager.getSessionStore().getSessionById(sessionDbId);
    const session: ActiveSession = {
      sessionDbId,
      contentSessionId: dbSession.content_session_id,
      memorySessionId: dbSession.memory_session_id,
      project: dbSession.project,
      lastPromptNumber: dbSession.prompt_counter || 0,
      generatorPromise: null,
      abortController: new AbortController(),
      cumulativeInputTokens: 0,
      cumulativeOutputTokens: 0,
      pendingMessages: []
    };
    this.sessions.set(sessionDbId, session);
    return session;
  }
  
  // 获取会话
  getSession(sessionDbId: number): ActiveSession | undefined {
    return this.sessions.get(sessionDbId);
  }
  
  // 检查是否有会话在处理
  isAnySessionProcessing(): boolean {
    for (const session of this.sessions.values()) {
      if (session.generatorPromise) return true;
    }
    return false;
  }
  
  // 获取总活跃工作数
  getTotalActiveWork(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      count += session.pendingMessages.length;
    }
    return count;
  }
  
  // 获取活跃会话数
  getActiveSessionCount(): number {
    return this.sessions.size;
  }
}
```

### ActiveSession类型

```typescript
export interface ActiveSession {
  sessionDbId: number;
  contentSessionId: string;
  memorySessionId: string | null;
  project: string;
  lastPromptNumber: number;
  generatorPromise: Promise<void> | null;
  abortController: AbortController;
  cumulativeInputTokens: number;
  cumulativeOutputTokens: number;
  pendingMessages: PendingMessage[];
}
```

---

## 实时推送

### SSEBroadcaster

```typescript
export class SSEBroadcaster {
  private clients: Set<Response> = new Set();
  
  // 添加客户端
  addClient(res: Response): void {
    this.clients.add(res);
  }
  
  // 移除客户端
  removeClient(res: Response): void {
    this.clients.delete(res);
  }
  
  // 广播消息
  broadcast(data: any): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      client.write(message);
    }
  }
}
```

### SSE端点

```typescript
app.get('/api/sse', (req, res) => {
  // 设置SSE头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 添加客户端
  sseBroadcaster.addClient(res);
  
  // 心跳
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);
  
  // 清理
  req.on('close', () => {
    clearInterval(heartbeat);
    sseBroadcaster.removeClient(res);
  });
});
```

---

## 进程管理

### PID文件管理

```typescript
// 写入PID文件
export function writePidFile(info: { pid: number; port: number; startedAt: string }): void {
  const pidPath = getPidFilePath();
  writeFileSync(pidPath, JSON.stringify(info, null, 2));
}

// 读取PID文件
export function readPidFile(): { pid: number; port: number; startedAt: string } | null {
  const pidPath = getPidFilePath();
  if (!existsSync(pidPath)) return null;
  return JSON.parse(readFileSync(pidPath, 'utf-8'));
}

// 移除PID文件
export function removePidFile(): void {
  const pidPath = getPidFilePath();
  if (existsSync(pidPath)) unlinkSync(pidPath);
}
```

### 守护进程启动

```typescript
export function spawnDaemon(
  scriptPath: string, 
  port: number
): number | undefined {
  const bunPath = findBunExecutable();
  
  const child = spawn(bunPath, [scriptPath, 'daemon', String(port)], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  
  child.unref();
  return child.pid;
}
```

### 健康检查

```typescript
export async function waitForHealth(
  port: number, 
  timeoutMs: number
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(`http://localhost:${port}/api/health`);
      if (response.ok) return true;
    } catch {
      // 继续等待
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

export async function checkVersionMatch(
  port: number
): Promise<{ matches: boolean; pluginVersion: string; workerVersion: string }> {
  const response = await fetch(`http://localhost:${port}/api/version`);
  const data = await response.json();
  
  return {
    matches: data.version === pluginVersion,
    pluginVersion: pluginVersion,
    workerVersion: data.version
  };
}
```

---

## 优雅关闭

### 关闭流程

```typescript
async shutdown(): Promise<void> {
  // 1. 停止孤儿收割者
  if (this.stopOrphanReaper) {
    this.stopOrphanReaper();
  }
  
  // 2. 执行优雅关闭
  await performGracefulShutdown({
    server: this.server.getHttpServer(),
    sessionManager: this.sessionManager,
    mcpClient: this.mcpClient,
    dbManager: this.dbManager
  });
}
```

### performGracefulShutdown

```typescript
export async function performGracefulShutdown(options: {
  server: HttpServer;
  sessionManager: SessionManager;
  mcpClient: Client;
  dbManager: DatabaseManager;
}): Promise<void> {
  const { server, sessionManager, mcpClient, dbManager } = options;
  
  // 1. 停止接受新连接
  server.close();
  
  // 2. 等待活跃会话完成
  // ...
  
  // 3. 关闭MCP连接
  await mcpClient.close();
  
  // 4. 关闭数据库
  dbManager.close();
  
  // 5. 移除PID文件
  removePidFile();
}
```

---

## 命令行接口

### 命令模式

```bash
worker-service.cjs start              # 启动守护进程
worker-service.cjs stop               # 停止守护进程
worker-service.cjs restart            # 重启守护进程
worker-service.cjs status             # 检查状态
worker-service.cjs daemon <port>      # 作为守护进程运行
worker-service.cjs hook <type> <hook> # 执行钩子命令
```

### CLI入口

```typescript
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  switch (command) {
    case 'start':
      await ensureWorkerStarted(getWorkerPort());
      console.log(JSON.stringify(buildStatusOutput('ready')));
      break;
      
    case 'stop':
      await httpShutdown(getWorkerPort());
      removePidFile();
      break;
      
    case 'restart':
      await httpShutdown(getWorkerPort());
      await ensureWorkerStarted(getWorkerPort());
      break;
      
    case 'status':
      const pidInfo = readPidFile();
      if (pidInfo && await waitForHealth(pidInfo.port, 1000)) {
        console.log(JSON.stringify({ status: 'running', ...pidInfo }));
      } else {
        console.log(JSON.stringify({ status: 'stopped' }));
      }
      break;
      
    case 'daemon':
      const service = new WorkerService();
      await service.start();
      break;
      
    case 'hook':
      await handleHookCommand(args[0], args[1]);
      break;
  }
}
```

---

## 错误处理

### 错误级别

| 级别 | 值 | 说明 |
|------|-----|------|
| DEBUG | 0 | 调试信息 |
| INFO | 1 | 一般信息 |
| WARN | 2 | 警告 |
| ERROR | 3 | 错误 |

### 日志格式

```
[timestamp] [LEVEL] [COMPONENT] [correlation-id] message {context}
```

### 错误恢复

```typescript
// Windows冷却期
if (shouldSkipSpawnOnWindows()) {
  logger.warn('SYSTEM', 'Worker unavailable on Windows — skipping spawn');
  return false;
}

// 自动恢复孤立队列
this.processPendingQueues(50).then(result => {
  if (result.sessionsStarted > 0) {
    logger.info('SYSTEM', `Auto-recovered ${result.sessionsStarted} sessions`);
  }
}).catch(error => {
  logger.error('SYSTEM', 'Auto-recovery failed', {}, error);
});
```
