# Design: 统一消息系统群聊功能

## 技术架构

### 1. 群聊模型

```
Group
├── id: String
├── name: String
├── announcement: String
├── owner_id: String
├── group_type: GroupType  // public/private
├── created_at: i64
└── members: Vec<GroupMember>

GroupMember
├── user_id: String
├── role: MemberRole  // owner/admin/member
├── agent_enabled: bool  // Agent是否自动入群
├── joined_at: i64
└── left_at: Option<i64>
```

### 2. 核心流程

#### 2.1 Agent跟随入群（FR634, FR635）
```rust
pub async fn add_member(&self, user_id: String, group_id: String) -> Result<()> {
    // 1. 添加用户为群成员
    let member = GroupMember::new(user_id, MemberRole::Member);
    self.add_member_to_group(group_id, member).await?;
    
    // 2. 如果用户Agent启用，自动入群
    if self.user_agent_enabled(&user_id).await? {
        self.add_agent_to_group(&user_id, group_id).await?;
    }
    
    Ok(())
}
```

#### 2.2 @提及检测和响应（FR641）
```rust
pub async fn handle_group_message(&self, message: &GroupMessage) -> Result<Option<GroupMessage>> {
    // 1. 解析@提及
    let mentions = self.parse_mentions(&message.content);
    
    // 2. 检查是否@了Agent或Agent所属员工
    for mention in mentions {
        if let Some(agent_id) = self.resolve_mention_to_agent(&mention).await? {
            // 3. Agent代为回答
            let response = self.agent_respond(&agent_id, &message).await?;
            if let Some(response) = response {
                return Ok(Some(response));
            }
        }
    }
    
    Ok(None)
}
```

### 3. Tauri命令

```rust
// 群组管理
#[tauri::command]
pub async fn create_group(name: String, group_type: GroupType) -> Result<Group, String>;

#[tauri::command]
pub async fn update_group(group_id: String, name: String, announcement: String) -> Result<Group, String>;

#[tauri::command]
pub async fn delete_group(group_id: String) -> Result<(), String>;

// 成员管理
#[tauri::command]
pub async fn invite_member(group_id: String, user_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn remove_member(group_id: String, user_id: String) -> Result<(), String>;

#[tauri::command]
pub async fn set_agent_auto_join(user_id: String, group_id: String, enabled: bool) -> Result<(), String>;

// 消息处理
#[tauri::command]
pub async fn send_group_message(group_id: String, content: String) -> Result<GroupMessage, String>;

#[tauri::command]
pub async fn get_group_messages(group_id: String, limit: Option<usize>) -> Result<Vec<GroupMessage>, String>;
```

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| GC_001 | 群不存在 | 返回错误 |
| GC_002 | 无权限操作 | 返回403 |
| GC_003 | 用户已在群中 | 返回错误 |
| GC_004 | Agent响应超时 | 返回空响应 |
