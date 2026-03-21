# 一、整体架构设计

## 1.1 架构概览

OpenCode 采用**客户端/服务器架构**，核心设计理念：

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   TUI    │  │   Web    │  │ Desktop  │  │  Mobile  │   │
│  │ (终端)   │  │ (浏览器) │  │ (Tauri)  │  │  (未来)  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │ HTTP/SSE
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      服务器层 (Hono)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    API Routes                         │  │
│  │  session | message | file | mcp | permission | ...   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心业务层                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  Agent  │  │ Session │  │  Tool   │  │   MCP   │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │Provider │  │Permission│  │ Plugin  │  │Storage  │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据持久层                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SQLite (Drizzle ORM)                     │  │
│  │  sessions | messages | parts | permissions | config  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 1.2 核心模块职责

### 1.2.1 Agent 模块 (`packages/opencode/src/agent/`)

**职责:** 定义和管理 AI Agent

**核心文件:**
- `agent.ts` - Agent 定义、列表、生成

**关键概念:**
```typescript
interface AgentInfo {
  name: string           // Agent 名称（build, plan）
  mode: 'build' | 'plan' // 模式
  prompt: string         // 系统提示词
  permission: object     // 权限规则集
  options: object        // 模型选项
  temperature: number    // 温度参数
}
```

**内置 Agent:**
1. **build** - 完整访问权限，用于开发工作
2. **plan** - 只读权限，用于分析和规划

### 1.2.2 Session 模块 (`packages/opencode/src/session/`)

**职责:** 会话生命周期管理

**核心文件:**
- `index.ts` - 会话创建、列表、查询
- `processor.ts` - 消息处理核心逻辑
- `llm.ts` - LLM 调用封装
- `message-v2.ts` - 消息和消息分片定义
- `schema.ts` - ID 类型定义

**关键概念:**
```typescript
// 会话 ID
type SessionID = string & { readonly __brand: "SessionID" }

// 消息 ID
type MessageID = string & { readonly __brand: "MessageID" }

// 消息分片 ID
type PartID = string & { readonly __brand: "PartID" }
```

### 1.2.3 Tool 模块 (`packages/opencode/src/tool/`)

**职责:** 工具注册、定义、执行

**核心文件:**
- `tool.ts` - 工具定义接口
- `registry.ts` - 工具注册表
- `bash.ts`, `read.ts`, `edit.ts`, ... - 具体工具实现

**内置工具列表:**
| 工具 | 功能 |
|-----|------|
| bash | 执行 shell 命令 |
| read | 读取文件/目录 |
| write | 写入文件 |
| edit | 编辑文件（搜索替换） |
| glob | 文件模式匹配 |
| grep | 内容搜索 |
| task | 创建子任务 |
| webfetch | 获取网页内容 |
| websearch | 网页搜索 |
| todo | 任务列表管理 |
| question | 向用户提问 |
| skill | 执行技能 |
| lsp | LSP 操作 |

### 1.2.4 MCP 模块 (`packages/opencode/src/mcp/`)

**职责:** Model Context Protocol 集成

**核心文件:**
- `index.ts` - MCP 客户端管理、工具转换
- `auth.ts` - 认证逻辑
- `oauth-provider.ts` - OAuth 提供者

**关键功能:**
1. 连接 MCP 服务器
2. 发现 MCP 工具
3. 转换 MCP 工具为内部格式
4. 管理 OAuth 认证

### 1.2.5 Provider 模块 (`packages/opencode/src/provider/`)

**职责:** AI 提供商抽象层

**核心文件:**
- `provider.ts` - 提供商获取、模型获取
- `models.ts` - 模型信息获取（从 models.dev）
- `transform.ts` - 消息格式转换
- `auth.ts` - 提供商认证

**支持的提供商:**
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- Azure
- AWS Bedrock
- Groq
- Mistral
- Cohere
- OpenRouter
- 本地模型（通过 OpenAI 兼容接口）

### 1.2.6 Plugin 模块 (`packages/opencode/src/plugin/`)

**职责:** 插件/Hook 系统

**核心文件:**
- `index.ts` - 插件初始化、Hook 触发

**Hook 类型:**
```typescript
interface Hooks {
  // 系统提示词转换
  "experimental.chat.system.transform": (input, output) => void
  
  // 工具定义修改
  "tool.definition": (input, output) => void
  
  // Shell 环境变量
  "shell.env": (input, output) => void
  
  // 聊天参数修改
  "chat.params": (input, output) => void
  
  // 聊天请求头修改
  "chat.headers": (input, output) => void
}
```

### 1.2.7 Permission 模块 (`packages/opencode/src/permission/`)

**职责:** 权限控制

**核心文件:**
- `index.ts` - 权限请求和验证
- `schema.ts` - 权限类型定义
- `evaluate.ts` - 权限规则评估

**权限类型:**
- `bash` - Shell 命令执行权限
- `read` - 文件读取权限
- `write` - 文件写入权限
- `edit` - 文件编辑权限
- `external_directory` - 外部目录访问权限
- `doom_loop` - 死循环检测权限

### 1.2.8 Server 模块 (`packages/opencode/src/server/`)

**职责:** HTTP API 服务器

**核心文件:**
- `server.ts` - Hono 应用创建
- `routes/*.ts` - 各 API 路由

**API 路由:**
| 路由文件 | 功能 |
|---------|------|
| session.ts | 会话管理 |
| event.ts | SSE 事件流 |
| file.ts | 文件操作 |
| mcp.ts | MCP 管理 |
| permission.ts | 权限管理 |
| provider.ts | 提供商管理 |
| config.ts | 配置管理 |
| project.ts | 项目管理 |

### 1.2.9 Storage 模块 (`packages/opencode/src/storage/`)

**职责:** 数据持久化

**核心文件:**
- `db.ts` - 数据库连接
- `schema.sql.ts` - 表结构定义
- `storage.ts` - 存储操作封装

**数据表:**
- `session` - 会话信息
- `message` - 消息记录
- `part` - 消息分片
- `permission` - 权限记录
- `config` - 配置信息

## 1.3 数据流

### 1.3.1 用户消息处理流程

```
用户输入
    │
    ▼
┌─────────────┐
│ 创建消息    │
│ (User类型)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 解析消息    │
│ 提取工具引用│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 调用 LLM    │
│ streamText  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 处理响应流  │
│ - 文本      │
│ - 工具调用  │
│ - 推理      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 执行工具    │
│ (如有调用)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 循环处理    │
│ 直到完成    │
└─────────────┘
```

### 1.3.2 工具调用流程

```
LLM 返回工具调用
       │
       ▼
┌─────────────┐
│ 解析工具名  │
│ 和参数      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 权限检查    │
│ (如需要)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 执行工具    │
│ 获取结果    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 输出截断    │
│ (如需要)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 返回结果    │
│ 给 LLM      │
└─────────────┘
```

## 1.4 设计模式

### 1.4.1 依赖注入

通过 Context 传递依赖：

```typescript
interface Context {
  sessionID: SessionID
  messageID: MessageID
  callID: string
  abort: AbortSignal
  messages: ModelMessage[]
  ask: (permission: PermissionRequest) => Promise<void>
  metadata: (metadata: object) => void
  extra?: Record<string, any>
}
```

### 1.4.2 事件驱动

使用 Bus 系统进行组件间通信：

```typescript
Bus.publish(Session.Event.Error, {
  sessionID,
  error
})

Bus.subscribeAll(async (input) => {
  // 处理所有事件
})
```

### 1.4.3 插件模式

通过 Hook 点扩展功能：

```typescript
// 触发 Hook
await Plugin.trigger("tool.definition", { toolID }, output)

// 注册 Hook
hook["tool.definition"] = (input, output) => {
  // 修改 output
}
```

## 1.5 关键设计决策

### 1.5.1 为什么选择客户端/服务器架构？

1. **远程控制** - 可以从移动端控制本地开发环境
2. **多客户端** - TUI、Web、Desktop 共享同一后端
3. **资源隔离** - AI 调用和 UI 渲染分离
4. **可扩展性** - 易于添加新客户端

### 1.5.2 为什么选择 SQLite？

1. **本地优先** - 无需外部数据库服务
2. **性能** - 嵌入式数据库，零延迟
3. **简单** - 单文件，易于备份和迁移
4. **可靠** - ACID 事务支持

### 1.5.3 为什么选择 SolidJS？

1. **性能** - 细粒度响应式，无虚拟 DOM
2. **简单** - 类似 React 的心智模型
3. **体积** - 编译后体积小
4. **灵活** - 支持服务端渲染

---

*下一章节: [02-agent-system.md](./02-agent-system.md) - Agent 系统实现*
