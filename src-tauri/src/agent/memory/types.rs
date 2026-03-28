//! Core type definitions for the memory system.

use serde::{Deserialize, Serialize};

/// Memory layer levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryLayer {
    /// L1: Personal memory (only accessible by the user)
    Personal,
    /// L2: Enterprise knowledge base (accessible by all tenant members)
    Enterprise,
    /// L3: Graph memory (Post-MVP)
    Graph,
}

impl Default for MemoryLayer {
    fn default() -> Self {
        MemoryLayer::Personal
    }
}

/// Memory category
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemoryCategory {
    Preference, // User preference
    Fact,       // Key fact
    Rule,       // Business rule
    Context,    // Session context
    Observation, // Observation
    Summary,    // Summary
    Knowledge,  // Knowledge
}

impl Default for MemoryCategory {
    fn default() -> Self {
        MemoryCategory::Context
    }
}

/// Memory source
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MemorySource {
    UserInput,      // User input
    AgentInference, // Agent inference
    ToolResult,     // Tool result
    SystemImport,   // System import
    KnowledgeBase,  // Knowledge base
}

impl Default for MemorySource {
    fn default() -> Self {
        MemorySource::UserInput
    }
}

/// Memory item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryItem {
    pub id: String,
    pub layer: MemoryLayer,
    pub tenant_id: String,
    pub user_id: Option<String>,
    pub session_key: Option<String>,
    pub key: String,
    pub value: String,
    pub category: MemoryCategory,
    pub confidence: f64,
    pub source: MemorySource,
    pub embedding: Option<Vec<f32>>,
    pub metadata: serde_json::Value,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_accessed_at: Option<i64>,
    pub access_count: i64,
    pub version: u32,
    pub is_deleted: bool,
}

impl Default for MemoryItem {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            layer: MemoryLayer::Personal,
            tenant_id: String::new(),
            user_id: None,
            session_key: None,
            key: String::new(),
            value: String::new(),
            category: MemoryCategory::Context,
            confidence: 1.0,
            source: MemorySource::UserInput,
            embedding: None,
            metadata: serde_json::json!({}),
            created_at: now,
            updated_at: now,
            last_accessed_at: None,
            access_count: 0,
            version: 1,
            is_deleted: false,
        }
    }
}

/// Memory query
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryQuery {
    pub query: String,
    pub layer: Option<MemoryLayer>,
    pub user_id: Option<String>,
    pub tenant_id: String,
    pub category: Option<MemoryCategory>,
    pub k: usize,
    pub token_budget: Option<usize>,
}

impl Default for MemoryQuery {
    fn default() -> Self {
        Self {
            query: String::new(),
            layer: None,
            user_id: None,
            tenant_id: String::new(),
            category: None,
            k: 10,
            token_budget: None,
        }
    }
}

/// Memory search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySearchResult {
    pub item: MemoryItem,
    pub score: f64,
    pub vector_score: Option<f64>,
    pub bm25_score: Option<f64>,
    pub highlights: Vec<String>,
}

/// Hybrid search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HybridSearchResult {
    pub items: Vec<MemorySearchResult>,
    pub total: usize,
    pub vector_time_ms: u64,
    pub bm25_time_ms: u64,
    pub fusion_time_ms: u64,
}

/// Hook event types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum HookEvent {
    SessionStart {
        session_key: String,
        user_id: String,
    },
    UserPromptSubmit {
        session_key: String,
        prompt: String,
    },
    PostToolUse {
        session_key: String,
        tool_name: String,
        result: String,
    },
    Stop {
        session_key: String,
        reason: String,
    },
    SessionEnd {
        session_key: String,
    },
}

/// Smart update decision action
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UpdateAction {
    Add,    // Add new memory
    Update, // Update existing memory
    Delete, // Delete memory
    None,   // No update needed
    Merge,  // Merge memory
}

/// Smart update decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDecision {
    pub action: UpdateAction,
    pub reason: String,
    pub confidence: f64,
    pub affected_items: Vec<String>,
}

/// Memory statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    pub total_items: usize,
    pub personal_items: usize,
    pub enterprise_items: usize,
    pub by_category: std::collections::HashMap<String, usize>,
}

/// Sync result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub synced_items: usize,
    pub conflicts: usize,
    pub errors: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_item_default() {
        let item = MemoryItem::default();
        assert_eq!(item.layer, MemoryLayer::Personal);
        assert_eq!(item.confidence, 1.0);
        assert!(!item.is_deleted);
    }

    #[test]
    fn test_memory_query_default() {
        let query = MemoryQuery::default();
        assert_eq!(query.k, 10);
    }
}
