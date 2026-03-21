# Hook机制设计

## 一、Hook机制概述

### 1.1 设计目标

Hook机制是记忆系统的**数据摄入层**，负责在Agent生命周期的关键节点捕获数据，进行预处理后存入记忆系统。

| 目标 | 说明 |
|------|------|
| **非侵入式** | 不修改Agent核心代码，通过生命周期钩子注入 |
| **边缘处理** | 敏感数据在摄入层剥离，永不入库 |
| **异步处理** | 不阻塞主流程，后台处理记忆存储 |
| **可扩展** | 支持自定义Hook扩展 |

### 1.2 与现有架构的融合

Hook机制需要与 AI-Automated-office 的 Agent 框架集成：

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent 框架集成点                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  现有架构:                                                       │
│  ├── src/agents/pi-embedded-runner.ts  → Agent运行器            │
│  ├── src/agents/system-prompt.ts       → 系统提示词构建          │
│  ├── src/agents/context.ts             → 上下文管理              │
│  └── src/routing/                      → 会话路由                │
│                                                                 │
│  Hook集成点:                                                     │
│  ├── pi-embedded-runner.ts → 生命周期事件触发                    │
│  ├── routing/              → 会话创建/结束触发                   │
│  └── memory/hooks/         → Hook处理器实现                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、生命周期钩子定义

### 2.1 钩子类型

| 钩子类型 | 触发时机 | 功能 | 优先级 |
|----------|----------|------|--------|
| **SessionStart** | 会话启动时 | 加载领域认知状态、注入上下文 | 最高 |
| **UserPromptSubmit** | 用户提交提示时 | 记录用户意图、创建会话记录 | 高 |
| **PreToolUse** | 工具执行前 | 敏感操作确认、权限检查 | 高 |
| **PostToolUse** | 工具执行后 | 捕获执行观察、存储工具结果 | 中 |
| **AssistantResponse** | 助手响应时 | 记录响应内容、提取关键事实 | 中 |
| **Stop** | Agent停止时 | 生成会话摘要、更新认知状态 | 高 |
| **SessionEnd** | 会话结束时 | 归档会话、清理临时数据 | 低 |

### 2.2 钩子执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    钩子执行流程                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SessionStart                                                │
│     ├── 加载领域认知状态 (tunnel_state)                         │
│     ├── 注入历史上下文                                          │
│     └── 返回 hookSpecificOutput                                 │
│                 │                                               │
│                 ▼                                               │
│  2. UserPromptSubmit                                            │
│     ├── 创建/更新会话记录                                       │
│     ├── 存储用户提示                                            │
│     └── 触发意图分析（异步）                                    │
│                 │                                               │
│                 ▼                                               │
│  3. [对话循环]                                                  │
│     │                                                           │
│     ├── 3a. PreToolUse (每次工具调用前)                         │
│     │   ├── 检查工具权限                                        │
│     │   ├── 敏感操作确认                                        │
│     │   └── 返回 continue/abort                                 │
│     │                                                           │
│     ├── 3b. PostToolUse (每次工具调用后)                        │
│     │   ├── 捕获工具执行结果                                    │
│     │   ├── 提取观察 (异步)                                     │
│     │   └── 存储工具调用记录                                    │
│     │                                                           │
│     └── 3c. AssistantResponse (每次助手响应)                    │
│         ├── 存储响应内容                                        │
│         ├── 提取关键事实 (异步)                                 │
│         └── 更新token统计                                       │
│                 │                                               │
│                 ▼                                               │
│  4. Stop                                                        │
│     ├── 触发摘要生成 (异步)                                     │
│     ├── 更新认知状态                                            │
│     └── 计算会话统计                                            │
│                 │                                               │
│                 ▼                                               │
│  5. SessionEnd                                                  │
│     ├── 归档会话数据                                            │
│     ├── 清理临时数据                                            │
│     └── 触发数据同步                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、Hook配置规范

### 3.1 配置文件结构

```json
{
  "version": "1.0",
  "description": "AI-Automated-office memory system hooks",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "priority": 100,
        "handler": "memory.hooks.session_start",
        "async": false,
        "timeout": 60
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "priority": 100,
        "handler": "memory.hooks.user_prompt_submit",
        "async": true,
        "timeout": 30
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Read|Write|Edit|Bash|memory_*",
        "priority": 50,
        "handler": "memory.hooks.post_tool_use",
        "async": true,
        "timeout": 120
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "priority": 100,
        "handler": "memory.hooks.stop",
        "async": true,
        "timeout": 180
      }
    ]
  }
}
```

### 3.2 配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `matcher` | string | 正则表达式匹配器，决定何时触发 |
| `priority` | number | 执行优先级，数字越大越先执行 |
| `handler` | string | 处理函数标识，格式：`module.function` |
| `async` | boolean | 是否异步执行（不阻塞主流程） |
| `timeout` | number | 超时时间（秒） |

### 3.3 匹配器规则

| 匹配器 | 说明 | 示例 |
|--------|------|------|
| `*` | 匹配所有 | 所有事件都触发 |
| `startup\|resume` | 匹配多个 | 会话启动或恢复时触发 |
| `Read\|Write\|Edit` | 匹配工具名 | 文件操作工具触发 |
| `memory_*` | 通配符 | 所有memory工具触发 |

---

## 四、Hook输入输出协议

### 4.1 输入数据结构

```typescript
/**
 * Hook输入基类
 */
interface HookInput {
  // 事件标识
  hook_event_name: string;
  timestamp: string;
  
  // 会话信息
  session_key: string;              // {tenantId}:{pluginId}:{sessionId}
  tenant_id: string;
  plugin_id: string;
  session_id: string;
  
  // 用户信息
  user_id: string;
  user_name: string;
  
  // 工作目录
  cwd: string;
}

/**
 * SessionStart 输入
 */
interface SessionStartInput extends HookInput {
  hook_event_name: 'SessionStart';
  source: 'startup' | 'resume' | 'clear' | 'compact';
}

/**
 * UserPromptSubmit 输入
 */
interface UserPromptSubmitInput extends HookInput {
  hook_event_name: 'UserPromptSubmit';
  prompt: string;
  prompt_number: number;           // 会话中的提示序号
}

/**
 * PostToolUse 输入
 */
interface PostToolUseInput extends HookInput {
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: Record<string, any>;
  tool_output: string;
  tool_status: 'success' | 'error';
  execution_time_ms: number;
}

/**
 * Stop 输入
 */
interface StopInput extends HookInput {
  hook_event_name: 'Stop';
  stop_reason: 'complete' | 'error' | 'user_abort' | 'timeout';
  final_message?: string;
}
```

### 4.2 输出数据结构

```typescript
/**
 * Hook输出基类
 */
interface HookOutput {
  // 控制字段
  continue: boolean;               // 是否继续后续处理
  suppress_output: boolean;        // 是否抑制输出
  
  // 状态
  status: 'success' | 'error' | 'skipped';
  message?: string;
}

/**
 * 带上下文注入的输出 (SessionStart)
 */
interface ContextInjectOutput extends HookOutput {
  hook_specific_output: {
    hook_name: 'SessionStart';
    output: string;                // 注入的上下文文本
  };
}

/**
 * 带确认请求的输出 (PreToolUse)
 */
interface ConfirmationOutput extends HookOutput {
  requires_confirmation: boolean;
  confirmation_message?: string;
  confirmation_actions?: Array<{
    label: string;
    action: 'proceed' | 'abort' | 'modify';
    modified_input?: Record<string, any>;
  }>;
}

/**
 * 标准响应 (大多数Hook)
 */
const STANDARD_HOOK_RESPONSE: HookOutput = {
  continue: true,
  suppress_output: true,
  status: 'success'
};
```

### 4.3 退出码策略

| 退出码 | 含义 | 行为 |
|--------|------|------|
| `0` | 成功 | 正常继续 |
| `1` | 非阻塞错误 | 记录日志，继续执行 |
| `2` | 阻塞错误 | 中止当前操作，通知用户 |

---

## 五、Hook处理器实现

### 5.1 处理器基类

```typescript
/**
 * Hook处理器基类
 */
export abstract class BaseHookHandler<TInput extends HookInput, TOutput extends HookOutput> {
  
  protected memoryManager: MemoryManager;
  protected logger: Logger;
  
  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
    this.logger = new Logger(this.constructor.name);
  }
  
  /**
   * 处理入口
   */
  async execute(input: TInput): Promise<TOutput> {
    try {
      // 1. 验证输入
      this.validateInput(input);
      
      // 2. 预处理
      const preprocessed = await this.preprocess(input);
      
      // 3. 核心处理
      const result = await this.process(preprocessed);
      
      // 4. 后处理
      await this.postprocess(result);
      
      return result;
      
    } catch (error) {
      return this.handleError(error as Error);
    }
  }
  
  /**
   * 验证输入
   */
  protected validateInput(input: TInput): void {
    if (!input.session_key) {
      throw new Error('Missing session_key');
    }
    if (!input.tenant_id) {
      throw new Error('Missing tenant_id');
    }
  }
  
  /**
   * 预处理（子类可重写）
   */
  protected async preprocess(input: TInput): Promise<TInput> {
    return input;
  }
  
  /**
   * 核心处理（子类必须实现）
   */
  protected abstract process(input: TInput): Promise<TOutput>;
  
  /**
   * 后处理（子类可重写）
   */
  protected async postprocess(output: TOutput): Promise<void> {
    // 默认不做任何事
  }
  
  /**
   * 错误处理
   */
  protected handleError(error: Error): TOutput {
    this.logger.error('Hook execution failed', error);
    return {
      continue: true,
      suppress_output: true,
      status: 'error',
      message: error.message
    } as TOutput;
  }
}
```

### 5.2 SessionStart Hook

```typescript
/**
 * SessionStart Hook处理器
 * 加载领域认知状态，注入历史上下文
 */
export class SessionStartHook extends BaseHookHandler<SessionStartInput, ContextInjectOutput> {
  
  protected async process(input: SessionStartInput): Promise<ContextInjectOutput> {
    const { session_key, plugin_id, source } = input;
    
    // 1. 获取领域认知状态
    const domainState = await this.memoryManager.getDomainState(
      input.tenant_id,
      input.user_id,
      plugin_id
    );
    
    // 2. 构建上下文
    let contextText = '';
    
    // 2.1 添加领域状态
    if (domainState) {
      contextText += this.formatDomainState(domainState);
    }
    
    // 2.2 添加最近会话摘要
    if (source !== 'clear') {
      const recentSummaries = await this.memoryManager.getRecentSummaries(
        session_key,
        5
      );
      if (recentSummaries.length > 0) {
        contextText += '\n\n## 最近会话摘要\n';
        contextText += this.formatSummaries(recentSummaries);
      }
    }
    
    // 2.3 添加关键事实
    const facts = await this.memoryManager.getRelevantFacts(
      input.tenant_id,
      input.user_id,
      plugin_id
    );
    if (facts.length > 0) {
      contextText += '\n\n## 关键事实\n';
      contextText += this.formatFacts(facts);
    }
    
    // 3. 计算token统计
    const tokenCount = this.estimateTokens(contextText);
    this.logger.info(`Injected context: ${tokenCount} tokens`);
    
    return {
      continue: true,
      suppress_output: true,
      status: 'success',
      hook_specific_output: {
        hook_name: 'SessionStart',
        output: contextText
      }
    };
  }
  
  private formatDomainState(state: DomainState): string {
    const lines: string[] = [];
    
    lines.push('## 当前认知状态');
    lines.push(`**领域**: ${state.domain}`);
    lines.push(`**思考阶段**: ${state.thinking_stage}`);
    
    if (state.open_questions?.length > 0) {
      lines.push('\n### 开放问题');
      state.open_questions.slice(0, 5).forEach(q => {
        lines.push(`- ${q}`);
      });
    }
    
    if (state.decisions?.length > 0) {
      lines.push('\n### 已做决策');
      state.decisions.slice(0, 5).forEach(d => {
        lines.push(`- ${d}`);
      });
    }
    
    return lines.join('\n');
  }
  
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
```

### 5.3 PostToolUse Hook

```typescript
/**
 * PostToolUse Hook处理器
 * 捕获工具执行观察
 */
export class PostToolUseHook extends BaseHookHandler<PostToolUseInput, HookOutput> {
  
  // 需要捕获观察的工具类型
  private static readonly OBSERVATION_TOOLS = new Set([
    'Read', 'Write', 'Edit', 'Bash',
    'memory_search', 'memory_update'
  ]);
  
  protected async process(input: PostToolUseInput): Promise<HookOutput> {
    const { tool_name, tool_input, tool_output, tool_status } = input;
    
    // 1. 检查是否需要捕获
    if (!PostToolUseHook.OBSERVATION_TOOLS.has(tool_name)) {
      return STANDARD_HOOK_RESPONSE;
    }
    
    // 2. 异步处理观察（不阻塞）
    this.processObservationAsync(input).catch(error => {
      this.logger.error('Failed to process observation', error);
    });
    
    return STANDARD_HOOK_RESPONSE;
  }
  
  private async processObservationAsync(input: PostToolUseInput): Promise<void> {
    const { session_key, tool_name, tool_input, tool_output, tool_status } = input;
    
    // 1. 隐私标签剥离
    const sanitizedOutput = this.stripPrivateTags(tool_output);
    const sanitizedInput = this.stripPrivateTags(JSON.stringify(tool_input));
    
    // 2. 噪声过滤
    if (this.isNoiseOutput(sanitizedOutput)) {
      return;
    }
    
    // 3. 创建观察记录
    const observation: ObservationInput = {
      type: this.classifyObservationType(tool_name, tool_status),
      title: this.generateTitle(tool_name, tool_input),
      narrative: this.generateNarrative(tool_name, tool_input, sanitizedOutput),
      files_read: this.extractFilesRead(tool_name, tool_input),
      files_modified: this.extractFilesModified(tool_name, tool_input),
      importance: this.assessImportance(tool_name, tool_output),
      discovery_tokens: this.estimateTokens(sanitizedOutput)
    };
    
    // 4. 存储观察
    await this.memoryManager.storeObservation(session_key, observation);
    
    // 5. 更新领域状态
    await this.updateDomainState(input, observation);
  }
  
  private stripPrivateTags(text: string): string {
    return text.replace(/<private>[\s\S]*?<\/private>/gi, '[REDACTED]');
  }
  
  private isNoiseOutput(output: string): boolean {
    // 过滤空输出、错误消息、无关内容
    if (!output || output.trim().length < 10) return true;
    if (output.includes('Error:') && output.length < 100) return true;
    return false;
  }
  
  private classifyObservationType(toolName: string, status: string): ObservationType {
    if (status === 'error') return 'bugfix';
    if (toolName === 'Write' || toolName === 'Edit') return 'change';
    if (toolName === 'Read') return 'discovery';
    return 'change';
  }
  
  private assessImportance(toolName: string, output: string): Importance {
    // 基于启发式规则评估重要性
    const hasDecision = output.includes('决定') || output.includes('选择');
    const hasBreakthrough = output.includes('解决') || output.includes('发现');
    
    if (hasBreakthrough) return 'breakthrough';
    if (hasDecision) return 'significant';
    return 'routine';
  }
}
```

### 5.4 Stop Hook

```typescript
/**
 * Stop Hook处理器
 * 生成会话摘要，更新认知状态
 */
export class StopHook extends BaseHookHandler<StopInput, HookOutput> {
  
  protected async process(input: StopInput): Promise<HookOutput> {
    const { session_key, stop_reason } = input;
    
    // 1. 异步生成摘要（不阻塞）
    this.generateSummaryAsync(input).catch(error => {
      this.logger.error('Failed to generate summary', error);
    });
    
    // 2. 更新会话状态
    await this.memoryManager.updateSessionStatus(
      session_key,
      stop_reason === 'complete' ? 'completed' : 'error'
    );
    
    return STANDARD_HOOK_RESPONSE;
  }
  
  private async generateSummaryAsync(input: StopInput): Promise<void> {
    const { session_key, tenant_id, user_id, plugin_id } = input;
    
    // 1. 获取会话消息
    const messages = await this.memoryManager.getSessionMessages(session_key);
    
    if (messages.length < 3) {
      // 消息太少，跳过摘要生成
      return;
    }
    
    // 2. 调用LLM生成摘要
    const summary = await this.callSummaryLLM(messages);
    
    // 3. 存储摘要
    await this.memoryManager.storeSummary(session_key, summary);
    
    // 4. 更新领域状态
    await this.memoryManager.updateDomainState(
      tenant_id,
      user_id,
      plugin_id,
      {
        thinking_stage: summary.thinking_stage,
        open_questions: summary.open_questions,
        decisions: summary.decisions,
        concepts: summary.concepts,
        key_insights: summary.key_insights
      }
    );
    
    // 5. 提取关键事实
    const facts = this.extractFacts(summary);
    for (const fact of facts) {
      await this.memoryManager.storeFact(tenant_id, user_id, fact);
    }
  }
  
  private async callSummaryLLM(messages: Message[]): Promise<SummaryInput> {
    // 调用LLM API生成结构化摘要
    // 实现略...
  }
  
  private extractFacts(summary: SummaryInput): FactInput[] {
    // 从摘要中提取关键事实
    const facts: FactInput[] = [];
    
    // 提取决策作为事实
    for (const decision of summary.decisions || []) {
      facts.push({
        content: decision,
        category: 'decision',
        importance: 'significant'
      });
    }
    
    return facts;
  }
}
```

---

## 六、Hook注册与调度

### 6.1 Hook注册中心

```typescript
/**
 * Hook注册中心
 */
export class HookRegistry {
  private handlers: Map<string, HookHandlerEntry[]> = new Map();
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('HookRegistry');
  }
  
  /**
   * 注册Hook处理器
   */
  register(
    hookType: string,
    handler: BaseHookHandler<any, any>,
    config: HookConfig
  ): void {
    const entry: HookHandlerEntry = {
      handler,
      matcher: new RegExp(config.matcher || '*'),
      priority: config.priority || 50,
      async: config.async ?? false,
      timeout: config.timeout || 60
    };
    
    if (!this.handlers.has(hookType)) {
      this.handlers.set(hookType, []);
    }
    
    this.handlers.get(hookType)!.push(entry);
    
    // 按优先级排序
    this.handlers.get(hookType)!.sort((a, b) => b.priority - a.priority);
    
    this.logger.info(`Registered hook: ${hookType} -> ${handler.constructor.name}`);
  }
  
  /**
   * 获取匹配的处理器
   */
  getHandlers(hookType: string, context: string): HookHandlerEntry[] {
    const handlers = this.handlers.get(hookType) || [];
    
    return handlers.filter(entry => {
      if (entry.matcher.source === '.*') return true;  // 匹配所有
      return entry.matcher.test(context);
    });
  }
}

interface HookHandlerEntry {
  handler: BaseHookHandler<any, any>;
  matcher: RegExp;
  priority: number;
  async: boolean;
  timeout: number;
}

interface HookConfig {
  matcher?: string;
  priority?: number;
  async?: boolean;
  timeout?: number;
}
```

### 6.2 Hook调度器

```typescript
/**
 * Hook调度器
 */
export class HookDispatcher {
  private registry: HookRegistry;
  private logger: Logger;
  
  constructor(registry: HookRegistry) {
    this.registry = registry;
    this.logger = new Logger('HookDispatcher');
  }
  
  /**
   * 分发Hook事件
   */
  async dispatch<TInput extends HookInput>(
    hookType: string,
    input: TInput
  ): Promise<HookOutput[]> {
    const context = this.getContext(hookType, input);
    const handlers = this.registry.getHandlers(hookType, context);
    
    const results: HookOutput[] = [];
    
    for (const entry of handlers) {
      try {
        const result = await this.executeWithTimeout(
          entry.handler,
          input,
          entry.timeout * 1000
        );
        
        results.push(result);
        
        // 如果处理器返回 continue: false，停止后续处理
        if (!result.continue) {
          this.logger.warn(`Hook ${hookType} returned continue: false`);
          break;
        }
        
      } catch (error) {
        this.logger.error(`Hook ${hookType} execution failed`, error);
        
        // 异步处理器失败不影响主流程
        if (!entry.async) {
          results.push({
            continue: true,
            suppress_output: true,
            status: 'error',
            message: (error as Error).message
          });
        }
      }
    }
    
    return results;
  }
  
  private async executeWithTimeout<TInput, TOutput>(
    handler: BaseHookHandler<TInput, TOutput>,
    input: TInput,
    timeoutMs: number
  ): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Hook timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      handler.execute(input)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
  
  private getContext(hookType: string, input: HookInput): string {
    // 根据Hook类型获取匹配上下文
    switch (hookType) {
      case 'SessionStart':
        return (input as SessionStartInput).source || 'startup';
      case 'PostToolUse':
        return (input as PostToolUseInput).tool_name || '*';
      default:
        return '*';
    }
  }
}
```

---

## 七、与Agent框架的集成

### 7.1 集成点实现

```typescript
/**
 * Agent运行器中的Hook集成
 * 文件: src/agents/pi-embedded-runner.ts
 */
export class PIEmbeddedRunner {
  private hookDispatcher: HookDispatcher;
  
  async run(input: RunnerInput): Promise<RunnerOutput> {
    // 1. SessionStart Hook
    const startResults = await this.hookDispatcher.dispatch('SessionStart', {
      hook_event_name: 'SessionStart',
      session_key: input.session_key,
      tenant_id: input.tenant_id,
      plugin_id: input.plugin_id,
      session_id: input.session_id,
      user_id: input.user_id,
      user_name: input.user_name,
      cwd: input.cwd,
      source: input.source,
      timestamp: new Date().toISOString()
    });
    
    // 提取注入的上下文
    let injectedContext = '';
    for (const result of startResults) {
      if ('hook_specific_output' in result && result.hook_specific_output) {
        injectedContext += result.hook_specific_output.output + '\n';
      }
    }
    
    // 2. 运行Agent循环
    for await (const message of this.runAgentLoop(input, injectedContext)) {
      // 处理消息...
      
      // 3. PostToolUse Hook (工具调用后)
      if (message.type === 'tool_result') {
        await this.hookDispatcher.dispatch('PostToolUse', {
          hook_event_name: 'PostToolUse',
          session_key: input.session_key,
          // ... 其他字段
          tool_name: message.tool_name,
          tool_input: message.tool_input,
          tool_output: message.tool_output,
          tool_status: message.tool_status,
          execution_time_ms: message.execution_time_ms
        });
      }
    }
    
    // 4. Stop Hook
    await this.hookDispatcher.dispatch('Stop', {
      hook_event_name: 'Stop',
      session_key: input.session_key,
      // ... 其他字段
      stop_reason: 'complete'
    });
  }
}
```

### 7.2 初始化配置

```typescript
/**
 * 记忆系统初始化
 * 文件: src/memory/index.ts
 */
export function initializeMemorySystem(config: MemoryConfig): HookDispatcher {
  const memoryManager = new MemoryManager(config);
  const registry = new HookRegistry();
  
  // 注册Hook处理器
  registry.register('SessionStart', new SessionStartHook(memoryManager), {
    matcher: 'startup|resume',
    priority: 100,
    async: false,
    timeout: 60
  });
  
  registry.register('UserPromptSubmit', new UserPromptSubmitHook(memoryManager), {
    matcher: '*',
    priority: 100,
    async: true,
    timeout: 30
  });
  
  registry.register('PostToolUse', new PostToolUseHook(memoryManager), {
    matcher: 'Read|Write|Edit|Bash|memory_*',
    priority: 50,
    async: true,
    timeout: 120
  });
  
  registry.register('Stop', new StopHook(memoryManager), {
    matcher: '*',
    priority: 100,
    async: true,
    timeout: 180
  });
  
  return new HookDispatcher(registry);
}
```

---

## 八、错误处理与监控

### 8.1 错误处理策略

| 错误类型 | 处理策略 | 影响 |
|----------|----------|------|
| Hook超时 | 记录日志，继续执行 | 不影响主流程 |
| Hook异常 | 记录日志，继续执行 | 不影响主流程 |
| 内存服务不可用 | 降级为无记忆模式 | 影响上下文注入 |
| 数据库错误 | 重试3次，记录日志 | 影响数据持久化 |

### 8.2 监控指标

```typescript
/**
 * Hook监控指标
 */
interface HookMetrics {
  // 执行统计
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  timeout_executions: number;
  
  // 性能统计
  avg_execution_time_ms: number;
  p95_execution_time_ms: number;
  max_execution_time_ms: number;
  
  // 按Hook类型统计
  by_type: Record<string, {
    count: number;
    avg_time_ms: number;
    error_rate: number;
  }>;
}
```

### 8.3 日志格式

```
[timestamp] [LEVEL] [HookName] [session_key] message {context}
```

**示例：**
```
[2026-03-21T10:30:00.000Z] [INFO] [SessionStartHook] [tenant1:hr:session-001] Injected context: 1500 tokens
[2026-03-21T10:30:05.000Z] [INFO] [PostToolUseHook] [tenant1:hr:session-001] Stored observation: Read config.json
[2026-03-21T10:35:00.000Z] [ERROR] [StopHook] [tenant1:hr:session-001] Summary generation failed: LLM timeout
```

---

## 九、扩展机制

### 9.1 自定义Hook

```typescript
/**
 * 自定义Hook处理器示例
 */
export class CustomAuditHook extends BaseHookHandler<PostToolUseInput, HookOutput> {
  
  protected async process(input: PostToolUseInput): Promise<HookOutput> {
    // 自定义审计逻辑
    await this.auditToolCall(input);
    return STANDARD_HOOK_RESPONSE;
  }
  
  private async auditToolCall(input: PostToolUseInput): Promise<void> {
    // 实现审计逻辑...
  }
}

// 注册自定义Hook
registry.register('PostToolUse', new CustomAuditHook(memoryManager), {
  matcher: 'Bash',  // 只审计Bash命令
  priority: 200,    // 高优先级
  async: true
});
```

### 9.2 Hook链

```typescript
/**
 * Hook链执行
 * 多个Hook按优先级顺序执行
 */
async function executeHookChain(
  hookType: string,
  input: HookInput
): Promise<void> {
  const handlers = registry.getHandlers(hookType, getContext(input));
  
  for (const entry of handlers) {
    const result = await entry.handler.execute(input);
    
    // 可以修改input传递给下一个Handler
    if (result.modified_input) {
      input = { ...input, ...result.modified_input };
    }
    
    // 如果需要中断链
    if (!result.continue) {
      break;
    }
  }
}
```

---

*文档版本: 1.0*
*创建日期: 2026-03-21*
*作者: Winston (Architect Agent)*
