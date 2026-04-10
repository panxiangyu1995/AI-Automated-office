# Agent模块前后端集成对齐

## Overview

审查和修复Agent模块的前后端命令对齐问题，确保Tauri命令和前端invoke调用参数类型一致。

## Motivation

代码扫描发现前后端集成存在以下问题：
1. 命令契约需审查
2. 参数类型可能不一致
3. 缺少参数验证

## Files to Review

### Frontend
- `src/features/agent/api/intercom.ts` - 消息API
- `src/features/agent/services/subagent.ts` - SubAgent API
- `src/features/agent/hooks/useAgentIntercom.ts` - 消息Hook

### Backend
- `src-tauri/src/commands/intercom.rs` - 消息命令
- `src-tauri/src/commands/subagent.rs` - SubAgent命令

## Specification

### 1. 命令契约审查

#### intercom命令审查

**Frontend调用**:
```typescript
// src/features/agent/api/intercom.ts

export async function sendAgentMessage(params: {
  agentId: string;
  content: string;
  messageType?: 'text' | 'tool_call' | 'tool_result';
  sessionId?: string;
}): Promise<SendMessageResult>

export async function getAgentMessages(params: {
  agentId: string;
  limit?: number;
  before?: string;
}): Promise<Message[]>

export async function updateAgentMessageStatus(params: {
  messageId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}): Promise<boolean>

export async function setAgentPermission(params: {
  agentId: string;
  permission: AgentPermission;
}): Promise<boolean>
```

**Backend定义** (commands/intercom.rs):
```rust
#[tauri::command]
async fn send_agent_message(
    agent_id: String,
    content: String,
    message_type: Option<String>,
    session_id: Option<String>,
) -> Result<SendMessageResult, String>

#[tauri::command]
async fn get_agent_messages(
    agent_id: String,
    limit: Option<i32>,
    before: Option<String>,
) -> Result<Vec<Message>, String>

#[tauri::command]
async fn update_agent_message_status(
    message_id: String,
    status: String,
) -> Result<bool, String>

#[tauri::command]
async fn set_agent_permission(
    agent_id: String,
    permission: PermissionConfig,
) -> Result<bool, String>
```

**问题发现**:
1. 前端参数用camelCase，后端用snake_case
2. 前端`messageType`对应后端`message_type`
3. `status`参数类型需统一枚举

### 2. SubAgent命令审查

**Frontend调用**:
```typescript
// src/features/agent/services/subagent.ts

export async function getAvailableSubagents(): Promise<AgentConfig[]>
export async function getSubagentConfig(name: string): Promise<AgentConfig | null>
export async function createPersonalSubagent(params: CreateSubagentParams): Promise<AgentConfig>
```

**Backend定义** (commands/subagent.rs):
```rust
#[tauri::command]
async fn get_available_subagents() -> Result<Vec<AgentConfig>, String>

#[tauri::command]
async fn get_subagent_config(name: String) -> Result<Option<AgentConfig>, String>

#[tauri::command]
async fn create_personal_subagent(
    name: String,
    description: String,
    config: serde_json::Value,
) -> Result<AgentConfig, String>
```

**问题发现**:
1. 前端createPersonalSubagent接受对象，后端接受分离参数
2. 需要生成TypeScript类型定义

### 3. 类型定义生成

创建共享类型文件：

```typescript
// src/types/agent-types.ts

// 消息状态枚举
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

// 消息类型枚举
export type MessageType = 'text' | 'tool_call' | 'tool_result';

// 消息接口
export interface Message {
  id: string;
  agentId: string;
  content: string;
  messageType: MessageType;
  status: MessageStatus;
  createdAt: string;
}

// Agent配置接口
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### 4. 参数验证

**后端添加验证**:
```rust
#[tauri::command]
async fn send_agent_message(
    agent_id: String,
    content: String,
    message_type: Option<String>,
    session_id: Option<String>,
) -> Result<SendMessageResult, String> {
    // 参数验证
    if agent_id.is_empty() {
        return Err("agent_id cannot be empty".to_string());
    }
    if content.is_empty() {
        return Err("content cannot be empty".to_string());
    }
    if content.len() > 10000 {
        return Err("content exceeds maximum length".to_string());
    }
    
    // 业务逻辑...
}
```

---

## Testing

1. `cargo build` - 编译检查
2. `npm run build` - 构建检查
3. 手动测试各API调用
