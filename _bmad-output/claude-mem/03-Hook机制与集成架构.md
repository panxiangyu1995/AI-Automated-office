# Hook机制与集成架构

## 钩子系统概述

Claude-Mem 通过 **Claude Code 插件钩子系统** 实现与宿主环境的集成。钩子是在特定生命周期事件触发时执行的脚本。

---

## 钩子配置

### hooks.json 结构

```json
{
  "description": "Claude-mem memory system hooks",
  "hooks": {
    "Setup": [...],
    "SessionStart": [...],
    "UserPromptSubmit": [...],
    "PostToolUse": [...],
    "Stop": [...]
  }
}
```

### 钩子类型

| 钩子类型 | 触发时机 | 匹配器 |
|----------|----------|--------|
| **Setup** | 插件安装时 | `*` |
| **SessionStart** | 会话启动时 | `startup\|clear\|compact` |
| **UserPromptSubmit** | 用户提交提示时 | 无匹配器（始终触发） |
| **PostToolUse** | 工具执行后 | `*` |
| **Stop** | Claude停止时 | 无匹配器 |

---

## 生命周期流程

```
┌─────────────────────────────────────────────────────────────────┐
│ 0. Setup Hook (插件安装时)                                       │
│    执行 setup.sh 初始化脚本                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. SessionStart Hook                                            │
│    ├── smart-install.js (依赖检查)                              │
│    ├── worker-service.cjs start (启动Worker)                    │
│    └── worker-service.cjs hook claude-code context (注入上下文)  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. UserPromptSubmit Hook                                        │
│    ├── worker-service.cjs start (确保Worker运行)                │
│    └── worker-service.cjs hook claude-code session-init         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PostToolUse Hook (每次工具执行后)                             │
│    ├── worker-service.cjs start (确保Worker运行)                │
│    └── worker-service.cjs hook claude-code observation          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Stop Hook                                                    │
│    ├── worker-service.cjs start (确保Worker运行)                │
│    └── worker-service.cjs hook claude-code summarize            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 钩子实现详解

### 1. Setup Hook

**配置**:
```json
{
  "Setup": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/scripts/setup.sh",
          "timeout": 120
        }
      ]
    }
  ]
}
```

**功能**: 执行插件安装初始化脚本

### 2. SessionStart Hook

**配置**:
```json
{
  "SessionStart": [
    {
      "matcher": "startup|clear|compact",
      "hooks": [
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/smart-install.js\"",
          "timeout": 300
        },
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" start",
          "timeout": 60
        },
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" hook claude-code context",
          "timeout": 60
        }
      ]
    }
  ]
}
```

**功能**:
1. 检查依赖更新（智能安装）
2. 启动Worker服务
3. 注入历史上下文

**源文件**: `src/hooks/context-hook.ts`

### 3. UserPromptSubmit Hook

**配置**:
```json
{
  "UserPromptSubmit": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" start",
          "timeout": 60
        },
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" hook claude-code session-init",
          "timeout": 60
        }
      ]
    }
  ]
}
```

**功能**:
1. 确保Worker运行
2. 初始化新会话记录

**源文件**: `src/hooks/new-hook.ts`

### 4. PostToolUse Hook

**配置**:
```json
{
  "PostToolUse": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" start",
          "timeout": 60
        },
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" hook claude-code observation",
          "timeout": 120
        }
      ]
    }
  ]
}
```

**功能**:
1. 确保Worker运行
2. 捕获工具执行观察

**源文件**: `src/hooks/save-hook.ts`

### 5. Stop Hook

**配置**:
```json
{
  "Stop": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" start",
          "timeout": 60
        },
        {
          "type": "command",
          "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/bun-runner.js\" \"${CLAUDE_PLUGIN_ROOT}/scripts/worker-service.cjs\" hook claude-code summarize",
          "timeout": 120
        }
      ]
    }
  ]
}
```

**功能**:
1. 确保Worker运行
2. 生成会话摘要

**源文件**: `src/hooks/summary-hook.ts`

---

## 钩子响应机制

### 标准响应

所有钩子返回标准JSON响应：

```typescript
export const STANDARD_HOOK_RESPONSE = JSON.stringify({
  continue: true,      // 继续处理
  suppressOutput: true // 抑制输出
});
```

### 退出码策略

| 退出码 | 含义 | 行为 |
|--------|------|------|
| 0 | 成功或优雅关闭 | Windows Terminal关闭标签页 |
| 1 | 非阻塞错误 | stderr显示给用户，继续执行 |
| 2 | 阻塞错误 | stderr传递给Claude处理 |

**设计哲学**: Worker/钩子错误使用退出码0，防止Windows Terminal标签页累积。包装器/插件层处理重启逻辑。

---

## 智能安装机制

### smart-install.js

**功能**: 缓存依赖检查器，仅在版本变更时运行完整安装。

**工作原理**:
1. 检查 `.install-version` 文件
2. 比较当前版本与存储版本
3. 版本不匹配时执行完整安装
4. 更新版本标记文件

**优势**:
- 减少会话启动时间
- 避免重复依赖检查
- 版本升级时自动更新

---

## Worker服务集成

### bun-runner.js

**功能**: Bun运行时包装器，确保使用Bun执行脚本。

**使用方式**:
```bash
node bun-runner.js <script-path> [args...]
```

**工作原理**:
1. 检测Bun是否安装
2. 使用Bun执行指定脚本
3. 传递所有参数

### worker-service.cjs

**功能**: Worker服务主入口，支持多种命令。

**命令模式**:
```bash
worker-service.cjs start              # 启动Worker守护进程
worker-service.cjs stop               # 停止Worker
worker-service.cjs restart            # 重启Worker
worker-service.cjs status             # 检查状态
worker-service.cjs hook <type> <hook> # 执行钩子命令
```

**Hook命令**:
- `hook claude-code context` - 注入上下文
- `hook claude-code session-init` - 初始化会话
- `hook claude-code observation` - 处理观察
- `hook claude-code summarize` - 生成摘要

---

## 上下文注入流程

### Context Hook工作流程

```
1. 接收stdin数据（会话信息）
         ↓
2. 解析项目名称和工作目录
         ↓
3. 确保Worker服务运行
         ↓
4. 调用 /api/context/inject 端点
         ↓
5. 接收格式化的上下文文本
         ↓
6. 构建响应（包含hookSpecificOutput）
         ↓
7. 输出到stdout
```

### 响应格式

```typescript
interface StatusOutput {
  continue: true;
  suppressOutput: true;
  status: 'ready' | 'error';
  message?: string;
}

function buildStatusOutput(
  status: 'ready' | 'error', 
  message?: string
): StatusOutput {
  return {
    continue: true,
    suppressOutput: true,
    status,
    ...(message && { message })
  };
}
```

---

## 隐私标签处理

### `<private>` 标签

用户可以使用 `<private>` 标签排除敏感内容：

```
<private>
  API_KEY=secret123
  PASSWORD=hidden
</private>
```

### 处理机制

**实现位置**: `src/utils/tag-stripping.ts`

**处理时机**: 钩子层（边缘处理）

**流程**:
1. 钩子接收原始数据
2. 剥离 `<private>` 标签及其内容
3. 清理后的数据发送到Worker/数据库

**效果**: 敏感内容永远不会进入存储系统。

---

## 进程管理

### PID文件

**位置**: `~/.claude-mem/.worker.pid`

**内容**:
```json
{
  "pid": 12345,
  "port": 37777,
  "startedAt": "2025-01-15T10:30:00.000Z"
}
```

### 健康检查

```typescript
async function ensureWorkerStarted(port: number): Promise<boolean> {
  // 检查Worker是否已运行且健康
  if (await waitForHealth(port, 1000)) {
    // 版本匹配检查
    const versionCheck = await checkVersionMatch(port);
    if (!versionCheck.matches) {
      // 版本不匹配，自动重启
      await httpShutdown(port);
      // ... 重启逻辑
    }
    return true;
  }
  
  // 检查端口是否被占用
  if (await isPortInUse(port)) {
    // 等待Worker变为健康
    return await waitForHealth(port, getPlatformTimeout(15000));
  }
  
  // 启动新的Worker守护进程
  const pid = spawnDaemon(__filename, port);
  // ... 等待健康检查
}
```

### 孤儿进程清理

**问题**: 僵尸进程累积（Issue #737）

**解决方案**:
1. `ProcessRegistry.ts` - 进程注册表
2. `startOrphanReaper()` - 定期清理（每5分钟）
3. PID捕获的自定义spawn函数

---

## Windows特殊处理

### 控制台弹窗问题

**问题**: MCP SDK子进程创建可见控制台窗口

**解决方案** (Issue #675):
- Windows上禁用Chroma向量搜索
- 使用 `windowsHide: true` 选项
- 冷却期机制防止重复spawn弹窗

### 冷却期机制

```typescript
const WINDOWS_SPAWN_COOLDOWN_MS = 2 * 60 * 1000; // 2分钟

function shouldSkipSpawnOnWindows(): boolean {
  if (process.platform !== 'win32') return false;
  const lockPath = getWorkerSpawnLockPath();
  if (!existsSync(lockPath)) return false;
  const modifiedTimeMs = statSync(lockPath).mtimeMs;
  return Date.now() - modifiedTimeMs < WINDOWS_SPAWN_COOLDOWN_MS;
}
```

---

## 构建流程

### 构建脚本

```bash
npm run build-and-sync
```

**步骤**:
1. `npm run build` - 构建钩子和Worker
2. `npm run sync-marketplace` - 同步到市场目录
3. 重启Worker服务

### esbuild配置

**输入**: `src/hooks/*.ts` (TypeScript)
**输出**: `plugin/scripts/*-hook.js` (ESM)

**特点**:
- ESM模块格式
- 内联版本号
- 外部依赖处理

---

## 调试支持

### 日志系统

**位置**: `~/.claude-mem/logs/`

**日志级别**:
- DEBUG (0)
- INFO (1)
- WARN (2)
- ERROR (3)

**日志格式**:
```
[timestamp] [LEVEL] [COMPONENT] [correlation-id] message {context}
```

### 日志查看

```bash
npm run worker:logs     # 查看最近50行
npm run worker:tail     # 实时跟踪
```
