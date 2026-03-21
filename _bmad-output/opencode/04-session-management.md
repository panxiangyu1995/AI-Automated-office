# 四、会话管理机制

## 4.1 会话数据结构

### 4.1.1 会话 ID 类型

```typescript
// 使用 Effect Schema 定义品牌类型
export const SessionID = Schema.String.pipe(
  Schema.brand("SessionID"),
  withStatics((s) => ({
    make: (id: string) => s.makeUnsafe(id),
    descending: (id?: string) => s.makeUnsafe(Identifier.descending("session", id)),
    zod: Identifier.schema("session").pipe(z.custom<Schema.Schema.Type<typeof s>>()),
  })),
)

export const MessageID = Schema.String.pipe(
  Schema.brand("MessageID"),
  withStatics((s) => ({
    make: (id: string) => s.makeUnsafe(id),
    ascending: (id?: string) => s.makeUnsafe(Identifier.ascending("message", id)),
  })),
)

export const PartID = Schema.String.pipe(
  Schema.brand("PartID"),
  withStatics((s) => ({
    make: (id: string) => s.makeUnsafe(id),
    ascending: (id?: string) => s.makeUnsafe(Identifier.ascending("part", id)),
  })),
)
```

### 4.1.2 消息结构

消息由多个 Part（分片）组成：

```typescript
// 消息类型
type Message = UserMessage | AssistantMessage

// 用户消息
interface UserMessage {
  id: MessageID
  sessionID: SessionID
  type: "user"
  time: { created: number }
  parts: Part[]
}

// 助手消息
interface AssistantMessage {
  id: MessageID
  sessionID: SessionID
  type: "assistant"
  agent: string
  time: { created: number; completed?: number }
  parts: Part[]
  tokens?: { input: number; output: number }
  cost?: number
  finish?: string
  error?: Error
}
```

### 4.1.3 消息分片类型

```typescript
// 文本分片
interface TextPart {
  id: PartID
  sessionID: SessionID
  messageID: MessageID
  type: "text"
  text: string
  time?: { start: number; end?: number }
  metadata?: Record<string, any>
}

// 工具调用分片
interface ToolPart {
  id: PartID
  sessionID: SessionID
  messageID: MessageID
  type: "tool"
  tool: string
  callID: string
  state: {
    status: "pending" | "running" | "completed" | "error"
    input: any
    output?: string
    error?: string
    time: { start: number; end?: number }
    metadata?: Record<string, any>
  }
}

// 文件分片
interface FilePart {
  id: PartID
  sessionID: SessionID
  messageID: MessageID
  type: "file"
  mime: string
  filename?: string
  url: string
  source?: FileSource
}

// 推理分片
interface ReasoningPart {
  id: PartID
  sessionID: SessionID
  messageID: MessageID
  type: "reasoning"
  text: string
  time: { start: number; end?: number }
  metadata?: Record<string, any>
}

// 其他分片类型
type Part = 
  | TextPart 
  | ToolPart 
  | FilePart 
  | ReasoningPart
  | SnapshotPart
  | PatchPart
  | CompactionPart
  | SubtaskPart
  | RetryPart
  | StepStartPart
  | StepFinishPart
```

## 4.2 会话处理器

### 4.2.1 处理器创建

```typescript
export function create(input: {
  assistantMessage: MessageV2.Assistant
  sessionID: SessionID
  model: Provider.Model
  abort: AbortSignal
}) {
  const toolcalls: Record<string, MessageV2.ToolPart> = {}
  let snapshot: string | undefined
  let blocked = false
  let attempt = 0
  let needsCompaction = false
  
  return {
    get message() {
      return input.assistantMessage
    },
    
    partFromToolCall(toolCallID: string) {
      return toolcalls[toolCallID]
    },
    
    async process(streamInput: LLM.StreamInput) {
      // 处理逻辑
    }
  }
}
```

### 4.2.2 处理流程

```typescript
async process(streamInput: LLM.StreamInput) {
  while (true) {
    try {
      // 1. 调用 LLM
      const stream = await LLM.stream(streamInput)
      
      // 2. 处理响应流
      for await (const value of stream.fullStream) {
        input.abort.throwIfAborted()
        
        switch (value.type) {
          case "start":
            SessionStatus.set(input.sessionID, { type: "busy" })
            break
            
          case "text-start":
            // 创建文本分片
            break
            
          case "text-delta":
            // 更新文本内容
            break
            
          case "text-end":
            // 完成文本分片
            break
            
          case "tool-call":
            // 处理工具调用
            break
            
          case "tool-result":
            // 处理工具结果
            break
            
          case "tool-error":
            // 处理工具错误
            break
            
          case "finish-step":
            // 完成一步，记录 token 使用
            break
        }
      }
    } catch (e: any) {
      // 错误处理
      const error = MessageV2.fromError(e, { providerID: input.model.providerID })
      
      // 检查是否需要压缩
      if (MessageV2.ContextOverflowError.isInstance(error)) {
        needsCompaction = true
        break
      }
      
      // 检查是否可重试
      const retry = SessionRetry.retryable(error)
      if (retry !== undefined) {
        attempt++
        await sleep(delay)
        continue
      }
      
      // 记录错误
      input.assistantMessage.error = error
      break
    }
    
    // 返回处理结果
    if (needsCompaction) return "compact"
    if (blocked) return "stop"
    if (input.assistantMessage.error) return "stop"
    return "continue"
  }
}
```

## 4.3 LLM 调用封装

### 4.3.1 流式调用

```typescript
export async function stream(input: StreamInput) {
  // 1. 获取模型配置
  const [language, cfg, provider, auth] = await Promise.all([
    Provider.getLanguage(input.model),
    Config.get(),
    Provider.getProvider(input.model.providerID),
    Auth.get(input.model.providerID),
  ])
  
  // 2. 构建系统提示词
  const system = []
  system.push([
    input.agent.prompt || SystemPrompt.provider(input.model),
    ...input.system,
    ...(input.user.system ? [input.user.system] : []),
  ].filter(Boolean).join("\n"))
  
  // 3. 插件转换系统提示词
  await Plugin.trigger(
    "experimental.chat.system.transform",
    { sessionID: input.sessionID, model: input.model },
    { system }
  )
  
  // 4. 解析工具
  const tools = await resolveTools(input)
  
  // 5. 调用 streamText
  return streamText({
    model: language,
    messages: [
      ...system.map(x => ({ role: "system", content: x })),
      ...input.messages
    ],
    tools,
    toolChoice: input.toolChoice,
    temperature: input.agent.temperature,
    abortSignal: input.abort,
    // ... 其他参数
  })
}
```

### 4.3.2 工具解析

```typescript
export async function resolveTools(input: StreamInput): Promise<Record<string, Tool>> {
  const result: Record<string, Tool> = {}
  
  // 1. 获取内置工具
  const allTools = await ToolRegistry.tools(input.model, input.agent)
  
  // 2. 转换为 AI SDK 格式
  for (const tool of allTools) {
    result[tool.id] = tool({
      description: tool.description,
      parameters: tool.parameters,
      execute: async (args) => {
        // 工具执行逻辑在 SessionProcessor 中处理
      }
    })
  }
  
  // 3. 添加 MCP 工具
  const mcpTools = await MCP.tools()
  Object.assign(result, mcpTools)
  
  return result
}
```

## 4.4 会话状态管理

### 4.4.1 状态类型

```typescript
type SessionStatus = 
  | { type: "idle" }
  | { type: "busy" }
  | { type: "retry"; attempt: number; message: string; next: number }
```

### 4.4.2 状态更新

```typescript
// 设置状态
SessionStatus.set(sessionID, { type: "busy" })
SessionStatus.set(sessionID, { type: "idle" })
SessionStatus.set(sessionID, { type: "retry", attempt: 1, message: "Rate limited", next: Date.now() + 1000 })

// 获取状态
const status = SessionStatus.get(sessionID)
```

## 4.5 会话压缩机制

### 4.5.1 压缩触发条件

```typescript
export async function isOverflow(input: {
  tokens: { input: number; output: number }
  model: Provider.Model
}): Promise<boolean> {
  const total = input.tokens.input + input.tokens.output
  const limit = input.model.contextWindow * 0.8  // 80% 阈值
  return total > limit
}
```

### 4.5.2 压缩策略

```typescript
export async function compact(sessionID: SessionID): Promise<void> {
  // 1. 获取消息历史
  const messages = await MessageV2.list(sessionID)
  
  // 2. 生成摘要
  const summary = await generateSummary(messages)
  
  // 3. 创建压缩分片
  await Session.updatePart({
    id: PartID.ascending(),
    sessionID,
    messageID: messages[0].id,
    type: "compaction",
    auto: true,
  })
  
  // 4. 删除旧消息
  await MessageV2.deleteOld(sessionID, { keepRecent: 10 })
  
  // 5. 添加摘要消息
  await MessageV2.create({
    sessionID,
    type: "user",
    parts: [{
      type: "text",
      text: `[Context Summary]\n${summary}`
    }]
  })
}
```

## 4.6 快照和回滚

### 4.6.1 快照创建

```typescript
export async function track(): Promise<string | undefined> {
  // 1. 获取当前文件系统状态
  const files = await git.status()
  
  // 2. 创建快照 ID
  const snapshotID = Identifier.ascending("snapshot")
  
  // 3. 保存快照
  await saveSnapshot(snapshotID, files)
  
  return snapshotID
}
```

### 4.6.2 补丁生成

```typescript
export async function patch(snapshot: string): Promise<{
  hash: string
  files: string[]
}> {
  // 1. 获取当前状态
  const current = await git.status()
  
  // 2. 获取快照状态
  const previous = await loadSnapshot(snapshot)
  
  // 3. 计算差异
  const diff = await git.diff(previous, current)
  
  return {
    hash: computeHash(diff),
    files: diff.files
  }
}
```

### 4.6.3 回滚操作

```typescript
export async function revert(sessionID: SessionID, partID: PartID): Promise<void> {
  // 1. 获取补丁分片
  const patch = await Session.getPart(partID)
  
  // 2. 应用反向补丁
  await git.apply(patch.content, { reverse: true })
  
  // 3. 更新会话状态
  await Session.updatePart({
    ...patch,
    reverted: true
  })
}
```

## 4.7 消息持久化

### 4.7.1 数据库表结构

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  title TEXT,
  time_created INTEGER NOT NULL,
  time_updated INTEGER NOT NULL
);

CREATE TABLE message (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  time_created INTEGER NOT NULL,
  time_completed INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost REAL,
  finish TEXT,
  error TEXT,
  FOREIGN KEY (session_id) REFERENCES session(id)
);

CREATE TABLE part (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,  -- JSON
  time_created INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES session(id),
  FOREIGN KEY (message_id) REFERENCES message(id)
);
```

### 4.7.2 存储操作

```typescript
// 创建消息
await Session.updateMessage(message)

// 更新分片
await Session.updatePart(part)

// 更新分片增量
await Session.updatePartDelta({
  sessionID,
  messageID,
  partID,
  field: "text",
  delta: newText
})

// 获取消息列表
const messages = await MessageV2.list(sessionID)

// 获取分片列表
const parts = await MessageV2.parts(messageID)
```

## 4.8 对 AI-Automated-office 的参考价值

### 4.8.1 跨部门数据流转设计

```typescript
interface CrossDepartmentMessage {
  id: string
  fromDepartment: string
  toDepartment: string
  type: "request" | "response" | "notification"
  data: any
  time: number
  status: "pending" | "completed" | "error"
}

// 示例：销售部请求财务部审核
const message: CrossDepartmentMessage = {
  id: "msg-001",
  fromDepartment: "sales",
  toDepartment: "finance",
  type: "request",
  data: {
    action: "approve_discount",
    orderId: "ORD-2024-001",
    discount: 0.15,
    reason: "VIP 客户优惠"
  },
  time: Date.now(),
  status: "pending"
}
```

### 4.8.2 部门会话设计

```typescript
interface DepartmentSession {
  id: string
  department: string
  userId: string
  agent: string
  messages: DepartmentMessage[]
  context: {
    currentTask: string
    pendingApprovals: string[]
    linkedSessions: string[]  // 关联的其他部门会话
  }
}

// 示例：财务部会话
const financeSession: DepartmentSession = {
  id: "session-finance-001",
  department: "finance",
  userId: "user-001",
  agent: "finance-assistant",
  messages: [],
  context: {
    currentTask: "处理销售部折扣审批请求",
    pendingApprovals: ["approval-001"],
    linkedSessions: ["session-sales-001"]
  }
}
```

### 4.8.3 关键借鉴点

1. **消息分片设计** - 支持多种内容类型（文本、工具、文件）
2. **流式处理** - 实时响应用户
3. **压缩机制** - 自动处理上下文溢出
4. **快照回滚** - 支持操作撤销
5. **状态管理** - 清晰的会话状态流转

---

*下一章节: [05-mcp-integration.md](./05-mcp-integration.md) - MCP 集成方案*
