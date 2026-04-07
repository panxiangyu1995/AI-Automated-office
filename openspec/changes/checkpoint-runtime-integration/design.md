# Design: 检查点系统Runtime集成

## 技术架构

### 1. 检查点流程

```
用户发送消息 → 创建检查点 → 保存上下文 → Git提交（可选）
                        ↓
                  显示标记线
                        ↓
用户回滚 → 恢复上下文 → 重新执行
```

### 2. 核心组件

#### 2.1 CheckpointService
```rust
pub struct CheckpointService {
    store: CheckpointStore,
    git_manager: Option<GitManager>,
    max_checkpoints: usize,  // 默认100
    auto_cleanup_days: i64,  // 默认30天
}

impl CheckpointService {
    // 自动创建检查点
    pub async fn create_auto_checkpoint(
        &self,
        session_id: &str,
        user_input: &str,
        context: &SessionContext,
    ) -> Result<Checkpoint> {
        // 1. 生成检查点ID
        let id = uuid::Uuid::new_v4().to_string();
        
        // 2. 捕获会话状态
        let checkpoint = Checkpoint {
            id: id.clone(),
            session_id: session_id.to_string(),
            created_at: Utc::now().timestamp(),
            user_input_preview: Some(user_input.chars().take(50).collect()),
            user_input_full: Some(user_input.to_string()),
            conversation_turn: context.turn_count,
            message_ids: Some(serde_json::to_value(&context.messages)?),
            git_commit_hash: None,
            git_commit_message: None,
            artifacts: None,
            is_important: false,
            is_active: true,
            branch_id: context.branch_id.clone(),
            parent_checkpoint_id: context.current_checkpoint.clone(),
        };
        
        // 3. 保存到存储
        self.store.create(&checkpoint).await?;
        
        // 4. Git提交（如果启用）
        if let Some(git) = &self.git_manager {
            let commit_hash = git.commit(&checkpoint).await?;
            self.store.update_git_hash(&id, &commit_hash).await?;
        }
        
        // 5. 检查是否需要清理
        self.check_cleanup().await?;
        
        Ok(checkpoint)
    }
    
    // 回滚到检查点
    pub async fn rollback_to(
        &self,
        checkpoint_id: &str,
        mode: RollbackMode,
    ) -> Result<SessionContext> {
        let checkpoint = self.store.get_by_id(checkpoint_id).await?
            .ok_or(CheckpointError::NotFound)?;
        
        match mode {
            RollbackMode::ConversationOnly => {
                // 仅恢复对话历史
                let context = self.restore_conversation(&checkpoint).await?;
                Ok(context)
            }
            RollbackMode::ConversationAndFiles => {
                // 恢复对话和文件（通过Git）
                let context = self.restore_with_files(&checkpoint).await?;
                Ok(context)
            }
        }
    }
}
```

### 3. RollbackMode定义

```rust
pub enum RollbackMode {
    // 仅恢复对话历史
    ConversationOnly,
    // 恢复对话和文件内容
    ConversationAndFiles,
}
```

### 4. 集成到AgentRuntime

在消息发送钩子中自动创建检查点：

```rust
// src-tauri/src/agent/execution.rs
pub async fn execute_message(
    &self,
    request: ExecuteRequest,
) -> Result<ExecuteResponse> {
    // 1. 创建检查点
    let checkpoint = self.checkpoint_service
        .create_auto_checkpoint(
            &request.session_id,
            &request.message,
            &self.context,
        )
        .await?;
    
    // 2. 执行消息
    let response = self.execute_internal(&request).await?;
    
    // 3. 更新检查点
    self.checkpoint_service
        .mark_active(&checkpoint.id)
        .await?;
    
    Ok(response)
}
```

### 5. Tauri命令

```rust
#[tauri::command]
pub async fn get_checkpoints(
    session_id: String,
) -> Result<Vec<Checkpoint>, String>;

#[tauri::command]
pub async fn rollback_to_checkpoint(
    checkpoint_id: String,
    mode: RollbackMode,
) -> Result<SessionContext, String>;

#[tauri::command]
pub async fn edit_and_resend(
    checkpoint_id: String,
    new_input: String,
) -> Result<SessionContext, String>;

#[tauri::command]
pub async fn delete_checkpoint(
    checkpoint_id: String,
) -> Result<(), String>;

#[tauri::command]
pub async fn toggle_checkpoint_important(
    checkpoint_id: String,
    important: bool,
) -> Result<(), String>;
```
