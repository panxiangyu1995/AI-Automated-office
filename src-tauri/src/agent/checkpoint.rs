//! 检查点服务 - 与AgentRuntime集成
//!
//! 实现FR17-1至FR17-25: 检查点系统功能
//! - 自动检查点创建
//! - 回滚功能 (仅对话/对话+文件)
//! - 编辑重试分支

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 回滚模式
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RollbackMode {
    /// 仅恢复对话历史
    ConversationOnly,
    /// 恢复对话和文件内容
    ConversationAndFiles,
}

/// 检查点
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Checkpoint {
    /// 检查点ID
    pub id: String,
    /// 会话ID
    pub session_id: String,
    /// 创建时间
    pub created_at: i64,
    /// 用户输入预览
    pub user_input_preview: Option<String>,
    /// 用户输入完整内容
    pub user_input_full: Option<String>,
    /// 会话轮次
    pub conversation_turn: i32,
    /// 消息ID列表
    pub message_ids: Option<Vec<String>>,
    /// Git提交哈希
    pub git_commit_hash: Option<String>,
    /// Git提交消息
    pub git_commit_message: Option<String>,
    /// 工件数据 (文件内容等)
    pub artifacts: Option<HashMap<String, String>>,
    /// 是否重要标记
    pub is_important: bool,
    /// 是否为当前活跃检查点
    pub is_active: bool,
    /// 分支ID
    pub branch_id: Option<String>,
    /// 父检查点ID
    pub parent_checkpoint_id: Option<String>,
}

impl Checkpoint {
    pub fn new(
        session_id: String,
        user_input: String,
        conversation_turn: i32,
        message_ids: Vec<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            session_id,
            created_at: Utc::now().timestamp(),
            user_input_preview: Some(user_input.chars().take(50).collect()),
            user_input_full: Some(user_input),
            conversation_turn,
            message_ids: Some(message_ids),
            git_commit_hash: None,
            git_commit_message: None,
            artifacts: None,
            is_important: false,
            is_active: true,
            branch_id: None,
            parent_checkpoint_id: None,
        }
    }

    pub fn created_at_dt(&self) -> DateTime<Utc> {
        DateTime::from_timestamp(self.created_at, 0)
            .unwrap_or_else(|| Utc::now())
    }
}

/// 会话上下文 (用于回滚)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionContext {
    /// 会话ID
    pub session_id: String,
    /// 当前消息列表
    pub messages: Vec<SessionMessage>,
    /// 当前检查点ID
    pub current_checkpoint_id: Option<String>,
    /// 分支ID
    pub branch_id: Option<String>,
    /// 轮次计数
    pub turn_count: i32,
    /// 文件状态
    pub file_states: HashMap<String, FileState>,
}

/// 会话消息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

/// 文件状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileState {
    pub path: String,
    pub content: String,
    pub timestamp: i64,
}

/// 检查点服务
pub struct CheckpointService {
    /// 检查点存储
    checkpoints: Arc<RwLock<HashMap<String, Vec<Checkpoint>>>>,
    /// 最大检查点数量
    max_checkpoints: usize,
    /// 自动清理天数
    auto_cleanup_days: i64,
    /// Git管理器 (可选)
    git_manager: Option<Arc<dyn GitCommitManager>>,
}

impl CheckpointService {
    pub fn new() -> Self {
        Self {
            checkpoints: Arc::new(RwLock::new(HashMap::new())),
            max_checkpoints: 100,
            auto_cleanup_days: 30,
            git_manager: None,
        }
    }

    pub fn with_git_manager(mut self, manager: Arc<dyn GitCommitManager>) -> Self {
        self.git_manager = Some(manager);
        self
    }

    /// 创建自动检查点
    pub async fn create_auto_checkpoint(
        &self,
        session_id: &str,
        user_input: &str,
        conversation_turn: i32,
        message_ids: Vec<String>,
        current_checkpoint_id: Option<&str>,
    ) -> Checkpoint {
        // 1. 生成检查点
        let mut checkpoint = Checkpoint::new(
            session_id.to_string(),
            user_input.to_string(),
            conversation_turn,
            message_ids,
        );
        checkpoint.parent_checkpoint_id = current_checkpoint_id.map(|s| s.to_string());
        
        let checkpoint_id = checkpoint.id.clone();
        
        // 2. 保存检查点
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints
            .entry(session_id.to_string())
            .or_insert_with(Vec::new)
            .push(checkpoint.clone());
        
        // 3. Git提交 (如果启用)
        if let Some(git) = &self.git_manager {
            if let Ok((hash, message)) = git.commit(&checkpoint).await {
                checkpoint.git_commit_hash = Some(hash);
                checkpoint.git_commit_message = Some(message);
            }
        }
        
        // 4. 标记之前的检查点为非活跃
        if let Some(session_checkpoints) = checkpoints.get_mut(session_id) {
            for cp in session_checkpoints.iter_mut() {
                if cp.id != checkpoint_id {
                    cp.is_active = false;
                }
            }
        }
        
        // 5. 检查并清理旧检查点
        drop(checkpoints);
        self.check_cleanup().await;
        
        checkpoint
    }

    /// 创建重要检查点 (手动标记)
    pub async fn create_important_checkpoint(
        &self,
        session_id: &str,
        user_input: &str,
        conversation_turn: i32,
        message_ids: Vec<String>,
    ) -> Checkpoint {
        let mut checkpoint = Checkpoint::new(
            session_id.to_string(),
            user_input.to_string(),
            conversation_turn,
            message_ids,
        );
        checkpoint.is_important = true;
        
        let checkpoints = self.checkpoints.read().await;
        let session_checkpoints = checkpoints.get(session_id);
        
        if let Some(cps) = session_checkpoints {
            checkpoint.parent_checkpoint_id = cps.last().map(|cp| cp.id.clone());
        }
        
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints
            .entry(session_id.to_string())
            .or_insert_with(Vec::new)
            .push(checkpoint.clone());
        
        checkpoint
    }

    /// 获取会话的所有检查点
    pub async fn get_checkpoints(&self, session_id: &str) -> Vec<Checkpoint> {
        let checkpoints = self.checkpoints.read().await;
        checkpoints.get(session_id)
            .map(|cps| cps.clone())
            .unwrap_or_default()
    }

    /// 获取单个检查点
    pub async fn get_checkpoint(&self, checkpoint_id: &str) -> Option<Checkpoint> {
        let checkpoints = self.checkpoints.read().await;
        
        for session_checkpoints in checkpoints.values() {
            if let Some(cp) = session_checkpoints.iter().find(|cp| cp.id == checkpoint_id) {
                return Some(cp.clone());
            }
        }
        None
    }

    /// 回滚到检查点
    pub async fn rollback_to(
        &self,
        checkpoint_id: &str,
        mode: RollbackMode,
    ) -> Result<SessionContext, CheckpointError> {
        let checkpoint = self.get_checkpoint(checkpoint_id).await
            .ok_or(CheckpointError::NotFound)?;
        
        match mode {
            RollbackMode::ConversationOnly => {
                self.restore_conversation(&checkpoint).await
            }
            RollbackMode::ConversationAndFiles => {
                self.restore_with_files(&checkpoint).await
            }
        }
    }

    /// 仅恢复对话历史
    async fn restore_conversation(&self, checkpoint: &Checkpoint) -> Result<SessionContext, CheckpointError> {
        // 提取消息ID
        let message_ids = checkpoint.message_ids.clone()
            .ok_or(CheckpointError::InvalidData)?;
        
        // 构建上下文
        let context = SessionContext {
            session_id: checkpoint.session_id.clone(),
            messages: Vec::new(), // 实际需要从消息存储获取
            current_checkpoint_id: Some(checkpoint.id.clone()),
            branch_id: checkpoint.branch_id.clone(),
            turn_count: checkpoint.conversation_turn,
            file_states: HashMap::new(),
        };
        
        Ok(context)
    }

    /// 恢复对话和文件
    async fn restore_with_files(&self, checkpoint: &Checkpoint) -> Result<SessionContext, CheckpointError> {
        // 通过Git恢复文件
        if let Some(git_hash) = &checkpoint.git_commit_hash {
            if let Some(git) = &self.git_manager {
                // 从Git获取文件状态
                let file_states = git.get_files_at_commit(git_hash).await
                    .map_err(|_| CheckpointError::GitError)?;
                
                let context = SessionContext {
                    session_id: checkpoint.session_id.clone(),
                    messages: Vec::new(),
                    current_checkpoint_id: Some(checkpoint.id.clone()),
                    branch_id: checkpoint.branch_id.clone(),
                    turn_count: checkpoint.conversation_turn,
                    file_states,
                };
                
                return Ok(context);
            }
        }
        
        // 如果没有Git，使用工件数据
        let file_states = checkpoint.artifacts.as_ref()
            .map(|artifacts| {
                artifacts.iter().map(|(k, v)| (k.clone(), FileState {
                    path: k.clone(),
                    content: v.clone(),
                    timestamp: checkpoint.created_at,
                })).collect()
            })
            .unwrap_or_default();
        
        let context = SessionContext {
            session_id: checkpoint.session_id.clone(),
            messages: Vec::new(),
            current_checkpoint_id: Some(checkpoint.id.clone()),
            branch_id: checkpoint.branch_id.clone(),
            turn_count: checkpoint.conversation_turn,
            file_states,
        };
        
        Ok(context)
    }

    /// 编辑并重发
    pub async fn edit_and_resend(
        &self,
        checkpoint_id: &str,
        new_input: &str,
    ) -> Result<(Checkpoint, SessionContext), CheckpointError> {
        // 1. 获取原始检查点
        let original = self.get_checkpoint(checkpoint_id).await
            .ok_or(CheckpointError::NotFound)?;
        
        // 2. 创建分支 (从当前检查点)
        let new_checkpoint = Checkpoint {
            id: Uuid::new_v4().to_string(),
            session_id: original.session_id.clone(),
            created_at: Utc::now().timestamp(),
            user_input_preview: Some(new_input.chars().take(50).collect()),
            user_input_full: Some(new_input.to_string()),
            conversation_turn: original.conversation_turn + 1,
            message_ids: None,
            git_commit_hash: None,
            git_commit_message: None,
            artifacts: None,
            is_important: false,
            is_active: true,
            branch_id: Some(Uuid::new_v4().to_string()), // 新分支
            parent_checkpoint_id: Some(checkpoint_id.to_string()),
        };
        
        // 3. 保存新检查点
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints
            .entry(original.session_id.clone())
            .or_insert_with(Vec::new)
            .push(new_checkpoint.clone());
        
        // 4. 构建上下文
        let context = SessionContext {
            session_id: original.session_id,
            messages: Vec::new(),
            current_checkpoint_id: Some(new_checkpoint.id.clone()),
            branch_id: new_checkpoint.branch_id.clone(),
            turn_count: new_checkpoint.conversation_turn,
            file_states: HashMap::new(),
        };
        
        Ok((new_checkpoint, context))
    }

    /// 标记检查点为重要
    pub async fn toggle_important(
        &self,
        checkpoint_id: &str,
        important: bool,
    ) -> Result<(), CheckpointError> {
        let mut checkpoints = self.checkpoints.write().await;
        
        for session_checkpoints in checkpoints.values_mut() {
            if let Some(cp) = session_checkpoints.iter_mut().find(|cp| cp.id == checkpoint_id) {
                cp.is_important = important;
                return Ok(());
            }
        }
        
        Err(CheckpointError::NotFound)
    }

    /// 删除检查点
    pub async fn delete_checkpoint(&self, checkpoint_id: &str) -> Result<(), CheckpointError> {
        let mut checkpoints = self.checkpoints.write().await;
        
        for session_checkpoints in checkpoints.values_mut() {
            let initial_len = session_checkpoints.len();
            session_checkpoints.retain(|cp| cp.id != checkpoint_id);
            
            if session_checkpoints.len() != initial_len {
                return Ok(());
            }
        }
        
        Err(CheckpointError::NotFound)
    }

    /// 清理旧检查点
    async fn check_cleanup(&self) {
        let cutoff = Utc::now().timestamp() - (self.auto_cleanup_days * 24 * 60 * 60);
        
        let mut checkpoints = self.checkpoints.write().await;
        
        for session_checkpoints in checkpoints.values_mut() {
            // 保留重要检查点和最近的检查点
            session_checkpoints.retain(|cp| {
                cp.is_important || cp.created_at > cutoff
            });
            
            // 限制最大数量
            while session_checkpoints.len() > self.max_checkpoints {
                // 删除最老的非重要检查点
                if let Some(pos) = session_checkpoints.iter().position(|cp| !cp.is_important) {
                    session_checkpoints.remove(pos);
                } else {
                    break;
                }
            }
        }
    }
}

impl Default for CheckpointService {
    fn default() -> Self {
        Self::new()
    }
}

/// Git提交管理器接口
pub trait GitCommitManager: Send + Sync {
    /// 提交检查点
    async fn commit(&self, checkpoint: &Checkpoint) -> Result<(String, String), String>;
    
    /// 获取指定提交的文件状态
    async fn get_files_at_commit(&self, commit_hash: &str) -> Result<HashMap<String, String>, String>;
}

/// 检查点错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum CheckpointError {
    NotFound,
    InvalidData,
    GitError,
    StorageError,
}

impl std::fmt::Display for CheckpointError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotFound => write!(f, "检查点不存在"),
            Self::InvalidData => write!(f, "检查点数据无效"),
            Self::GitError => write!(f, "Git操作失败"),
            Self::StorageError => write!(f, "存储操作失败"),
        }
    }
}

impl std::error::Error for CheckpointError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_checkpoint() {
        let service = CheckpointService::new();
        
        let checkpoint = service.create_auto_checkpoint(
            "session-1",
            "Hello world",
            1,
            vec!["msg-1".to_string()],
            None,
        ).await;
        
        assert_eq!(checkpoint.session_id, "session-1");
        assert_eq!(checkpoint.conversation_turn, 1);
        assert!(!checkpoint.is_important);
    }

    #[tokio::test]
    async fn test_get_checkpoints() {
        let service = CheckpointService::new();
        
        // 创建多个检查点
        service.create_auto_checkpoint(
            "session-1",
            "First",
            1,
            vec![],
            None,
        ).await;
        
        service.create_auto_checkpoint(
            "session-1",
            "Second",
            2,
            vec![],
            None,
        ).await;
        
        let checkpoints = service.get_checkpoints("session-1").await;
        assert_eq!(checkpoints.len(), 2);
    }

    #[tokio::test]
    async fn test_delete_checkpoint() {
        let service = CheckpointService::new();
        
        let checkpoint = service.create_auto_checkpoint(
            "session-1",
            "Test",
            1,
            vec![],
            None,
        ).await;
        
        let result = service.delete_checkpoint(&checkpoint.id).await;
        assert!(result.is_ok());
        
        let checkpoints = service.get_checkpoints("session-1").await;
        assert!(checkpoints.is_empty());
    }
}
