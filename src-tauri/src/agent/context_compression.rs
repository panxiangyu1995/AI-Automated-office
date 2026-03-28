//! Context Compression and Session Summary Module
//!
//! This module implements:
//! - Token budget management and compression policies
//! - Session summary generation and persistence
//! - Summary refresh triggers and expiry behavior
//! - Compressed context integration with PromptBuilder
//!
//! Story 53.2 - Context compression and session summary persistence

use anyhow::{anyhow, Result};
use async_trait::async_trait;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{Row, SqlitePool};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::storage::StorageManager;

/// Token budget configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenBudget {
    /// Maximum tokens allowed in context
    pub max_tokens: usize,
    /// Warning threshold (percentage of max)
    pub warning_threshold: f64,
    /// Critical threshold (percentage of max)
    pub critical_threshold: f64,
    /// Compression ratio to target
    pub compression_ratio: f64,
}

impl Default for TokenBudget {
    fn default() -> Self {
        Self {
            max_tokens: 8000,
            warning_threshold: 0.7,
            critical_threshold: 0.9,
            compression_ratio: 0.5,
        }
    }
}

/// Compression strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompressionStrategy {
    /// Summary mode: generate summary and replace history
    Summary,
    /// Sliding window: keep only recent messages
    SlidingWindow,
    /// Hybrid: summary + recent messages
    Hybrid,
}

impl Default for CompressionStrategy {
    fn default() -> Self {
        Self::Hybrid
    }
}

/// Refresh trigger type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RefreshTrigger {
    /// After N messages
    MessageCount(usize),
    /// After tool completion
    ToolCompletion,
    /// After error recovery
    ErrorRecovery,
    /// After important milestone
    Milestone,
    /// User requested
    UserRequest,
    /// Time-based interval
    TimeInterval(u64),
}

/// Compression statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionStats {
    pub total_messages: usize,
    pub total_parts: usize,
    pub tool_calls_count: usize,
    pub errors_count: usize,
    pub user_messages_count: usize,
    pub assistant_messages_count: usize,
    pub total_tokens: usize,
}

/// Session summary structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    pub id: String,
    pub session_id: String,
    pub summary_text: String,
    pub key_facts: Vec<String>,
    pub statistics: CompressionStats,
    pub token_count: usize,
    pub message_count: usize,
    pub created_at: i64,
    pub updated_at: i64,
    pub expires_at: Option<i64>,
    pub is_active: bool,
    pub version: i32,
}

/// Summary store for database operations
pub struct SummaryStore {
    pool: SqlitePool,
}

impl SummaryStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Create a new summary
    pub async fn create(&self, summary: &SessionSummary) -> Result<()> {
        let key_facts_json = serde_json::to_string(&summary.key_facts)?;
        let stats_json = serde_json::to_string(&summary.statistics)?;

        sqlx::query(
            "INSERT INTO session_summaries (
                id, session_id, summary_text, key_facts, statistics,
                token_count, message_count, created_at, updated_at,
                expires_at, is_active, version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&summary.id)
        .bind(&summary.session_id)
        .bind(&summary.summary_text)
        .bind(&key_facts_json)
        .bind(&stats_json)
        .bind(summary.token_count as i64)
        .bind(summary.message_count as i64)
        .bind(summary.created_at)
        .bind(summary.updated_at)
        .bind(summary.expires_at)
        .bind(if summary.is_active { 1 } else { 0 })
        .bind(summary.version)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get active summary for a session
    pub async fn get_active(&self, session_id: &str) -> Result<Option<SessionSummary>> {
        let row = sqlx::query(
            "SELECT id, session_id, summary_text, key_facts, statistics,
                    token_count, message_count, created_at, updated_at,
                    expires_at, is_active, version
             FROM session_summaries
             WHERE session_id = ? AND is_active = 1
             ORDER BY created_at DESC LIMIT 1;",
        )
        .bind(session_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_summary))
    }

    /// Get summary by ID
    pub async fn get_by_id(&self, id: &str) -> Result<Option<SessionSummary>> {
        let row = sqlx::query(
            "SELECT id, session_id, summary_text, key_facts, statistics,
                    token_count, message_count, created_at, updated_at,
                    expires_at, is_active, version
             FROM session_summaries
             WHERE id = ?;",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(map_summary))
    }

    /// Deactivate old summaries for a session
    pub async fn deactivate_old(&self, session_id: &str, keep_id: &str) -> Result<()> {
        sqlx::query(
            "UPDATE session_summaries
             SET is_active = 0
             WHERE session_id = ? AND id != ?;",
        )
        .bind(session_id)
        .bind(keep_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Update summary
    pub async fn update(&self, summary: &SessionSummary) -> Result<()> {
        let key_facts_json = serde_json::to_string(&summary.key_facts)?;
        let stats_json = serde_json::to_string(&summary.statistics)?;

        sqlx::query(
            "UPDATE session_summaries
             SET summary_text = ?, key_facts = ?, statistics = ?,
                 token_count = ?, message_count = ?, updated_at = ?,
                 expires_at = ?, is_active = ?, version = ?
             WHERE id = ?;",
        )
        .bind(&summary.summary_text)
        .bind(&key_facts_json)
        .bind(&stats_json)
        .bind(summary.token_count as i64)
        .bind(summary.message_count as i64)
        .bind(summary.updated_at)
        .bind(summary.expires_at)
        .bind(if summary.is_active { 1 } else { 0 })
        .bind(summary.version)
        .bind(&summary.id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Delete expired summaries
    pub async fn delete_expired(&self) -> Result<usize> {
        let now = Utc::now().timestamp();
        let result = sqlx::query(
            "DELETE FROM session_summaries
             WHERE expires_at IS NOT NULL AND expires_at < ?;",
        )
        .bind(now)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() as usize)
    }

    /// Get summaries by session
    pub async fn get_by_session(&self, session_id: &str) -> Result<Vec<SessionSummary>> {
        let rows = sqlx::query(
            "SELECT id, session_id, summary_text, key_facts, statistics,
                    token_count, message_count, created_at, updated_at,
                    expires_at, is_active, version
             FROM session_summaries
             WHERE session_id = ?
             ORDER BY created_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_summary).collect())
    }
}

fn map_summary(row: sqlx::sqlite::SqliteRow) -> SessionSummary {
    let key_facts_json: String = row.get("key_facts");
    let stats_json: String = row.get("statistics");

    let key_facts: Vec<String> = serde_json::from_str(&key_facts_json).unwrap_or_default();
    let statistics: CompressionStats = serde_json::from_str(&stats_json)
        .unwrap_or(CompressionStats {
            total_messages: 0,
            total_parts: 0,
            tool_calls_count: 0,
            errors_count: 0,
            user_messages_count: 0,
            assistant_messages_count: 0,
            total_tokens: 0,
        });

    SessionSummary {
        id: row.get("id"),
        session_id: row.get("session_id"),
        summary_text: row.get("summary_text"),
        key_facts,
        statistics,
        token_count: row.get::<i64, _>("token_count") as usize,
        message_count: row.get::<i64, _>("message_count") as usize,
        created_at: row.get("created_at"),
        updated_at: row.get("updated_at"),
        expires_at: row.get("expires_at"),
        is_active: row.get::<i64, _>("is_active") != 0,
        version: row.get("version"),
    }
}

/// Context compressor for managing token budgets
#[derive(Clone)]
pub struct ContextCompressor {
    token_budget: TokenBudget,
    compression_strategy: CompressionStrategy,
}

impl ContextCompressor {
    pub fn new() -> Self {
        Self {
            token_budget: TokenBudget::default(),
            compression_strategy: CompressionStrategy::default(),
        }
    }

    pub fn with_budget(mut self, budget: TokenBudget) -> Self {
        self.token_budget = budget;
        self
    }

    pub fn with_strategy(mut self, strategy: CompressionStrategy) -> Self {
        self.compression_strategy = strategy;
        self
    }

    /// Calculate current token usage percentage
    pub fn calculate_usage(&self, current_tokens: usize) -> f64 {
        if self.token_budget.max_tokens == 0 {
            return 0.0;
        }
        current_tokens as f64 / self.token_budget.max_tokens as f64
    }

    /// Check if compression is needed
    pub fn needs_compression(&self, current_tokens: usize) -> bool {
        self.calculate_usage(current_tokens) >= self.token_budget.critical_threshold
    }

    /// Check if warning threshold is reached
    pub fn needs_warning(&self, current_tokens: usize) -> bool {
        let usage = self.calculate_usage(current_tokens);
        usage >= self.token_budget.warning_threshold && usage < self.token_budget.critical_threshold
    }

    /// Get threshold status
    pub fn get_threshold_status(&self, current_tokens: usize) -> ThresholdStatus {
        let usage = self.calculate_usage(current_tokens);
        if usage >= self.token_budget.critical_threshold {
            ThresholdStatus::Critical
        } else if usage >= self.token_budget.warning_threshold {
            ThresholdStatus::Warning
        } else {
            ThresholdStatus::Normal
        }
    }

    /// Estimate tokens for text (simple heuristic)
    pub fn estimate_tokens(&self, text: &str) -> usize {
        if text.is_empty() {
            return 0;
        }
        // Simple heuristic: ~4 chars per token for English, ~1.5 for Chinese
        let chinese_chars = text.chars().filter(|c| {
            let code = *c as u32;
            (0x4e00..=0x9fff).contains(&code)
        }).count();

        let chinese_tokens = chinese_chars as f64 / 1.5;
        let other_tokens = (text.len() - chinese_chars) as f64 / 4.0;

        (chinese_tokens + other_tokens).ceil() as usize
    }

    /// Calculate compression statistics from messages
    pub fn calculate_stats(&self, messages: &[MessageTokens]) -> CompressionStats {
        let mut stats = CompressionStats {
            total_messages: messages.len(),
            total_parts: 0,
            tool_calls_count: 0,
            errors_count: 0,
            user_messages_count: 0,
            assistant_messages_count: 0,
            total_tokens: 0,
        };

        for msg in messages {
            stats.total_tokens += msg.tokens;
            match msg.role.as_str() {
                "user" => stats.user_messages_count += 1,
                "assistant" => stats.assistant_messages_count += 1,
                _ => {}
            }
            if msg.has_tool_calls {
                stats.tool_calls_count += 1;
            }
            if msg.has_error {
                stats.errors_count += 1;
            }
            stats.total_parts += msg.parts_count;
        }

        stats
    }

    /// Generate summary text from messages
    pub fn generate_summary_text(&self, messages: &[MessageTokens]) -> String {
        if messages.is_empty() {
            return "Empty conversation".to_string();
        }

        let user_messages: Vec<_> = messages.iter().filter(|m| m.role == "user").collect();
        let assistant_messages: Vec<_> = messages.iter().filter(|m| m.role == "assistant").collect();

        let mut parts = Vec::new();

        parts.push(format!(
            "Conversation summary: {} user messages, {} assistant messages, {} total tokens.",
            user_messages.len(),
            assistant_messages.len(),
            self.calculate_stats(messages).total_tokens
        ));

        // Extract topics from user messages
        if !user_messages.is_empty() {
            let last_user = user_messages.last().unwrap();
            let preview = if last_user.text.len() > 100 {
                format!("{}...", &last_user.text[..100])
            } else {
                last_user.text.clone()
            };
            parts.push(format!("Last user request: {}", preview));
        }

        parts.join(" ")
    }

    /// Extract key facts from messages
    pub fn extract_key_facts(&self, messages: &[MessageTokens]) -> Vec<String> {
        let mut facts = Vec::new();

        // Extract from tool calls and results
        for msg in messages {
            if msg.has_tool_calls {
                facts.push(format!("Tool was called: {}", msg.text.lines().next().unwrap_or("")));
            }
            if msg.has_error {
                facts.push(format!("Error occurred: {}", msg.text.lines().next().unwrap_or("")));
            }
        }

        // Deduplicate and limit
        facts.dedup();
        facts.truncate(10);
        facts
    }

    /// Compress messages based on strategy
    pub fn compress(
        &self,
        messages: Vec<MessageTokens>,
        preserve_recent: usize,
    ) -> CompressedContext {
        let stats = self.calculate_stats(&messages);
        let original_tokens = stats.total_tokens;

        let (kept_messages, compressed_text) = match self.compression_strategy {
            CompressionStrategy::Summary => {
                let summary_text = self.generate_summary_text(&messages);
                let recent: Vec<_> = messages.into_iter().rev().take(preserve_recent).collect();
                (recent, summary_text)
            }
            CompressionStrategy::SlidingWindow => {
                let recent: Vec<_> = messages.into_iter().rev().take(preserve_recent).collect();
                (recent, String::new())
            }
            CompressionStrategy::Hybrid => {
                let preserve_count = preserve_recent / 2;
                let recent: Vec<_> = messages.iter().rev().take(preserve_count).cloned().collect();
                let summary = self.generate_summary_text(&messages);
                (recent, summary)
            }
        };

        let kept_tokens: usize = kept_messages.iter().map(|m| m.tokens).sum();
        let compression_ratio = if original_tokens > 0 {
            kept_tokens as f64 / original_tokens as f64
        } else {
            1.0
        };

        CompressedContext {
            kept_messages,
            summary_text: compressed_text,
            original_tokens,
            compressed_tokens: kept_tokens,
            compression_ratio,
            stats,
        }
    }

    /// Check if refresh is needed based on trigger
    pub fn should_refresh(&self, summary: &SessionSummary, trigger: &RefreshTrigger, message_count: usize) -> bool {
        match trigger {
            RefreshTrigger::MessageCount(threshold) => message_count >= *threshold,
            RefreshTrigger::ToolCompletion => summary.statistics.tool_calls_count > 0,
            RefreshTrigger::ErrorRecovery => summary.statistics.errors_count > 0,
            RefreshTrigger::Milestone => false, // External trigger
            RefreshTrigger::UserRequest => false, // External trigger
            RefreshTrigger::TimeInterval(interval_ms) => {
                let elapsed = Utc::now().timestamp_millis() - summary.updated_at;
                elapsed >= *interval_ms as i64
            }
        }
    }
}

impl Default for ContextCompressor {
    fn default() -> Self {
        Self::new()
    }
}

/// Threshold status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThresholdStatus {
    Normal,
    Warning,
    Critical,
}

/// Message with token count
#[derive(Debug, Clone)]
pub struct MessageTokens {
    pub id: String,
    pub role: String,
    pub text: String,
    pub tokens: usize,
    pub parts_count: usize,
    pub has_tool_calls: bool,
    pub has_error: bool,
}

/// Result of compression
#[derive(Debug, Clone)]
pub struct CompressedContext {
    pub kept_messages: Vec<MessageTokens>,
    pub summary_text: String,
    pub original_tokens: usize,
    pub compressed_tokens: usize,
    pub compression_ratio: f64,
    pub stats: CompressionStats,
}

/// Trait for session summary management
#[async_trait]
pub trait SessionSummaryManager: Send + Sync {
    async fn create_summary(&self, session_id: &str, messages: &[MessageTokens]) -> Result<SessionSummary>;
    async fn get_active_summary(&self, session_id: &str) -> Result<Option<SessionSummary>>;
    async fn refresh_summary(&self, session_id: &str, messages: &[MessageTokens]) -> Result<SessionSummary>;
    async fn get_compressed_context(&self, session_id: &str, preserve_recent: usize) -> Result<Option<CompressedContext>>;
}

/// Implementation of SessionSummaryManager using StorageManager
pub struct SessionSummaryService {
    storage: Arc<StorageManager>,
    compressor: ContextCompressor,
}

impl SessionSummaryService {
    pub fn new(storage: Arc<StorageManager>) -> Self {
        Self {
            storage,
            compressor: ContextCompressor::new(),
        }
    }

    pub fn with_compressor(mut self, compressor: ContextCompressor) -> Self {
        self.compressor = compressor;
        self
    }

    /// Convert messages to MessageTokens format
    pub fn messages_to_tokens(messages: &[crate::agent::AgentMessage]) -> Vec<MessageTokens> {
        messages
            .iter()
            .map(|msg| {
                let text = msg.content.clone();
                let tokens = Self::estimate_tokens(&text);
                let parts_count = 1;
                let has_tool_calls = msg.metadata
                    .as_ref()
                    .and_then(|m| m.get("tool_calls"))
                    .is_some();
                let has_error = msg.metadata
                    .as_ref()
                    .and_then(|m| m.get("error"))
                    .is_some();

                MessageTokens {
                    id: msg.metadata
                        .as_ref()
                        .and_then(|m| m.get("message_id"))
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown")
                        .to_string(),
                    role: msg.role.clone(),
                    text,
                    tokens,
                    parts_count,
                    has_tool_calls,
                    has_error,
                }
            })
            .collect()
    }

    /// Estimate tokens for text
    fn estimate_tokens(text: &str) -> usize {
        if text.is_empty() {
            return 0;
        }
        let chinese_chars = text.chars().filter(|c| {
            let code = *c as u32;
            (0x4e00..=0x9fff).contains(&code)
        }).count();

        let chinese_tokens = chinese_chars as f64 / 1.5;
        let other_tokens = (text.len() - chinese_chars) as f64 / 4.0;

        (chinese_tokens + other_tokens).ceil() as usize + 10 // overhead
    }

    /// Generate summary ID
    fn generate_summary_id() -> String {
        format!("sum_{}", uuid::Uuid::new_v4())
    }
}

#[async_trait]
impl SessionSummaryManager for SessionSummaryService {
    async fn create_summary(&self, session_id: &str, messages: &[MessageTokens]) -> Result<SessionSummary> {
        let now = Utc::now().timestamp();
        let summary_text = self.compressor.generate_summary_text(messages);
        let key_facts = self.compressor.extract_key_facts(messages);
        let stats = self.compressor.calculate_stats(messages);
        let token_count = stats.total_tokens;

        let summary = SessionSummary {
            id: Self::generate_summary_id(),
            session_id: session_id.to_string(),
            summary_text,
            key_facts,
            statistics: stats,
            token_count,
            message_count: messages.len(),
            created_at: now,
            updated_at: now,
            expires_at: None,
            is_active: true,
            version: 1,
        };

        let store = SummaryStore::new(self.storage.pool().clone());
        store.create(&summary).await?;

        Ok(summary)
    }

    async fn get_active_summary(&self, session_id: &str) -> Result<Option<SessionSummary>> {
        let store = SummaryStore::new(self.storage.pool().clone());
        store.get_active(session_id).await
    }

    async fn refresh_summary(&self, session_id: &str, messages: &[MessageTokens]) -> Result<SessionSummary> {
        let store = SummaryStore::new(self.storage.pool().clone());
        let now = Utc::now().timestamp();

        // Deactivate old summaries
        if let Some(old_summary) = store.get_active(session_id).await? {
            let mut updated = old_summary.clone();
            updated.is_active = false;
            store.update(&updated).await?;
        }

        // Create new summary
        self.create_summary(session_id, messages).await
    }

    async fn get_compressed_context(&self, session_id: &str, preserve_recent: usize) -> Result<Option<CompressedContext>> {
        let summary = self.get_active_summary(session_id).await?;

        match summary {
            Some(s) => {
                // For now, return a simplified compressed context
                // In real implementation, would need to reconstruct messages
                Ok(Some(CompressedContext {
                    kept_messages: vec![],
                    summary_text: s.summary_text,
                    original_tokens: s.token_count,
                    compressed_tokens: s.token_count,
                    compression_ratio: 1.0,
                    stats: s.statistics,
                }))
            }
            None => Ok(None),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_estimation() {
        let compressor = ContextCompressor::new();

        // English text
        let english = "Hello, this is a test message for token estimation.";
        assert!(compressor.estimate_tokens(english) > 0);

        // Chinese text
        let chinese = "你好，这是一个测试消息。";
        assert!(compressor.estimate_tokens(chinese) > 0);
    }

    #[test]
    fn test_threshold_status() {
        let compressor = ContextCompressor::new();

        assert_eq!(compressor.get_threshold_status(1000), ThresholdStatus::Normal);
        assert_eq!(compressor.get_threshold_status(6000), ThresholdStatus::Warning);
        assert_eq!(compressor.get_threshold_status(7500), ThresholdStatus::Critical);
    }

    #[test]
    fn test_needs_compression() {
        let compressor = ContextCompressor::new();

        assert!(!compressor.needs_compression(1000));
        assert!(!compressor.needs_compression(7000));
        assert!(compressor.needs_compression(8000));
    }
}
