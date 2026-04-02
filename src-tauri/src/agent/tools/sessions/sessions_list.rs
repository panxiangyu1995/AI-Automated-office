//! Sessions list tool implementation.

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::pipeline::ToolErrorCode;

/// Session visibility filter
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SessionsVisibility {
    /// Only the current session
    Self_,
    /// Current session + spawned sub-sessions (default)
    Tree,
    /// Any session belonging to the current agent
    Agent,
    /// Any session (requires special permission)
    All,
}

impl Default for SessionsVisibility {
    fn default() -> Self {
        Self::Tree
    }
}

/// Parameters for sessions list
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsListParams {
    /// Visibility filter (default: Tree)
    #[serde(default)]
    pub visibility: SessionsVisibility,

    /// Maximum number of results
    #[serde(default = "default_limit")]
    pub limit: usize,

    /// Include sub-agent sessions
    #[serde(default = "default_true")]
    pub include_subagents: bool,

    /// Filter by status
    #[serde(default)]
    pub status_filter: Option<String>,
}

fn default_limit() -> usize {
    20
}

fn default_true() -> bool {
    true
}

/// Session status enum
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Pending,
    Running,
    Waiting,
    Completed,
    Failed,
    Cancelled,
}

/// Session information
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub id: String,
    pub title: String,
    pub status: SessionStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub parent_id: Option<String>,
    pub agent_id: Option<String>,
    pub model: Option<String>,
    pub message_count: usize,
    pub is_subagent: bool,
}

/// Sessions list response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionsListResponse {
    pub sessions: Vec<SessionInfo>,
    pub total: usize,
    pub duration_ms: u64,
}

/// Mock session store for development
pub struct MockSessionStore {
    sessions: HashMap<String, SessionInfo>,
}

impl MockSessionStore {
    pub fn new() -> Self {
        let mut store = Self {
            sessions: HashMap::new(),
        };
        store.add_sample_sessions();
        store
    }

    fn add_sample_sessions(&mut self) {
        let now = chrono::Utc::now().timestamp();

        let samples = vec![
            ("session-1", "Main Agent Session", SessionStatus::Running, None, false),
            ("session-2", "Sub-agent: Research Task", SessionStatus::Completed, Some("session-1"), true),
            ("session-3", "Sub-agent: Code Review", SessionStatus::Running, Some("session-1"), true),
            ("session-4", "Background Task: Data Sync", SessionStatus::Pending, None, false),
        ];

        for (id, title, status, parent_id, is_subagent) in samples {
            self.sessions.insert(id.to_string(), SessionInfo {
                id: id.to_string(),
                title: title.to_string(),
                status,
                created_at: now - 3600,
                updated_at: now,
                parent_id: parent_id.map(String::from),
                agent_id: Some("default-agent".to_string()),
                model: Some("gpt-4".to_string()),
                message_count: 10,
                is_subagent,
            });
        }
    }

    pub fn list(&self, visibility: &SessionsVisibility, limit: usize) -> Vec<SessionInfo> {
        let mut result: Vec<SessionInfo> = match visibility {
            SessionsVisibility::Self_ => {
                // Return current session only (placeholder)
                vec![]
            }
            SessionsVisibility::Tree => {
                // Current + children
                self.sessions.values()
                    .filter(|s| !s.is_subagent || s.parent_id.is_some())
                    .cloned()
                    .collect()
            }
            SessionsVisibility::Agent => {
                // All sessions for current agent
                self.sessions.values().cloned().collect()
            }
            SessionsVisibility::All => {
                // All sessions (admin only in real impl)
                self.sessions.values().cloned().collect()
            }
        };

        result.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        result.truncate(limit);
        result
    }

    pub fn get(&self, id: &str) -> Option<&SessionInfo> {
        self.sessions.get(id)
    }
}

impl Default for MockSessionStore {
    fn default() -> Self {
        Self::new()
    }
}

/// Sessions list executor
pub struct SessionsListExecutor {
    store: Arc<MockSessionStore>,
}

impl SessionsListExecutor {
    pub fn new() -> Self {
        Self {
            store: Arc::new(MockSessionStore::new()),
        }
    }
}

impl Default for SessionsListExecutor {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ToolExecutor for SessionsListExecutor {
    async fn execute(
        &self,
        params: Value,
        _context: &ToolExecutionContext,
    ) -> Result<Value, ToolExecutionError> {
        let start = Instant::now();

        let list_params: SessionsListParams = match serde_json::from_value(params) {
            Ok(p) => p,
            Err(e) => {
                return Err(ToolExecutionError {
                    code: ToolErrorCode::ValidationError,
                    message: format!("Invalid parameters: {}", e),
                    details: None,
                    recoverable: true,
                    retryable: false,
                });
            }
        };

        // Validate limit
        if list_params.limit > 100 {
            return Err(ToolExecutionError {
                code: ToolErrorCode::ValidationError,
                message: "Limit cannot exceed 100".to_string(),
                details: None,
                recoverable: true,
                retryable: false,
            });
        }

        let sessions = self.store.list(&list_params.visibility, list_params.limit);
        let total = sessions.len();
        let duration_ms = start.elapsed().as_millis() as u64;

        let response = SessionsListResponse {
            sessions,
            total,
            duration_ms,
        };

        Ok(serde_json::to_value(response).map_err(|e| ToolExecutionError {
            code: ToolErrorCode::InternalError,
            message: format!("Failed to serialize response: {}", e),
            details: None,
            recoverable: false,
            retryable: false,
        })?)
    }
}
