# Design: 审批附件与流程追溯

## 数据模型

```rust
pub struct ApprovalAttachment {
    pub id: String,
    pub approval_id: String,
    pub uploader_id: String,
    pub file_name: String,
    pub file_type: String,
    pub file_size: i64,
    pub storage_path: String,
    pub uploaded_at: i64,
}

pub struct TimelineEvent {
    pub id: String,
    pub approval_id: String,
    pub actor_id: String,
    pub actor_type: ActorType,  // human/agent/system
    pub action: String,
    pub comment: Option<String>,
    pub attachments: Vec<String>,
    pub created_at: i64,
}
```

## Tauri命令

```rust
#[tauri::command]
pub async fn upload_attachment(
    approval_id: String,
    file_data: Vec<u8>,
    file_name: String,
) -> Result<ApprovalAttachment, String>;

#[tauri::command]
pub async fn get_timeline(approval_id: String) -> Result<Vec<TimelineEvent>, String>;
```
