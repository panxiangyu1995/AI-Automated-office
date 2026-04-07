# Design: Agent-to-Agent通信后端集成

## 技术架构

### 1. 消息流程

```
用户输入 → 权限校验 → 消息队列 → Agent接收方 → 状态更新 → 审计日志
                ↓
           发送确认（FR60）
```

### 2. 核心组件

#### 2.1 AgentIntercomService
- 管理Agent间消息路由
- 实现消息状态追踪
- 处理消息确认逻辑

#### 2.2 AgentPermissionMiddleware
- 校验发送方权限
- 校验接收方接受权限
- 防止未授权访问

#### 2.3 AuditLogger
- 记录所有Agent间通信
- 支持查询和导出

### 3. 参与者ID格式

遵循FR600统一格式：
- `human:{user_id}` - 人类用户
- `agent:{agent_id}` - AI Agent
- `system:{system_id}` - 系统消息
- `group:{group_id}` - 群组

## 实现细节

### 1. 数据模型

```rust
pub struct AgentMessage {
    pub id: String,                    // UUID
    pub sender_type: ParticipantType,  // human/agent/system
    pub sender_id: String,             // 发送者ID
    pub receiver_type: ParticipantType, // 接收者类型（固定为agent）
    pub receiver_id: String,           // 接收者Agent ID
    pub content: MessageContent,       // 消息内容
    pub status: MessageStatus,         // sending/sent/delivered/read
    pub requires_confirmation: bool,  // FR60: 需确认标志
    pub created_at: i64,
    pub delivered_at: Option<i64>,
    pub read_at: Option<i64>,
}

pub enum ParticipantType {
    Human(String),
    Agent(String),
    System(String),
    Group(String),
}
```

### 2. 消息发送流程

```rust
pub async fn send_agent_message(
    &self,
    sender_id: String,
    receiver_id: String,
    content: MessageContent,
) -> Result<AgentMessage, AgentIntercomError> {
    // 1. 权限校验
    self.check_send_permission(&sender_id, &receiver_id).await?;
    
    // 2. 内容安全检查
    self.content_moderation(&content).await?;
    
    // 3. 创建消息
    let mut message = AgentMessage::new(sender_id, receiver_id, content);
    
    // 4. 如需确认，设置标志
    if self.requires_user_confirmation(&sender_id).await? {
        message.requires_confirmation = true;
        // 发送确认请求给用户
        self.notify_user_for_confirmation(&message).await?;
        return Ok(message);
    }
    
    // 5. 发送消息
    message.status = MessageStatus::Sent;
    self.save_message(&message).await?;
    self.deliver_message(&message).await?;
    
    // 6. 审计日志
    self.audit_log.record_send(&message).await?;
    
    Ok(message)
}
```

### 3. 权限控制（FR62, FR65）

```rust
pub struct AgentPermission {
    pub agent_id: String,
    pub can_send_to_agents: bool,
    pub allowed_receivers: Vec<String>,    // 允许接收的Agent列表
    pub blocked_receivers: Vec<String>,     // 禁止接收的Agent列表
    pub content_restrictions: Vec<String>,  // 内容限制关键词
    pub requires_confirmation: bool,        // 发送时需确认
}
```

### 4. Tauri命令

```rust
#[tauri::command]
pub async fn send_agent_message(
    sender_id: String,
    receiver_id: String,
    content: String,
) -> Result<AgentMessage, String>;

#[tauri::command]
pub async fn get_agent_messages(
    agent_id: String,
    limit: Option<usize>,
) -> Result<Vec<AgentMessage>, String>;

#[tauri::command]
pub async fn update_message_status(
    message_id: String,
    status: MessageStatus,
) -> Result<(), String>;

#[tauri::command]
pub async fn set_agent_permission(
    agent_id: String,
    permission: AgentPermission,
) -> Result<(), String>;
```

## 前端集成

AgentIntercom.tsx 已实现完整UI，需要集成后端API：
- 调用 `send_agent_message` 发送消息
- 调用 `get_agent_messages` 获取消息列表
- WebSocket 实时接收消息
- 显示消息状态（已发送/已送达/已读）

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| A2A_001 | 权限不足 | 返回错误，提示用户 |
| A2A_002 | 接收方不存在 | 返回错误 |
| A2A_003 | 内容审核失败 | 拒绝发送，提示原因 |
| A2A_004 | 消息发送超时 | 重试或提示用户 |
