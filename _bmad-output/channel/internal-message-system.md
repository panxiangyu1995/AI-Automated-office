# 内部消息系统架构设计

**文档版本:** 1.0.0
**创建日期:** 2026-03-11
**作者:** 架构团队

---

## 目录

1. [概述](#概述)
2. [设计原则](#设计原则)
3. [核心架构](#核心架构)
4. [参与者模型](#参与者模型)
5. [消息类型系统](#消息类型系统)
6. [消息路由架构](#消息路由架构)
7. [实时推送机制](#实时推送机制)
8. [存储架构](#存储架构)
9. [群聊协作架构](#群聊协作架构)
10. [系统通知与公告](#系统通知与公告)
11. [权限控制体系](#权限控制体系)
12. [与Agent集成](#与agent集成)
13. [API接口设计](#api接口设计)
14. [Rust实现参考](#rust实现参考)

---

## 概述

### 设计目标

内部消息系统是AI-Automated-office的核心协作基础设施，旨在实现：

- **统一通信**：将人和Agent作为对等的消息参与者，支持人↔人、Agent↔Agent、人↔Agent三种通信场景
- **实时协作**：毫秒级消息推送，支持离线存储与同步
- **企业级可靠性**：消息不丢失、顺序保证、已读回执
- **安全可控**：细粒度权限控制、敏感操作确认
- **AI赋能**：Agent可参与消息协作，智能提醒和补充

### 功能范围

| 功能模块 | MVP阶段 | Post-MVP |
|---------|---------|----------|
| 私聊（人↔人） | ✅ | - |
| 群聊协作 | ✅ | - |
| Agent消息 | ✅ | - |
| 系统公告 | ✅ | - |
| 通讯录 | ✅ | - |
| 消息搜索 | ✅ | - |
| 已读回执 | ✅ | - |
| 消息撤回 | ✅ | - |
| @提及 | ✅ | - |
| 消息转发 | ❌ | ✅ |
| 消息引用回复 | ❌ | ✅ |
| 富文本消息 | ❌ | ✅ |
| 语音消息 | ❌ | ✅ |
| 视频通话 | ❌ | ✅ |

---

## 设计原则

### 1. 参与者对等原则

人和Agent在消息系统中是平等的参与者，使用统一的ID格式和消息协议。

```
┌─────────────────────────────────────────────────────────────┐
│                    参与者对等模型                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   human:user_001  ←──────→  human:user_002                  │
│        │                          │                         │
│        │                          │                         │
│        ↓                          ↓                         │
│   agent:user_001  ←──────→  agent:user_002                  │
│                                                             │
│   所有参与者使用统一的消息协议和路由机制                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 本地优先原则

消息优先存储在本地SQLite，云端同步作为增强功能。

```
本地存储 → 离线可用
    ↓
云端同步 → 跨设备、数据备份
    ↓
冲突解决 → 时间戳优先
```

### 3. 权限最小化原则

默认情况下，Agent不能主动发送消息，需要员工确认或特定触发条件。

### 4. 消息可追溯原则

所有消息都有完整的发送记录，员工可查看Agent代发的消息历史。

---

## 核心架构

### 分层架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         消息系统分层架构                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    L1: 应用层 (Application)                       │   │
│  │  • 消息UI组件（ChatPanel, MessageList, InputBox）               │   │
│  │  • 通讯录组件（ContactList, OrgTree）                           │   │
│  │  • 通知组件（NotificationCenter, Toast）                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    L2: 服务层 (Service)                           │   │
│  │  • MessageService（消息发送/接收/撤回）                          │   │
│  │  • ConversationService（会话管理）                              │   │
│  │  • ContactService（通讯录服务）                                 │   │
│  │  • NotificationService（通知服务）                              │   │
│  │  • GroupService（群组管理）                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    L3: 路由层 (Router)                            │   │
│  │  • MessageRouter（消息路由决策）                                │   │
│  │  • ParticipantResolver（参与者解析）                            │   │
│  │  • PermissionChecker（权限校验）                                │   │
│  │  • DeliveryQueue（投递队列）                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    L4: 传输层 (Transport)                         │   │
│  │  • WebSocketClient（实时推送）                                  │   │
│  │  • OfflineQueue（离线队列）                                     │   │
│  │  • SyncEngine（同步引擎）                                       │   │
│  │  • CloudAPI（云端接口）                                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    L5: 存储层 (Storage)                           │   │
│  │  • MessageStore（消息存储）                                     │   │
│  │  • ConversationStore（会话存储）                                │   │
│  │  • ContactStore（通讯录存储）                                   │   │
│  │  • SQLite + 内存缓存                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 核心组件交互

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         组件交互流程                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  用户发送消息                                                            │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │ ChatPanel   │ ──→ │ MessageSvc  │ ──→ │ Router      │              │
│  │ (UI组件)    │     │ (服务层)    │     │ (路由层)    │              │
│  └─────────────┘     └─────────────┘     └──────┬──────┘              │
│                                                  │                      │
│                           ┌──────────────────────┼──────────────────┐  │
│                           │                      │                  │  │
│                           ▼                      ▼                  ▼  │
│                    ┌─────────────┐       ┌─────────────┐   ┌──────────┐│
│                    │ Permission  │       │ Participant │   │ Delivery ││
│                    │ Checker     │       │ Resolver    │   │ Queue    ││
│                    └─────────────┘       └─────────────┘   └────┬─────┘│
│                                                                   │      │
│                           ┌───────────────────────────────────────┘      │
│                           │                                              │
│                           ▼                                              │
│                    ┌─────────────┐       ┌─────────────┐                │
│                    │ WebSocket   │ ←───→ │ SQLite      │                │
│                    │ (传输层)    │       │ (存储层)    │                │
│                    └─────────────┘       └─────────────┘                │
│                           │                                              │
│                           ▼                                              │
│                    ┌─────────────┐                                       │
│                    │ 接收方      │                                       │
│                    │ (推送通知)  │                                       │
│                    └─────────────┘                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 参与者模型

### 参与者ID格式 (ADR-021)

```
┌─────────────────────────────────────────────────────────────────┐
│                    参与者ID格式定义                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  格式: {type}:{identifier}                                      │
│                                                                 │
│  类型说明:                                                      │
│  ┌────────────┬─────────────────────────────────────────────┐  │
│  │ 类型       │ 说明                                         │  │
│  ├────────────┼─────────────────────────────────────────────┤  │
│  │ human      │ 人类员工，identifier为用户ID                │  │
│  │ agent      │ AI助手，identifier为所属员工ID              │  │
│  │ system     │ 系统服务，identifier为服务名称              │  │
│  │ group      │ 群组，identifier为群组ID                    │  │
│  └────────────┴─────────────────────────────────────────────┘  │
│                                                                 │
│  示例:                                                          │
│  • human:user_001       → 员工张三                             │
│  • agent:user_001       → 张三的AI助手                         │
│  • system:notification  → 系统通知服务                         │
│  • group:dept_sales     → 销售部门群                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 参与者数据结构

```rust
/// 参与者类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ParticipantType {
    Human,
    Agent,
    System,
    Group,
}

/// 在线状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum OnlineStatus {
    Online,   // 在线
    Offline,  // 离线
    Busy,     // 忙碌
    Away,     // 离开
}

/// 参与者信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participant {
    /// 参与者ID（格式: {type}:{identifier}）
    pub id: String,
    
    /// 参与者类型
    #[serde(rename = "type")]
    pub participant_type: ParticipantType,
    
    /// 显示名称
    pub display_name: String,
    
    /// 头像URL
    pub avatar_url: Option<String>,
    
    /// 所属部门
    pub department: Option<String>,
    
    /// 职位
    pub position: Option<String>,
    
    /// 归属员工ID（仅Agent类型）
    pub owner_user_id: Option<String>,
    
    /// 在线状态
    pub online_status: OnlineStatus,
    
    /// 最后活跃时间
    pub last_active_at: Option<i64>,
}

impl Participant {
    /// 解析参与者ID
    pub fn parse_id(id: &str) -> Result<(ParticipantType, String), MessageError> {
        let parts: Vec<&str> = id.splitn(2, ':').collect();
        if parts.len() != 2 {
            return Err(MessageError::InvalidParticipantId(id.to_string()));
        }
        
        let ptype = match parts[0] {
            "human" => ParticipantType::Human,
            "agent" => ParticipantType::Agent,
            "system" => ParticipantType::System,
            "group" => ParticipantType::Group,
            _ => return Err(MessageError::InvalidParticipantId(id.to_string())),
        };
        
        Ok((ptype, parts[1].to_string()))
    }
    
    /// 构建人类员工ID
    pub fn human_id(user_id: &str) -> String {
        format!("human:{}", user_id)
    }
    
    /// 构建Agent ID
    pub fn agent_id(owner_user_id: &str) -> String {
        format!("agent:{}", owner_user_id)
    }
    
    /// 构建系统服务ID
    pub fn system_id(service_name: &str) -> String {
        format!("system:{}", service_name)
    }
    
    /// 构建群组ID
    pub fn group_id(group_id: &str) -> String {
        format!("group:{}", group_id)
    }
}
```

### 参与者解析器

```rust
/// 参与者解析器
pub struct ParticipantResolver {
    db: Arc<Database>,
    cache: Arc<RwLock<HashMap<String, Participant>>>,
}

impl ParticipantResolver {
    /// 解析参与者信息
    pub async fn resolve(&self, participant_id: &str) -> Result<Participant, MessageError> {
        // 1. 检查缓存
        if let Some(cached) = self.cache.read().await.get(participant_id) {
            return Ok(cached.clone());
        }
        
        // 2. 解析ID类型
        let (ptype, identifier) = Participant::parse_id(participant_id)?;
        
        // 3. 根据类型获取信息
        let participant = match ptype {
            ParticipantType::Human => {
                self.resolve_human(&identifier).await?
            }
            ParticipantType::Agent => {
                self.resolve_agent(&identifier).await?
            }
            ParticipantType::System => {
                self.resolve_system(&identifier).await?
            }
            ParticipantType::Group => {
                self.resolve_group(&identifier).await?
            }
        };
        
        // 4. 更新缓存
        self.cache.write().await.insert(participant_id.to_string(), participant.clone());
        
        Ok(participant)
    }
    
    async fn resolve_human(&self, user_id: &str) -> Result<Participant, MessageError> {
        let user = self.db.get_user(user_id).await?
            .ok_or(MessageError::UserNotFound(user_id.to_string()))?;
        
        Ok(Participant {
            id: Participant::human_id(user_id),
            participant_type: ParticipantType::Human,
            display_name: user.name,
            avatar_url: user.avatar_url,
            department: Some(user.department),
            position: Some(user.position),
            owner_user_id: None,
            online_status: user.online_status,
            last_active_at: user.last_active_at,
        })
    }
    
    async fn resolve_agent(&self, owner_user_id: &str) -> Result<Participant, MessageError> {
        let owner = self.db.get_user(owner_user_id).await?
            .ok_or(MessageError::UserNotFound(owner_user_id.to_string()))?;
        
        Ok(Participant {
            id: Participant::agent_id(owner_user_id),
            participant_type: ParticipantType::Agent,
            display_name: format!("{}的AI助手", owner.name),
            avatar_url: None, // Agent使用默认头像
            department: Some(owner.department.clone()),
            position: Some("AI助手".to_string()),
            owner_user_id: Some(owner_user_id.to_string()),
            online_status: OnlineStatus::Online, // Agent始终在线
            last_active_at: None,
        })
    }
    
    async fn resolve_system(&self, service_name: &str) -> Result<Participant, MessageError> {
        Ok(Participant {
            id: Participant::system_id(service_name),
            participant_type: ParticipantType::System,
            display_name: self.get_system_display_name(service_name),
            avatar_url: None,
            department: None,
            position: None,
            owner_user_id: None,
            online_status: OnlineStatus::Online,
            last_active_at: None,
        })
    }
    
    async fn resolve_group(&self, group_id: &str) -> Result<Participant, MessageError> {
        let group = self.db.get_group(group_id).await?
            .ok_or(MessageError::GroupNotFound(group_id.to_string()))?;
        
        Ok(Participant {
            id: Participant::group_id(group_id),
            participant_type: ParticipantType::Group,
            display_name: group.name,
            avatar_url: group.avatar_url,
            department: group.department,
            position: None,
            owner_user_id: None,
            online_status: OnlineStatus::Online,
            last_active_at: None,
        })
    }
    
    fn get_system_display_name(&self, service_name: &str) -> String {
        match service_name {
            "notification" => "系统通知",
            "announcement" => "系统公告",
            "approval" => "审批中心",
            _ => service_name,
        }.to_string()
    }
}
```

---

## 消息类型系统

### 消息内容类型

```rust
/// 消息内容类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MessageContent {
    /// 文本消息
    Text {
        content: String,
    },
    
    /// 图片消息
    Image {
        url: String,
        thumbnail_url: Option<String>,
        width: Option<u32>,
        height: Option<u32>,
    },
    
    /// 文件消息
    File {
        url: String,
        filename: String,
        size_bytes: u64,
        mime_type: String,
    },
    
    /// 语音消息
    Voice {
        audio_url: String,
        duration_seconds: u32,
        transcript: Option<String>,  // 自动转文字
    },
    
    /// 工作卡片消息
    WorkCard {
        card: WorkCard,
    },
    
    /// 系统通知
    SystemNotification {
        title: String,
        body: String,
        notification_type: NotificationType,
        action_url: Option<String>,
        action_text: Option<String>,
    },
    
    /// 审批卡片
    ApprovalCard {
        approval_id: String,
        title: String,
        description: String,
        applicant_name: String,
        amount: Option<String>,
        status: ApprovalStatus,
        actions: Vec<CardAction>,
    },
    
    /// @提及
    Mention {
        mentioned_user_id: String,
        mentioned_name: String,
        content: String,
    },
    
    /// 消息撤回通知
    RecallNotification {
        recalled_message_id: String,
        recalled_by: String,
    },
}

/// 工作卡片
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkCard {
    /// 卡片类型
    pub card_type: WorkCardType,
    
    /// 标题
    pub title: String,
    
    /// 描述
    pub description: String,
    
    /// 状态
    pub status: Option<String>,
    
    /// 操作按钮
    pub actions: Vec<CardAction>,
    
    /// 元数据
    pub metadata: HashMap<String, Value>,
}

/// 工作卡片类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WorkCardType {
    Task,        // 任务
    Approval,    // 审批
    Report,      // 报告
    Order,       // 订单
    Quote,       // 报价单
    Contract,    // 合同
    Inventory,   // 库存
}

/// 卡片操作
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardAction {
    /// 操作标签
    pub label: String,
    
    /// 操作动作
    pub action: String,
    
    /// 操作样式
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<ActionStyle>,
    
    /// 操作URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

/// 操作样式
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ActionStyle {
    Primary,
    Secondary,
    Danger,
}

/// 通知类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationType {
    System,      // 系统通知
    Approval,    // 审批通知
    Task,        // 任务通知
    Reminder,    // 提醒通知
    Announcement,// 公告通知
    Mention,     // @提及通知
}

/// 审批状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ApprovalStatus {
    Pending,     // 待审批
    Approved,    // 已通过
    Rejected,    // 已拒绝
    Cancelled,   // 已取消
}
```

### 消息数据结构

```rust
/// 消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// 消息ID
    pub id: String,
    
    /// 会话ID
    pub conversation_id: String,
    
    /// 发送者ID
    pub sender_id: String,
    
    /// 发送者类型
    pub sender_type: ParticipantType,
    
    /// 接收者ID（私聊）或群组ID（群聊）
    pub receiver_id: String,
    
    /// 消息内容
    pub content: MessageContent,
    
    /// 消息状态
    pub status: MessageStatus,
    
    /// 创建时间（Unix时间戳，毫秒）
    pub created_at: i64,
    
    /// 更新时间
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<i64>,
    
    /// 删除时间
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deleted_at: Option<i64>,
    
    /// 引用消息ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reply_to_id: Option<String>,
    
    /// Agent代发标识
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_sent_by: Option<String>,
    
    /// 扩展数据
    #[serde(default)]
    pub metadata: HashMap<String, Value>,
}

/// 消息状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MessageStatus {
    Sending,    // 发送中
    Sent,       // 已发送
    Delivered,  // 已送达
    Read,       // 已读
    Failed,     // 发送失败
    Recalled,   // 已撤回
}

/// 会话
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    /// 会话ID
    pub id: String,
    
    /// 会话类型
    #[serde(rename = "type")]
    pub conversation_type: ConversationType,
    
    /// 参与者列表
    pub participants: Vec<String>,
    
    /// 最后一条消息
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_message: Option<Message>,
    
    /// 未读数量
    pub unread_count: u32,
    
    /// 置顶状态
    pub pinned: bool,
    
    /// 免打扰状态
    pub muted: bool,
    
    /// 创建时间
    pub created_at: i64,
    
    /// 更新时间
    pub updated_at: i64,
    
    /// 群组信息（仅群聊）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_info: Option<GroupInfo>,
}

/// 会话类型
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ConversationType {
    Private,  // 私聊
    Group,    // 群聊
}

/// 群组信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GroupInfo {
    /// 群组ID
    pub group_id: String,
    
    /// 群组名称
    pub name: String,
    
    /// 群组头像
    pub avatar_url: Option<String>,
    
    /// 群主ID
    pub owner_id: String,
    
    /// 群成员数量
    pub member_count: u32,
}
```

---

## 消息路由架构

### 路由决策流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         消息路由决策流程                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  发送消息请求                                                            │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 1: 参与者解析                                               │   │
│  │ • 解析发送者和接收者ID                                           │   │
│  │ • 验证参与者存在性                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 2: 权限校验                                                 │   │
│  │ • 发送者是否有权发送消息                                         │   │
│  │ • Agent消息需要确认机制                                          │   │
│  │ • 群组成员身份验证                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 3: 路由决策                                                 │   │
│  │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │
│  │ │ 人→人私聊  │  │ 人→群聊    │  │ Agent消息   │              │   │
│  │ │ 直接投递   │  │ 广播投递   │  │ 确认后投递  │              │   │
│  └─────────────┘  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 4: 消息处理                                                 │   │
│  │ • 生成消息ID                                                     │   │
│  │ • 本地存储                                                       │   │
│  │ • 加入投递队列                                                   │   │
│  │ • 云端同步                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Step 5: 实时推送                                                 │   │
│  │ • WebSocket推送                                                  │   │
│  │ • 离线存储                                                       │   │
│  │ • 系统通知                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 路由类型矩阵

| 发送者 | 接收者 | 路由方式 | 权限检查 | 特殊处理 |
|--------|--------|---------|---------|---------|
| human | human | 直接投递 | 黑名单检查 | - |
| human | group | 广播投递 | 群成员检查 | - |
| human | agent | 直接投递 | - | Agent自动响应 |
| agent | human | 确认投递 | 员工确认 | 敏感消息需确认 |
| agent | group | 确认投递 | 员工确认+群成员 | 静默发言或主动发言 |
| agent | agent | 确认投递 | 双方员工确认 | 跨部门协作 |
| system | human | 直接投递 | - | 系统通知 |
| system | group | 广播投递 | - | 系统公告 |

### 消息路由器实现

```rust
/// 消息路由器
pub struct MessageRouter {
    participant_resolver: Arc<ParticipantResolver>,
    permission_checker: Arc<PermissionChecker>,
    delivery_queue: Arc<DeliveryQueue>,
    db: Arc<Database>,
}

impl MessageRouter {
    /// 路由消息
    pub async fn route(&self, request: SendMessageRequest) -> Result<Message, MessageError> {
        // 1. 解析参与者
        let sender = self.participant_resolver.resolve(&request.sender_id).await?;
        let receiver = self.participant_resolver.resolve(&request.receiver_id).await?;
        
        // 2. 权限校验
        self.permission_checker.check_send_permission(&sender, &receiver).await?;
        
        // 3. 根据类型路由
        match (&sender.participant_type, &receiver.participant_type) {
            // 人→人私聊
            (ParticipantType::Human, ParticipantType::Human) => {
                self.route_private_message(request, sender, receiver).await
            }
            
            // 人→群聊
            (ParticipantType::Human, ParticipantType::Group) => {
                self.route_group_message(request, sender, receiver).await
            }
            
            // Agent消息（需要确认）
            (ParticipantType::Agent, _) => {
                self.route_agent_message(request, sender, receiver).await
            }
            
            // 系统消息
            (ParticipantType::System, _) => {
                self.route_system_message(request, sender, receiver).await
            }
            
            // 其他组合
            _ => Err(MessageError::UnsupportedRoute(
                sender.participant_type.clone(),
                receiver.participant_type.clone(),
            )),
        }
    }
    
    /// 路由私聊消息
    async fn route_private_message(
        &self,
        request: SendMessageRequest,
        sender: Participant,
        receiver: Participant,
    ) -> Result<Message, MessageError> {
        // 1. 获取或创建会话
        let conversation = self.get_or_create_private_conversation(
            &sender.id,
            &receiver.id,
        ).await?;
        
        // 2. 创建消息
        let message = Message {
            id: generate_message_id(),
            conversation_id: conversation.id.clone(),
            sender_id: sender.id.clone(),
            sender_type: sender.participant_type.clone(),
            receiver_id: receiver.id.clone(),
            content: request.content,
            status: MessageStatus::Sending,
            created_at: current_timestamp(),
            updated_at: None,
            deleted_at: None,
            reply_to_id: request.reply_to_id,
            agent_sent_by: None,
            metadata: request.metadata,
        };
        
        // 3. 存储消息
        self.db.save_message(&message).await?;
        
        // 4. 加入投递队列
        self.delivery_queue.enqueue(message.clone()).await?;
        
        Ok(message)
    }
    
    /// 路由群聊消息
    async fn route_group_message(
        &self,
        request: SendMessageRequest,
        sender: Participant,
        group: Participant,
    ) -> Result<Message, MessageError> {
        let (_, group_id) = Participant::parse_id(&group.id)?;
        
        // 1. 检查群成员身份
        if !self.db.is_group_member(&group_id, &sender.id).await? {
            return Err(MessageError::NotGroupMember(group_id));
        }
        
        // 2. 获取群会话
        let conversation = self.get_group_conversation(&group_id).await?;
        
        // 3. 创建消息
        let message = Message {
            id: generate_message_id(),
            conversation_id: conversation.id.clone(),
            sender_id: sender.id.clone(),
            sender_type: sender.participant_type.clone(),
            receiver_id: group.id.clone(),
            content: request.content,
            status: MessageStatus::Sending,
            created_at: current_timestamp(),
            updated_at: None,
            deleted_at: None,
            reply_to_id: request.reply_to_id,
            agent_sent_by: None,
            metadata: request.metadata,
        };
        
        // 4. 存储消息
        self.db.save_message(&message).await?;
        
        // 5. 广播给所有群成员
        let members = self.db.get_group_members(&group_id).await?;
        for member in members {
            if member != sender.id {
                self.delivery_queue.enqueue_for(&message, &member).await?;
            }
        }
        
        Ok(message)
    }
    
    /// 路由Agent消息（需要员工确认）
    async fn route_agent_message(
        &self,
        request: SendMessageRequest,
        sender: Participant,
        receiver: Participant,
    ) -> Result<Message, MessageError> {
        let owner_id = sender.owner_user_id.as_ref()
            .ok_or(MessageError::AgentWithoutOwner)?;
        
        // 1. 检查消息敏感度
        let sensitivity = self.check_message_sensitivity(&request.content);
        
        // 2. 敏感消息需要确认
        if sensitivity.is_sensitive {
            // 发送确认请求给员工
            let confirmation = self.request_agent_confirmation(
                &sender.id,
                owner_id,
                &receiver.id,
                &request.content,
                sensitivity.reason,
            ).await?;
            
            if !confirmation.approved {
                return Err(MessageError::AgentMessageRejected);
            }
        }
        
        // 3. 创建消息（带Agent标识）
        let conversation = self.get_or_create_conversation(&sender.id, &receiver.id).await?;
        
        let message = Message {
            id: generate_message_id(),
            conversation_id: conversation.id.clone(),
            sender_id: sender.id.clone(),
            sender_type: ParticipantType::Agent,
            receiver_id: receiver.id.clone(),
            content: request.content,
            status: MessageStatus::Sending,
            created_at: current_timestamp(),
            updated_at: None,
            deleted_at: None,
            reply_to_id: request.reply_to_id,
            agent_sent_by: Some(owner_id.to_string()),
            metadata: request.metadata,
        };
        
        // 4. 存储消息
        self.db.save_message(&message).await?;
        
        // 5. 加入投递队列
        self.delivery_queue.enqueue(message.clone()).await?;
        
        // 6. 记录Agent消息日志
        self.db.log_agent_message(&message, owner_id).await?;
        
        Ok(message)
    }
    
    /// 检查消息敏感度
    fn check_message_sensitivity(&self, content: &MessageContent) -> SensitivityResult {
        match content {
            MessageContent::Text { content } => {
                // 检查敏感关键词
                let sensitive_keywords = ["密码", "账号", "金额", "合同", "签约"];
                for keyword in sensitive_keywords {
                    if content.contains(keyword) {
                        return SensitivityResult {
                            is_sensitive: true,
                            reason: format!("消息包含敏感关键词: {}", keyword),
                        };
                    }
                }
                SensitivityResult::not_sensitive()
            }
            MessageContent::ApprovalCard { .. } => SensitivityResult {
                is_sensitive: true,
                reason: "审批相关消息".to_string(),
            },
            _ => SensitivityResult::not_sensitive(),
        }
    }
}

struct SensitivityResult {
    is_sensitive: bool,
    reason: String,
}

impl SensitivityResult {
    fn not_sensitive() -> Self {
        Self {
            is_sensitive: false,
            reason: String::new(),
        }
    }
}
```

---

## 实时推送机制

### WebSocket架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         实时推送架构                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      客户端 (Tauri App)                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │ WebSocket   │  │ MessageQueue│  │ Notification│             │   │
│  │  │ Client      │  │ (本地)      │  │ Manager     │             │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │   │
│  │         │                │                │                      │   │
│  │         └────────────────┼────────────────┘                      │   │
│  │                          │                                       │   │
│  └──────────────────────────┼───────────────────────────────────────┘   │
│                             │                                           │
│                             │ WebSocket                                 │
│                             ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      云端服务 (Cloud Server)                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │ Connection  │  │ Message     │  │ Push        │             │   │
│  │  │ Manager     │  │ Dispatcher  │  │ Service     │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  │                          │                                       │   │
│  │                          ▼                                       │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │                    Redis Pub/Sub                         │   │   │
│  │  │         消息分发 & 在线状态广播                           │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 连接管理

```rust
/// WebSocket连接管理器
pub struct WebSocketManager {
    /// 活跃连接
    connections: Arc<RwLock<HashMap<String, WebSocketConnection>>>,
    
    /// 离线消息队列
    offline_queue: Arc<OfflineQueue>,
    
    /// 心跳配置
    heartbeat_interval: Duration,
    
    /// 重连配置
    reconnect_config: ReconnectConfig,
}

/// WebSocket连接
pub struct WebSocketConnection {
    /// 用户ID
    pub user_id: String,
    
    /// 租户ID
    pub tenant_id: String,
    
    /// 连接时间
    pub connected_at: i64,
    
    /// 最后心跳时间
    pub last_heartbeat: i64,
    
    /// 发送队列
    pub send_queue: mpsc::Sender<Message>,
}

impl WebSocketManager {
    /// 推送消息
    pub async fn push_message(
        &self,
        participant_id: &str,
        message: &Message,
    ) -> Result<(), MessageError> {
        // 1. 解析参与者
        let (ptype, identifier) = Participant::parse_id(participant_id)?;
        
        let target_user_id = match ptype {
            ParticipantType::Human => identifier,
            ParticipantType::Agent => {
                // Agent消息推送给所属员工
                identifier
            }
            _ => return Ok(()), // 系统和群组不直接推送
        };
        
        // 2. 查找活跃连接
        if let Some(conn) = self.connections.read().await.get(&target_user_id) {
            // 在线推送
            conn.send_queue.send(message.clone()).await?;
        } else {
            // 离线存储
            self.offline_queue.enqueue(target_user_id, message).await?;
        }
        
        Ok(())
    }
    
    /// 用户上线
    pub async fn on_user_online(&self, user_id: &str, conn: WebSocketConnection) {
        // 1. 注册连接
        self.connections.write().await.insert(user_id.to_string(), conn);
        
        // 2. 推送离线消息
        if let Ok(messages) = self.offline_queue.dequeue_all(user_id).await {
            for message in messages {
                self.push_message(user_id, &message).await.ok();
            }
        }
        
        // 3. 广播在线状态
        self.broadcast_online_status(user_id, OnlineStatus::Online).await;
    }
    
    /// 用户离线
    pub async fn on_user_offline(&self, user_id: &str) {
        // 1. 移除连接
        self.connections.write().await.remove(user_id);
        
        // 2. 广播离线状态
        self.broadcast_online_status(user_id, OnlineStatus::Offline).await;
    }
    
    /// 广播在线状态
    async fn broadcast_online_status(&self, user_id: &str, status: OnlineStatus) {
        // 发布到Redis，通知其他服务
        // ...
    }
}

/// 离线消息队列
pub struct OfflineQueue {
    db: Arc<Database>,
    max_messages_per_user: usize,  // 默认100
    ttl: Duration,  // 默认7天
}

impl OfflineQueue {
    pub async fn enqueue(&self, user_id: &str, message: &Message) -> Result<(), MessageError> {
        self.db.save_offline_message(user_id, message).await
    }
    
    pub async fn dequeue_all(&self, user_id: &str) -> Result<Vec<Message>, MessageError> {
        let messages = self.db.get_offline_messages(user_id).await?;
        self.db.clear_offline_messages(user_id).await?;
        Ok(messages)
    }
}
```

### 客户端WebSocket实现

```rust
/// 客户端WebSocket客户端
pub struct WebSocketClient {
    url: String,
    connection: Option<WebSocket>,
    message_handler: Arc<dyn MessageHandler>,
    reconnect_attempts: u32,
    max_reconnect_attempts: u32,
}

#[async_trait]
pub trait MessageHandler: Send + Sync {
    async fn on_message(&self, message: Message);
    async fn on_online_status(&self, user_id: &str, status: OnlineStatus);
    async fn on_error(&self, error: &str);
}

impl WebSocketClient {
    /// 连接
    pub async fn connect(&mut self, token: &str) -> Result<(), MessageError> {
        let url = format!("{}?token={}", self.url, token);
        
        let ws = WebSocket::connect(&url).await?;
        self.connection = Some(ws);
        self.reconnect_attempts = 0;
        
        // 启动消息接收循环
        self.start_receive_loop();
        
        // 启动心跳
        self.start_heartbeat();
        
        Ok(())
    }
    
    /// 接收循环
    fn start_receive_loop(&self) {
        let connection = self.connection.clone();
        let handler = self.message_handler.clone();
        
        tokio::spawn(async move {
            while let Some(ws) = connection.as_ref() {
                match ws.receive().await {
                    Ok(msg) => {
                        let message: Message = serde_json::from_str(&msg)?;
                        handler.on_message(message).await;
                    }
                    Err(e) => {
                        handler.on_error(&e.to_string()).await;
                        // 触发重连
                    }
                }
            }
        });
    }
    
    /// 心跳
    fn start_heartbeat(&self) {
        let connection = self.connection.clone();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(30));
            
            loop {
                interval.tick().await;
                
                if let Some(ws) = connection.as_ref() {
                    ws.send_heartbeat().await.ok();
                }
            }
        });
    }
}
```

---

## 存储架构

### 本地存储设计

```
{app_data}/
├── tenants/
│   └── {tenant_id}/
│       ├── messages/
│       │   ├── messages.db      # SQLite消息数据库
│       │   ├── attachments/     # 附件缓存
│       │   └── offline.db       # 离线消息队列
│       └── contacts/
│           └── contacts.db      # 通讯录缓存
```

### 数据库Schema

```sql
-- 消息表
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,  -- human/agent/system
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,       -- JSON
    status TEXT DEFAULT 'sent',  -- sending/sent/delivered/read/failed/recalled
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    deleted_at INTEGER,
    reply_to_id TEXT,
    agent_sent_by TEXT,          -- Agent代发时记录所属员工
    
    INDEX idx_conversation_time (conversation_id, created_at DESC),
    INDEX idx_sender (sender_id, created_at DESC),
    INDEX idx_receiver (receiver_id, created_at DESC)
);

-- 会话表
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,          -- private/group
    participants TEXT NOT NULL,  -- JSON array
    last_message_id TEXT,
    last_message_time INTEGER,
    unread_count INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0,
    muted INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- 群聊信息（仅群聊）
    group_id TEXT,
    group_name TEXT,
    group_avatar TEXT,
    owner_id TEXT,
    member_count INTEGER
);

-- 会话参与者表
CREATE TABLE conversation_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    last_read_at INTEGER,
    
    UNIQUE(conversation_id, participant_id),
    INDEX idx_participant (participant_id)
);

-- 消息已读表
CREATE TABLE message_reads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    read_at INTEGER NOT NULL,
    
    UNIQUE(message_id, user_id),
    INDEX idx_user_reads (user_id, read_at DESC)
);

-- 离线消息队列
CREATE TABLE offline_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    message_data TEXT NOT NULL,  -- JSON
    created_at INTEGER NOT NULL,
    delivered INTEGER DEFAULT 0,
    
    INDEX idx_user_offline (user_id, created_at)
);

-- Agent消息日志
CREATE TABLE agent_message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    sensitivity_level TEXT,
    confirmed_at INTEGER,
    sent_at INTEGER NOT NULL,
    
    INDEX idx_agent_logs (owner_user_id, sent_at DESC)
);

-- 群组成员表
CREATE TABLE group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member',   -- owner/admin/member
    joined_at INTEGER NOT NULL,
    
    UNIQUE(group_id, user_id),
    INDEX idx_user_groups (user_id)
);
```

### 消息存储服务

```rust
/// 消息存储服务
pub struct MessageStore {
    db: Arc<Database>,
    cache: Arc<MessageCache>,
}

impl MessageStore {
    /// 保存消息
    pub async fn save_message(&self, message: &Message) -> Result<(), MessageError> {
        // 1. 存储到SQLite
        self.db.insert_message(message).await?;
        
        // 2. 更新缓存
        self.cache.add_message(message).await;
        
        // 3. 更新会话最后消息
        self.db.update_conversation_last_message(
            &message.conversation_id,
            &message.id,
            message.created_at,
        ).await?;
        
        Ok(())
    }
    
    /// 获取会话消息列表
    pub async fn get_conversation_messages(
        &self,
        conversation_id: &str,
        before_id: Option<&str>,
        limit: u32,
    ) -> Result<Vec<Message>, MessageError> {
        // 优先从缓存获取
        if let Some(cached) = self.cache.get_messages(conversation_id, before_id, limit).await {
            return Ok(cached);
        }
        
        // 从数据库获取
        let messages = self.db.get_messages(conversation_id, before_id, limit).await?;
        
        // 更新缓存
        for msg in &messages {
            self.cache.add_message(msg).await;
        }
        
        Ok(messages)
    }
    
    /// 标记已读
    pub async fn mark_as_read(
        &self,
        user_id: &str,
        conversation_id: &str,
        message_id: &str,
    ) -> Result<(), MessageError> {
        let now = current_timestamp();
        
        // 1. 记录已读
        self.db.insert_message_read(message_id, user_id, now).await?;
        
        // 2. 更新会话未读数
        self.db.decrement_unread_count(conversation_id).await?;
        
        // 3. 更新参与者最后阅读时间
        self.db.update_last_read_at(conversation_id, user_id, now).await?;
        
        Ok(())
    }
    
    /// 撤回消息
    pub async fn recall_message(
        &self,
        message_id: &str,
        user_id: &str,
    ) -> Result<(), MessageError> {
        // 1. 获取消息
        let message = self.db.get_message(message_id).await?
            .ok_or(MessageError::MessageNotFound)?;
        
        // 2. 检查权限（只能撤回自己的消息）
        let sender_id = if message.sender_type == ParticipantType::Agent {
            message.agent_sent_by.ok_or(MessageError::CannotRecall)?
        } else {
            Participant::parse_id(&message.sender_id)?.1
        };
        
        if sender_id != user_id {
            return Err(MessageError::CannotRecall);
        }
        
        // 3. 检查时间限制（2分钟内）
        let now = current_timestamp();
        if now - message.created_at > 2 * 60 * 1000 {
            return Err(MessageError::RecallTimeExceeded);
        }
        
        // 4. 更新消息状态
        self.db.update_message_status(message_id, MessageStatus::Recalled).await?;
        
        // 5. 发送撤回通知
        // ...
        
        Ok(())
    }
}

/// 消息缓存
pub struct MessageCache {
    /// 消息缓存（conversation_id -> messages）
    messages: Arc<RwLock<HashMap<String, VecDeque<Message>>>>,
    
    /// 最大缓存消息数
    max_cache_size: usize,
    
    /// 缓存过期时间
    cache_ttl: Duration,
}

impl MessageCache {
    pub async fn add_message(&self, message: &Message) {
        let mut cache = self.messages.write().await;
        let messages = cache.entry(message.conversation_id.clone()).or_default();
        
        messages.push_back(message.clone());
        
        // 限制缓存大小
        while messages.len() > self.max_cache_size {
            messages.pop_front();
        }
    }
    
    pub async fn get_messages(
        &self,
        conversation_id: &str,
        before_id: Option<&str>,
        limit: u32,
    ) -> Option<Vec<Message>> {
        let cache = self.messages.read().await;
        let messages = cache.get(conversation_id)?;
        
        let result: Vec<Message> = if let Some(before_id) = before_id {
            messages.iter()
                .skip_while(|m| m.id != before_id)
                .skip(1)
                .take(limit as usize)
                .cloned()
                .collect()
        } else {
            messages.iter().rev().take(limit as usize).cloned().collect()
        };
        
        Some(result)
    }
}
```

---

## 群聊协作架构

### 群组管理

```rust
/// 群组服务
pub struct GroupService {
    db: Arc<Database>,
    message_router: Arc<MessageRouter>,
    participant_resolver: Arc<ParticipantResolver>,
}

impl GroupService {
    /// 创建群组
    pub async fn create_group(
        &self,
        name: &str,
        owner_id: &str,
        member_ids: Vec<String>,
    ) -> Result<Group, MessageError> {
        let group_id = generate_group_id();
        let now = current_timestamp();
        
        // 1. 创建群组
        let group = Group {
            id: group_id.clone(),
            name: name.to_string(),
            avatar_url: None,
            owner_id: owner_id.to_string(),
            department: None,
            created_at: now,
            updated_at: now,
        };
        
        self.db.insert_group(&group).await?;
        
        // 2. 添加成员
        let mut all_member_ids = member_ids.clone();
        all_member_ids.push(owner_id.to_string());
        
        for user_id in &all_member_ids {
            self.add_member(&group_id, user_id, false).await?;
        }
        
        // 3. 创建群会话
        self.create_group_conversation(&group_id, &all_member_ids).await?;
        
        Ok(group)
    }
    
    /// 添加成员（含Agent自动跟随）
    pub async fn add_member(
        &self,
        group_id: &str,
        user_id: &str,
        with_agent: bool,
    ) -> Result<(), MessageError> {
        // 1. 添加员工
        self.db.add_group_member(group_id, user_id, MemberRole::Member).await?;
        
        // 2. Agent自动跟随（如果用户设置允许）
        if with_agent {
            let settings = self.db.get_user_message_settings(user_id).await?;
            if settings.agent_auto_follow_group {
                let agent_id = Participant::agent_id(user_id);
                self.db.add_group_member(
                    group_id,
                    &agent_id,
                    MemberRole::Agent,
                ).await?;
            }
        }
        
        // 3. 发送入群通知
        let user = self.participant_resolver.resolve(&Participant::human_id(user_id)).await?;
        let notification = MessageContent::SystemNotification {
            title: "新成员入群".to_string(),
            body: format!("{} 加入了群聊", user.display_name),
            notification_type: NotificationType::System,
            action_url: None,
            action_text: None,
        };
        
        self.send_group_notification(group_id, notification).await?;
        
        Ok(())
    }
    
    /// 移除成员
    pub async fn remove_member(
        &self,
        group_id: &str,
        user_id: &str,
        operator_id: &str,
    ) -> Result<(), MessageError> {
        // 1. 检查权限
        let member_role = self.db.get_member_role(group_id, operator_id).await?;
        if member_role != MemberRole::Owner && member_role != MemberRole::Admin {
            return Err(MessageError::NoPermission);
        }
        
        // 2. 移除员工
        self.db.remove_group_member(group_id, user_id).await?;
        
        // 3. 移除Agent
        let agent_id = Participant::agent_id(user_id);
        self.db.remove_group_member(group_id, &agent_id).await.ok();
        
        // 4. 发送退群通知
        let user = self.participant_resolver.resolve(&Participant::human_id(user_id)).await?;
        let notification = MessageContent::SystemNotification {
            title: "成员退群".to_string(),
            body: format!("{} 离开了群聊", user.display_name),
            notification_type: NotificationType::System,
            action_url: None,
            action_text: None,
        };
        
        self.send_group_notification(group_id, notification).await?;
        
        Ok(())
    }
}

/// 群组成员角色
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MemberRole {
    Owner,   // 群主
    Admin,   // 管理员
    Member,  // 普通成员
    Agent,   // Agent成员
}

/// 群组
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub owner_id: String,
    pub department: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

### Agent群聊行为

```rust
/// Agent群聊行为管理
pub struct AgentGroupBehavior {
    db: Arc<Database>,
    message_service: Arc<MessageService>,
}

impl AgentGroupBehavior {
    /// 处理群消息，决定Agent是否响应
    pub async fn process_group_message(
        &self,
        agent_id: &str,
        message: &Message,
    ) -> Result<Option<Message>, MessageError> {
        let (_, owner_id) = Participant::parse_id(agent_id)?;
        
        // 检查触发条件
        let trigger = self.check_trigger_conditions(agent_id, message).await?;
        
        if let Some(trigger_type) = trigger {
            // 生成Agent响应
            let response = self.generate_agent_response(agent_id, message, trigger_type).await?;
            return Ok(Some(response));
        }
        
        Ok(None)
    }
    
    /// 检查触发条件
    async fn check_trigger_conditions(
        &self,
        agent_id: &str,
        message: &Message,
    ) -> Result<Option<TriggerType>, MessageError> {
        // 1. 被@提及
        if self.is_mentioned(agent_id, message).await? {
            return Ok(Some(TriggerType::Mention));
        }
        
        // 2. 工作提醒
        if self.is_work_reminder(agent_id, message).await? {
            return Ok(Some(TriggerType::WorkReminder));
        }
        
        // 3. 数据补充
        if self.needs_data_supplement(agent_id, message).await? {
            return Ok(Some(TriggerType::DataSupplement));
        }
        
        // 4. 协作接力
        if self.is_collaboration_handoff(agent_id, message).await? {
            return Ok(Some(TriggerType::CollaborationHandoff));
        }
        
        Ok(None)
    }
    
    /// 检查是否被@提及
    async fn is_mentioned(&self, agent_id: &str, message: &Message) -> Result<bool, MessageError> {
        if let MessageContent::Mention { mentioned_user_id, .. } = &message.content {
            if mentioned_user_id == agent_id {
                return Ok(true);
            }
        }
        
        // 检查文本中的@提及
        if let MessageContent::Text { content } = &message.content {
            let (_, owner_id) = Participant::parse_id(agent_id)?;
            let owner = Participant::human_id(&owner_id);
            
            // 检查@员工 或 @Agent
            let patterns = [
                format!("@{}", owner_id),
                format!("@{}", owner),
                format!("@{}", agent_id),
            ];
            
            for pattern in &patterns {
                if content.contains(pattern) {
                    return Ok(true);
                }
            }
        }
        
        Ok(false)
    }
    
    /// 生成Agent响应
    async fn generate_agent_response(
        &self,
        agent_id: &str,
        original_message: &Message,
        trigger_type: TriggerType,
    ) -> Result<Message, MessageError> {
        let (_, owner_id) = Participant::parse_id(agent_id)?;
        
        let response_content = match trigger_type {
            TriggerType::Mention => {
                // Agent代员工回答问题
                self.generate_mention_response(agent_id, original_message).await?
            }
            TriggerType::WorkReminder => {
                // 工作状态更新提醒
                self.generate_work_reminder_response(agent_id, original_message).await?
            }
            TriggerType::DataSupplement => {
                // 自动补充数据卡片
                self.generate_data_card_response(agent_id, original_message).await?
            }
            TriggerType::CollaborationHandoff => {
                // 协作接力通知
                self.generate_handoff_response(agent_id, original_message).await?
            }
        };
        
        // 创建消息
        let message = Message {
            id: generate_message_id(),
            conversation_id: original_message.conversation_id.clone(),
            sender_id: agent_id.to_string(),
            sender_type: ParticipantType::Agent,
            receiver_id: original_message.receiver_id.clone(),
            content: response_content,
            status: MessageStatus::Sending,
            created_at: current_timestamp(),
            updated_at: None,
            deleted_at: None,
            reply_to_id: Some(original_message.id.clone()),
            agent_sent_by: Some(owner_id),
            metadata: HashMap::new(),
        };
        
        Ok(message)
    }
}

/// 触发类型
#[derive(Debug, Clone)]
pub enum TriggerType {
    Mention,            // 被@提及
    WorkReminder,       // 工作提醒
    DataSupplement,     // 数据补充
    CollaborationHandoff, // 协作接力
}
```

### Agent群聊发言场景

| 场景 | 触发条件 | Agent行为 | 是否需要员工确认 |
|------|---------|----------|----------------|
| 被@提及 | `@Agent` 或 `@员工` | 代为回答问题 | 否（静默发言） |
| 工作提醒 | 相关任务状态变化 | "订单已发货，物流单号XXX" | 否 |
| 数据补充 | 员工发言涉及数据 | 自动附上数据卡片 | 否 |
| 进度汇报 | 员工让Agent汇报 | 输出结构化进度报告 | 是（主动发言） |
| 协作接力 | 上游任务完成 | 通知下游相关人员 | 否 |

---

## 系统通知与公告

### 通知类型

```rust
/// 系统通知服务
pub struct NotificationService {
    db: Arc<Database>,
    message_router: Arc<MessageRouter>,
}

impl NotificationService {
    /// 发送系统通知
    pub async fn send_system_notification(
        &self,
        user_id: &str,
        notification: SystemNotification,
    ) -> Result<(), MessageError> {
        let content = MessageContent::SystemNotification {
            title: notification.title,
            body: notification.body,
            notification_type: notification.notification_type,
            action_url: notification.action_url,
            action_text: notification.action_text,
        };
        
        let request = SendMessageRequest {
            sender_id: Participant::system_id("notification"),
            receiver_id: Participant::human_id(user_id),
            content,
            reply_to_id: None,
            metadata: notification.metadata,
        };
        
        self.message_router.route(request).await?;
        Ok(())
    }
    
    /// 发送公告
    pub async fn send_announcement(
        &self,
        announcement: Announcement,
    ) -> Result<(), MessageError> {
        // 1. 存储公告
        self.db.save_announcement(&announcement).await?;
        
        // 2. 确定接收者
        let receiver_ids = match announcement.scope {
            AnnouncementScope::All => self.db.get_all_user_ids().await?,
            AnnouncementScope::Department(dept) => self.db.get_department_user_ids(&dept).await?,
            AnnouncementScope::Users(ids) => ids,
        };
        
        // 3. 发送通知
        let content = MessageContent::SystemNotification {
            title: announcement.title.clone(),
            body: announcement.body.clone(),
            notification_type: NotificationType::Announcement,
            action_url: Some(format!("/announcements/{}", announcement.id)),
            action_text: Some("查看详情".to_string()),
        };
        
        for user_id in receiver_ids {
            let request = SendMessageRequest {
                sender_id: Participant::system_id("announcement"),
                receiver_id: Participant::human_id(&user_id),
                content: content.clone(),
                reply_to_id: None,
                metadata: HashMap::new(),
            };
            
            self.message_router.route(request).await?;
        }
        
        Ok(())
    }
    
    /// 发送审批通知
    pub async fn send_approval_notification(
        &self,
        approver_id: &str,
        approval: ApprovalInfo,
    ) -> Result<(), MessageError> {
        let content = MessageContent::ApprovalCard {
            approval_id: approval.id,
            title: approval.title,
            description: approval.description,
            applicant_name: approval.applicant_name,
            amount: approval.amount,
            status: ApprovalStatus::Pending,
            actions: vec![
                CardAction {
                    label: "批准".to_string(),
                    action: "approve".to_string(),
                    style: Some(ActionStyle::Primary),
                    url: Some(format!("/approvals/{}", approval.id)),
                },
                CardAction {
                    label: "拒绝".to_string(),
                    action: "reject".to_string(),
                    style: Some(ActionStyle::Danger),
                    url: Some(format!("/approvals/{}", approval.id)),
                },
            ],
        };
        
        let request = SendMessageRequest {
            sender_id: Participant::system_id("approval"),
            receiver_id: Participant::human_id(approver_id),
            content,
            reply_to_id: None,
            metadata: HashMap::new(),
        };
        
        self.message_router.route(request).await?;
        Ok(())
    }
}

/// 系统通知
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemNotification {
    pub title: String,
    pub body: String,
    pub notification_type: NotificationType,
    pub action_url: Option<String>,
    pub action_text: Option<String>,
    pub metadata: HashMap<String, Value>,
}

/// 公告
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Announcement {
    pub id: String,
    pub title: String,
    pub body: String,
    pub scope: AnnouncementScope,
    pub publisher_id: String,
    pub published_at: i64,
    pub expires_at: Option<i64>,
}

/// 公告范围
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AnnouncementScope {
    All,                      // 全员
    Department(String),       // 指定部门
    Users(Vec<String>),       // 指定用户
}

/// 审批信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalInfo {
    pub id: String,
    pub title: String,
    pub description: String,
    pub applicant_name: String,
    pub amount: Option<String>,
}
```

### 免打扰模式

```rust
/// 免打扰服务
pub struct DoNotDisturbService {
    db: Arc<Database>,
}

impl DoNotDisturbService {
    /// 检查是否应该静默
    pub async fn should_silence(
        &self,
        user_id: &str,
        sender_id: &str,
    ) -> Result<bool, MessageError> {
        let settings = self.db.get_user_message_settings(user_id).await?;
        
        // 1. 全局免打扰
        if settings.do_not_disturb_enabled {
            // 检查当前时间是否在免打扰时段内
            if self.is_in_dnd_period(&settings) {
                return Ok(true);
            }
        }
        
        // 2. 会话级免打扰
        let (_, sender_identifier) = Participant::parse_id(sender_id)?;
        if settings.muted_conversations.contains(&sender_identifier) {
            return Ok(true);
        }
        
        // 3. 允许的紧急联系人
        if settings.emergency_contacts.contains(&sender_identifier) {
            return Ok(false);
        }
        
        Ok(false)
    }
    
    fn is_in_dnd_period(&self, settings: &MessageSettings) -> bool {
        let now = chrono::Local::now();
        let current_time = now.time();
        
        if let (Some(start), Some(end)) = (settings.dnd_start_time, settings.dnd_end_time) {
            return current_time >= start && current_time <= end;
        }
        
        false
    }
}

/// 消息设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageSettings {
    pub user_id: String,
    
    /// 免打扰开关
    pub do_not_disturb_enabled: bool,
    
    /// 免打扰开始时间（如22:00）
    pub dnd_start_time: Option<NaiveTime>,
    
    /// 免打扰结束时间（如08:00）
    pub dnd_end_time: Option<NaiveTime>,
    
    /// 静音会话列表
    pub muted_conversations: Vec<String>,
    
    /// 紧急联系人
    pub emergency_contacts: Vec<String>,
    
    /// Agent自动跟随入群
    pub agent_auto_follow_group: bool,
}
```

---

## 权限控制体系

### 权限检查器

```rust
/// 权限检查器
pub struct PermissionChecker {
    db: Arc<Database>,
}

impl PermissionChecker {
    /// 检查发送权限
    pub async fn check_send_permission(
        &self,
        sender: &Participant,
        receiver: &Participant,
    ) -> Result<(), MessageError> {
        match (&sender.participant_type, &receiver.participant_type) {
            // 人→人：检查黑名单
            (ParticipantType::Human, ParticipantType::Human) => {
                let (_, sender_id) = Participant::parse_id(&sender.id)?;
                let (_, receiver_id) = Participant::parse_id(&receiver.id)?;
                
                if self.db.is_in_blacklist(&receiver_id, &sender_id).await? {
                    return Err(MessageError::BlockedByReceiver);
                }
            }
            
            // 人→群：检查群成员身份
            (ParticipantType::Human, ParticipantType::Group) => {
                let (_, sender_id) = Participant::parse_id(&sender.id)?;
                let (_, group_id) = Participant::parse_id(&receiver.id)?;
                
                if !self.db.is_group_member(&group_id, &sender_id).await? {
                    return Err(MessageError::NotGroupMember(group_id));
                }
            }
            
            // Agent→人/群：检查权限配置
            (ParticipantType::Agent, _) => {
                let owner_id = sender.owner_user_id.as_ref()
                    .ok_or(MessageError::AgentWithoutOwner)?;
                
                let permissions = self.db.get_agent_message_permissions(owner_id).await?;
                
                if !permissions.can_send_messages {
                    return Err(MessageError::AgentSendDisabled);
                }
            }
            
            _ => {}
        }
        
        Ok(())
    }
    
    /// 检查查看权限
    pub async fn check_view_permission(
        &self,
        viewer_id: &str,
        message: &Message,
    ) -> Result<(), MessageError> {
        // 1. 发送者可以查看自己的消息
        if message.sender_id == viewer_id {
            return Ok(());
        }
        
        // 2. 私聊消息：接收者可以查看
        let (_, viewer_user_id) = Participant::parse_id(viewer_id)?;
        if message.receiver_id == viewer_id || message.receiver_id == Participant::human_id(&viewer_user_id) {
            return Ok(());
        }
        
        // 3. 群聊消息：群成员可以查看
        let (_, receiver_id) = Participant::parse_id(&message.receiver_id)?;
        if message.sender_type != ParticipantType::Group {
            if self.db.is_group_member(&receiver_id, &viewer_user_id).await? {
                return Ok(());
            }
        }
        
        Err(MessageError::NoViewPermission)
    }
}

/// Agent消息权限配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessagePermissions {
    pub owner_user_id: String,
    
    /// 是否允许发送消息
    pub can_send_messages: bool,
    
    /// 允许发送的对象范围
    pub allowed_receivers: AllowedReceivers,
    
    /// 敏感消息需要确认
    pub sensitive_requires_confirmation: bool,
    
    /// 允许的群组列表（空表示所有）
    pub allowed_groups: Vec<String>,
}

/// 允许的接收者范围
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AllowedReceivers {
    All,                      // 所有人
    Department,               // 同部门
    Whitelist(Vec<String>),   // 白名单
}
```

### 黑名单管理

```rust
/// 黑名单服务
pub struct BlacklistService {
    db: Arc<Database>,
}

impl BlacklistService {
    /// 添加黑名单
    pub async fn add_to_blacklist(
        &self,
        user_id: &str,
        blocked_id: &str,
        reason: Option<String>,
    ) -> Result<(), MessageError> {
        self.db.add_blacklist(user_id, blocked_id, reason).await
    }
    
    /// 移除黑名单
    pub async fn remove_from_blacklist(
        &self,
        user_id: &str,
        blocked_id: &str,
    ) -> Result<(), MessageError> {
        self.db.remove_blacklist(user_id, blocked_id).await
    }
    
    /// 获取黑名单列表
    pub async fn get_blacklist(&self, user_id: &str) -> Result<Vec<BlacklistEntry>, MessageError> {
        self.db.get_blacklist(user_id).await
    }
}

/// 黑名单条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlacklistEntry {
    pub user_id: String,
    pub blocked_id: String,
    pub reason: Option<String>,
    pub created_at: i64,
}
```

---

## 与Agent集成

### Agent消息服务

```rust
/// Agent消息服务
pub struct AgentMessageService {
    db: Arc<Database>,
    message_router: Arc<MessageRouter>,
    permission_checker: Arc<PermissionChecker>,
}

impl AgentMessageService {
    /// Agent发送消息（入口点）
    pub async fn send_message(
        &self,
        owner_user_id: &str,
        receiver_id: &str,
        content: MessageContent,
    ) -> Result<Message, MessageError> {
        let agent_id = Participant::agent_id(owner_user_id);
        
        // 1. 解析接收者
        let receiver = Participant::parse_id(receiver_id)?;
        
        // 2. 检查权限
        let permissions = self.db.get_agent_message_permissions(owner_user_id).await?;
        if !permissions.can_send_messages {
            return Err(MessageError::AgentSendDisabled);
        }
        
        // 3. 检查敏感度
        let sensitivity = self.check_sensitivity(&content);
        if sensitivity.is_sensitive && permissions.sensitive_requires_confirmation {
            // 返回需要确认的状态，等待用户确认
            return Err(MessageError::AgentMessageNeedsConfirmation {
                content,
                receiver_id: receiver_id.to_string(),
                reason: sensitivity.reason,
            });
        }
        
        // 4. 发送消息
        let request = SendMessageRequest {
            sender_id: agent_id,
            receiver_id: receiver_id.to_string(),
            content,
            reply_to_id: None,
            metadata: HashMap::new(),
        };
        
        self.message_router.route(request).await
    }
    
    /// 确认并发送Agent消息
    pub async fn confirm_and_send(
        &self,
        owner_user_id: &str,
        confirmation_id: &str,
    ) -> Result<Message, MessageError> {
        // 1. 获取待确认消息
        let pending = self.db.get_pending_agent_confirmation(confirmation_id).await?
            .ok_or(MessageError::ConfirmationNotFound)?;
        
        // 2. 发送消息
        let request = SendMessageRequest {
            sender_id: Participant::agent_id(owner_user_id),
            receiver_id: pending.receiver_id,
            content: pending.content,
            reply_to_id: None,
            metadata: HashMap::new(),
        };
        
        let message = self.message_router.route(request).await?;
        
        // 3. 清除待确认状态
        self.db.clear_pending_confirmation(confirmation_id).await?;
        
        Ok(message)
    }
    
    /// 检查敏感度
    fn check_sensitivity(&self, content: &MessageContent) -> SensitivityResult {
        match content {
            MessageContent::Text { content } => {
                let sensitive_patterns = [
                    ("密码", "包含密码相关内容"),
                    ("银行卡", "包含银行卡相关信息"),
                    ("转账", "包含转账相关内容"),
                    ("合同", "包含合同相关内容"),
                ];
                
                for (pattern, reason) in sensitive_patterns {
                    if content.contains(pattern) {
                        return SensitivityResult::sensitive(reason);
                    }
                }
                
                SensitivityResult::not_sensitive()
            }
            MessageContent::ApprovalCard { .. } => {
                SensitivityResult::sensitive("审批相关消息")
            }
            _ => SensitivityResult::not_sensitive(),
        }
    }
}
```

### Agent消息确认机制

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Agent消息确认流程                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Agent请求发送消息                                                       │
│       │                                                                 │
│       ▼                                                                 │
│  ┌─────────────┐                                                        │
│  │ 敏感度检查  │                                                        │
│  └──────┬──────┘                                                        │
│         │                                                               │
│    ┌────┴────┐                                                          │
│    │         │                                                          │
│    ▼         ▼                                                          │
│ 普通消息  敏感消息                                                       │    │    │                                                               │
│    │         │                                                          │
│    │         ▼                                                          │
│    │    ┌─────────────┐                                                 │
│    │    │ 弹出确认卡片│                                                 │
│    │    │ 给员工      │                                                 │
│    │    └──────┬──────┘                                                 │
│    │           │                                                        │
│    │      ┌────┴────┐                                                   │
│    │      │         │                                                   │
│    │      ▼         ▼                                                   │
│    │   [确认]    [取消]                                                 │
│    │      │         │                                                   │
│    │      │         └──→ 取消发送                                       │
│    │      │                                                             │
│    └──────┴───────→ 发送消息                                            │
│                   │                                                     │
│                   ▼                                                     │
│              ┌─────────────┐                                            │
│              │ 记录发送日志│                                            │
│              │ (员工可见)  │                                            │
│              └─────────────┘                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API接口设计

### 前端API

```typescript
// 消息服务API
interface MessageServiceAPI {
  // 发送消息
  sendMessage(params: SendMessageParams): Promise<Message>;
  
  // 获取会话列表
  getConversations(): Promise<Conversation[]>;
  
  // 获取会话消息
  getMessages(conversationId: string, beforeId?: string, limit?: number): Promise<Message[]>;
  
  // 标记已读
  markAsRead(conversationId: string, messageId: string): Promise<void>;
  
  // 撤回消息
  recallMessage(messageId: string): Promise<void>;
  
  // 创建群组
  createGroup(params: CreateGroupParams): Promise<Group>;
  
  // 获取通讯录
  getContacts(): Promise<EmployeeContact[]>;
  
  // 搜索员工
  searchEmployees(query: string): Promise<EmployeeContact[]>;
}

// 发送消息参数
interface SendMessageParams {
  receiverId: string;
  content: MessageContent;
  replyToId?: string;
  metadata?: Record<string, any>;
}

// 消息内容类型
type MessageContent = 
  | { type: 'text'; content: string }
  | { type: 'image'; url: string; thumbnailUrl?: string; width?: number; height?: number }
  | { type: 'file'; url: string; filename: string; sizeBytes: number; mimeType: string }
  | { type: 'work_card'; card: WorkCard }
  | { type: 'mention'; mentionedUserId: string; mentionedName: string; content: string };
```

### Tauri IPC Commands

```rust
/// 消息相关Tauri命令
#[tauri::command]
async fn send_message(
    params: SendMessageParams,
    state: State<'_, MessageService>,
) -> Result<Message, String> {
    state.send_message(params).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_conversations(
    state: State<'_, MessageService>,
) -> Result<Vec<Conversation>, String> {
    state.get_conversations().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_messages(
    conversation_id: String,
    before_id: Option<String>,
    limit: Option<u32>,
    state: State<'_, MessageService>,
) -> Result<Vec<Message>, String> {
    state.get_messages(&conversation_id, before_id.as_deref(), limit.unwrap_or(50))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn mark_as_read(
    conversation_id: String,
    message_id: String,
    state: State<'_, MessageService>,
) -> Result<(), String> {
    state.mark_as_read(&conversation_id, &message_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn recall_message(
    message_id: String,
    state: State<'_, MessageService>,
) -> Result<(), String> {
    state.recall_message(&message_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_group(
    params: CreateGroupParams,
    state: State<'_, GroupService>,
) -> Result<Group, String> {
    state.create_group(&params.name, &params.owner_id, params.member_ids)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn search_employees(
    query: String,
    state: State<'_, ContactService>,
) -> Result<Vec<EmployeeContact>, String> {
    state.search_employees(&query).await.map_err(|e| e.to_string())
}
```

---

## Rust实现参考

### 错误类型

```rust
/// 消息系统错误
#[derive(Debug, thiserror::Error)]
pub enum MessageError {
    #[error("无效的参与者ID: {0}")]
    InvalidParticipantId(String),
    
    #[error("用户不存在: {0}")]
    UserNotFound(String),
    
    #[error("群组不存在: {0}")]
    GroupNotFound(String),
    
    #[error("消息不存在: {0}")]
    MessageNotFound(String),
    
    #[error("不是群成员: {0}")]
    NotGroupMember(String),
    
    #[error("已被接收者拉黑")]
    BlockedByReceiver,
    
    #[error("没有权限")]
    NoPermission,
    
    #[error("没有查看权限")]
    NoViewPermission,
    
    #[error("无法撤回消息")]
    CannotRecall,
    
    #[error("撤回时间已过")]
    RecallTimeExceeded,
    
    #[error("Agent没有归属员工")]
    AgentWithoutOwner,
    
    #[error("Agent消息发送被禁用")]
    AgentSendDisabled,
    
    #[error("Agent消息被拒绝")]
    AgentMessageRejected,
    
    #[error("不支持的路由: {0:?} -> {1:?}")]
    UnsupportedRoute(ParticipantType, ParticipantType),
    
    #[error("数据库错误: {0}")]
    DatabaseError(#[from] sqlx::Error),
    
    #[error("序列化错误: {0}")]
    SerializationError(#[from] serde_json::Error),
    
    #[error("Agent消息需要确认: {reason}")]
    AgentMessageNeedsConfirmation {
        content: MessageContent,
        receiver_id: String,
        reason: String,
    },
    
    #[error("确认请求不存在")]
    ConfirmationNotFound,
}
```

### 工具函数

```rust
/// 生成消息ID
pub fn generate_message_id() -> String {
    format!("msg_{}", uuid::Uuid::new_v4().to_string().replace("-", ""))
}

/// 生成会话ID
pub fn generate_conversation_id() -> String {
    format!("conv_{}", uuid::Uuid::new_v4().to_string().replace("-", ""))
}

/// 生成群组ID
pub fn generate_group_id() -> String {
    format!("group_{}", uuid::Uuid::new_v4().to_string().replace("-", ""))
}

/// 获取当前时间戳（毫秒）
pub fn current_timestamp() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

/// 生成私聊会话ID（两人之间的唯一ID）
pub fn generate_private_conversation_id(user1: &str, user2: &str) -> String {
    let mut ids = vec![user1, user2];
    ids.sort(); // 确保顺序一致
    format!("private_{}", 
        sha256::digest(format!("{}:{}", ids[0], ids[1]).as_bytes())
    )
}
```

---

## 总结

本架构设计实现了完整的内部消息系统，核心特点包括：

1. **统一参与者模型**：人和Agent使用统一的消息协议，实现平等协作
2. **智能路由机制**：根据参与者类型自动选择最优路由策略
3. **实时推送保障**：WebSocket + 离线队列确保消息必达
4. **安全可控**：Agent消息确认机制、敏感度检测、权限控制
5. **群聊协作**：Agent可参与群聊，智能补充信息
6. **企业级通知**：支持系统公告、审批通知等多种场景

该架构遵循ADR-021的参与者模型设计原则，与现有四层架构无缝集成，为AI-Automated-office提供可靠的内部通信基础设施。
