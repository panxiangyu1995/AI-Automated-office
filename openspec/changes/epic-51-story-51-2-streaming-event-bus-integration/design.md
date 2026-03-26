# Design: 主Agent协调器 - 流式事件总线集成

## 技术方案

### 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 1 - Agent Runtime端到端集成
- **实现方式**: 前后端协作，后端为主

### 前端实现

#### 1. 事件类型扩展

```typescript
// src/features/streaming/runtime/runtimeEvents.ts
enum RuntimeEventType {
  // 现有事件
  SessionStarted = 'session_started',
  SessionEnded = 'session_ended',

  // 新增细粒度事件
  Thinking = 'thinking',           // AI正在思考
  ToolCalling = 'tool_calling',     // 工具调用开始
  ToolResult = 'tool_result',       // 工具调用结果
  ConfirmationNeeded = 'confirmation_needed', // 需要用户确认
  Progress = 'progress',            // 执行进度
  StreamChunk = 'stream_chunk',     // 流式输出片段
}

interface RuntimeEvent {
  type: RuntimeEventType;
  session_id: string;
  timestamp: number;
  payload: RuntimeEventPayload;
}
```

#### 2. StreamingHostContext 扩展

```typescript
interface StreamingHostContext {
  // 事件订阅
  onThinking(callback: (data: ThinkingEvent) => void): void;
  onToolCalling(callback: (data: ToolCallingEvent) => void): void;
  onToolResult(callback: (data: ToolResultEvent) => void): void;
  onConfirmationNeeded(callback: (data: ConfirmationEvent) => void): void;

  // 事件转发到前端组件
  subscribe(sessionId: string): void;
  unsubscribe(sessionId: string): void;
}
```

#### 3. 新增展示组件

| 组件 | 职责 |
|------|------|
| `ThinkingDisplay.tsx` | 展示AI思考过程，带打字机效果 |
| `ToolCallDisplay.tsx` | 展示工具调用状态和结果 |
| `ConfirmationDialog.tsx` | 展示需要用户确认的内容 |
| `ProgressBar.tsx` | 展示执行进度 |

### 后端实现 (Rust)

#### 1. 事件定义扩展

```rust
// src-tauri/src/agent/events.rs

#[derive(Clone, Debug)]
pub enum OrchestratorEvent {
    // 基础事件
    StateChanged { session_id: String, state: ExecutionState },

    // 新增细粒度事件
    Thinking { session_id: String, content: String },
    ToolCalling {
        session_id: String,
        tool_name: String,
        tool_args: Value,
    },
    ToolResult {
        session_id: String,
        tool_name: String,
        result: Value,
        duration_ms: u64,
    },
    ConfirmationNeeded {
        session_id: String,
        title: String,
        message: String,
        options: Vec<ConfirmationOption>,
    },
    Progress {
        session_id: String,
        current: u32,
        total: u32,
        message: String,
    },
}
```

#### 2. 流式推送实现

```rust
// src-tauri/src/agent/stream.rs

pub trait EventStream: Send + Sync {
    /// 发送事件到前端
    fn send(&self, event: OrchestratorEvent) -> Result<()>;

    /// 订阅会话事件
    fn subscribe(&self, session_id: &str) -> Result<()>;

    /// 取消订阅
    fn unsubscribe(&self, session_id: &str) -> Result<()>;
}
```

#### 3. 与Tauri集成

```rust
// 使用 Tauri Event 系统推送事件
#[tauri::command]
async fn subscribe_events(
    session_id: String,
    window: Window,
) -> Result<(), String> {
    let event_bus = event_bus().await?;
    event_bus.subscribe(&session_id, move |event| {
        let _ = window.emit("agent::event", event);
    }).map_err(|e| e.to_string())?;
    Ok(())
}
```

## 组件设计

### 新增组件

| 组件 | 类型 | 职责 |
|------|------|------|
| `ThinkingDisplay.tsx` | React组件 | 展示思考过程，带动画效果 |
| `ToolCallDisplay.tsx` | React组件 | 展示工具调用详情 |
| `ConfirmationDialog.tsx` | React组件 | 用户确认对话框 |
| `events.rs` | Rust模块 | 事件类型定义 |
| `stream.rs` | Rust模块 | 流式推送实现 |

### 修改组件

| 组件 | 修改内容 |
|------|----------|
| `runtimeEvents.ts` | 添加细粒度事件类型 |
| `streamingHostContext.tsx` | 扩展订阅接口 |

## 状态管理

```typescript
// stores/streamingStore.ts
interface StreamingState {
  events: Map<string, RuntimeEvent[]>;  // session_id -> events
  activeThinking: Map<string, string>;   // session_id -> thinking content
  pendingConfirmations: Map<string, ConfirmationEvent>;
}
```

## 安全考虑

- 事件内容需经过敏感信息过滤
- 事件频率需限制，防止DDoS
- 确认对话框需防止劫持

## 性能考虑

- 事件节流：thinking 事件最多每 100ms 一个
- 虚拟列表：消息列表只渲染可见区域
- 事件缓冲：批量发送减少网络开销
- 内存限制：单会话最多保留1000条事件
