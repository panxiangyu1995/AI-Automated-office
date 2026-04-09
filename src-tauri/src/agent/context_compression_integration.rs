//! Context Compression Integration Module
//!
//! This module integrates context compression into the runtime session flow.
//! It provides:
//! - Automatic compression triggering based on message count or token threshold
//! - Manual compression via user request
//! - Layered compression (recent messages intact, middle summarized)
//! - Entity preservation during compression
//!
//! Story 51.9 - Message Context Compression

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::agent::context_compression::{
    CompressionStrategy, CompressedContext, ContextCompressor, MessageTokens,
    SessionSummary, SessionSummaryService, SessionSummaryManager, ThresholdStatus, TokenBudget,
    CompressionStats,
};
use crate::agent::runtime_session::RuntimeSessionService;
use crate::agent::AgentError;

/// Compression trigger type
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CompressionTriggerType {
    /// Automatically triggered by message count
    MessageCount,
    /// Automatically triggered by token threshold
    TokenThreshold,
    /// Manually triggered by user
    Manual,
    /// Triggered after tool completion
    ToolCompletion,
    /// Triggered after error recovery
    ErrorRecovery,
}

/// Configuration for compression integration
#[derive(Debug, Clone)]
pub struct CompressionIntegrationConfig {
    /// Maximum messages before automatic compression
    pub message_threshold: usize,
    /// Maximum tokens before automatic compression
    pub token_threshold: usize,
    /// Number of recent messages to keep intact
    pub preserve_recent: usize,
    /// Number of middle messages to summarize
    pub summarize_middle: usize,
    /// Enable automatic compression
    pub auto_compress_enabled: bool,
    /// Enable manual compression
    pub manual_compress_enabled: bool,
}

impl Default for CompressionIntegrationConfig {
    fn default() -> Self {
        Self {
            message_threshold: 50,
            token_threshold: 32000,
            preserve_recent: 10,
            summarize_middle: 40,
            auto_compress_enabled: true,
            manual_compress_enabled: true,
        }
    }
}

/// Result of a compression operation
#[derive(Debug, Clone)]
pub struct CompressionResult {
    /// Whether compression was performed
    pub compressed: bool,
    /// Trigger type that caused compression
    pub trigger: Option<CompressionTriggerType>,
    /// Original message count
    pub original_message_count: usize,
    /// Compressed message count
    pub compressed_message_count: usize,
    /// Original token count
    pub original_tokens: usize,
    /// Compressed token count
    pub compressed_tokens: usize,
    /// Compression ratio achieved
    pub compression_ratio: f64,
    /// Summary text generated
    pub summary_text: Option<String>,
    /// Error message if compression failed
    pub error: Option<String>,
}

impl Default for CompressionResult {
    fn default() -> Self {
        Self {
            compressed: false,
            trigger: None,
            original_message_count: 0,
            compressed_message_count: 0,
            original_tokens: 0,
            compressed_tokens: 0,
            compression_ratio: 1.0,
            summary_text: None,
            error: None,
        }
    }
}

/// State of the compression integration
#[derive(Debug, Clone)]
pub struct CompressionState {
    /// Current threshold status
    pub threshold_status: ThresholdStatus,
    /// Current message count
    pub message_count: usize,
    /// Current estimated tokens
    pub estimated_tokens: usize,
    /// Whether compression is in progress
    pub is_compressing: bool,
    /// Last compression result
    pub last_result: Option<CompressionResult>,
}

impl Default for CompressionState {
    fn default() -> Self {
        Self {
            threshold_status: ThresholdStatus::Normal,
            message_count: 0,
            estimated_tokens: 0,
            is_compressing: false,
            last_result: None,
        }
    }
}

/// Context compression integration for runtime session
pub struct ContextCompressionIntegration {
    /// Configuration
    config: CompressionIntegrationConfig,
    /// Context compressor
    compressor: ContextCompressor,
    /// Summary service
    summary_service: Option<Arc<SessionSummaryService>>,
    /// Current compression state
    state: Arc<RwLock<CompressionState>>,
}

impl ContextCompressionIntegration {
    /// Create a new compression integration
    pub fn new() -> Self {
        Self {
            config: CompressionIntegrationConfig::default(),
            compressor: ContextCompressor::new(),
            summary_service: None,
            state: Arc::new(RwLock::new(CompressionState::default())),
        }
    }

    /// Create with custom config
    pub fn with_config(config: CompressionIntegrationConfig) -> Self {
        let mut compressor = ContextCompressor::new();
        compressor = compressor.with_budget(TokenBudget {
            max_tokens: config.token_threshold,
            warning_threshold: 0.7,
            critical_threshold: 0.9,
            compression_ratio: 0.5,
        });

        Self {
            config,
            compressor,
            summary_service: None,
            state: Arc::new(RwLock::new(CompressionState::default())),
        }
    }

    /// Set the summary service
    pub fn with_summary_service(mut self, service: Arc<SessionSummaryService>) -> Self {
        self.summary_service = Some(service);
        self
    }

    /// Get current compression state
    pub async fn get_state(&self) -> CompressionState {
        self.state.read().await.clone()
    }

    /// Update state with message count and tokens
    pub async fn update_state(&self, message_count: usize, estimated_tokens: usize) {
        let mut state = self.state.write().await;
        state.message_count = message_count;
        state.estimated_tokens = estimated_tokens;
        state.threshold_status = self.compressor.get_threshold_status(estimated_tokens);
    }

    /// Check if compression should be triggered automatically
    pub async fn should_auto_compress(&self) -> Option<CompressionTriggerType> {
        let state = self.state.read().await;

        if !self.config.auto_compress_enabled {
            return None;
        }

        // Check message count threshold
        if state.message_count >= self.config.message_threshold {
            return Some(CompressionTriggerType::MessageCount);
        }

        // Check token threshold
        if self.compressor.needs_compression(state.estimated_tokens) {
            return Some(CompressionTriggerType::TokenThreshold);
        }

        None
    }

    /// Check if manual compression is enabled
    pub fn is_manual_compress_enabled(&self) -> bool {
        self.config.manual_compress_enabled
    }

    /// Execute compression on messages
    pub async fn compress(
        &self,
        session_id: &str,
        messages: Vec<MessageTokens>,
        trigger: CompressionTriggerType,
    ) -> CompressionResult {
        // Set compressing state
        {
            let mut state = self.state.write().await;
            state.is_compressing = true;
        }

        let result = self.do_compress(session_id, messages, trigger).await;

        // Clear compressing state
        {
            let mut state = self.state.write().await;
            state.is_compressing = false;
            state.last_result = Some(result.clone());
        }

        result
    }

    /// Internal compression logic
    async fn do_compress(
        &self,
        session_id: &str,
        messages: Vec<MessageTokens>,
        trigger: CompressionTriggerType,
    ) -> CompressionResult {
        let original_count = messages.len();
        let original_tokens: usize = messages.iter().map(|m| m.tokens).sum();

        // Use hybrid strategy: keep recent + summarize middle
        let compressed = self.compressor.compress(
            messages.clone(),
            self.config.preserve_recent,
        );

        let summary_text = Some(compressed.summary_text.clone());

        // If we have a summary service, persist the summary
        if let Some(service) = &self.summary_service {
            let _ = service.refresh_summary(session_id, &messages).await;
        }

        CompressionResult {
            compressed: true,
            trigger: Some(trigger),
            original_message_count: original_count,
            compressed_message_count: compressed.kept_messages.len(),
            original_tokens,
            compressed_tokens: compressed.compressed_tokens,
            compression_ratio: compressed.compression_ratio,
            summary_text,
            error: None,
        }
    }

    /// Get compressed context for LLM input
    pub async fn get_compressed_context(
        &self,
        session_id: &str,
        messages: &[MessageTokens],
    ) -> Result<CompressedContext, AgentError> {
        // Check if we have an active summary
        if let Some(service) = &self.summary_service {
            if let Ok(Some(context)) = service.get_compressed_context(
                session_id,
                self.config.preserve_recent,
            ).await {
                return Ok(context);
            }
        }

        // No summary, return messages as-is
        Ok(CompressedContext {
            kept_messages: messages.to_vec(),
            summary_text: String::new(),
            original_tokens: messages.iter().map(|m| m.tokens).sum(),
            compressed_tokens: messages.iter().map(|m| m.tokens).sum(),
            compression_ratio: 1.0,
            stats: self.compressor.calculate_stats(messages),
        })
    }

    /// Get threshold status
    pub async fn get_threshold_status(&self) -> ThresholdStatus {
        let state = self.state.read().await;
        state.threshold_status.clone()
    }

    /// Get threshold status as percentage
    pub async fn get_threshold_percentage(&self) -> f64 {
        let state = self.state.read().await;
        if self.config.token_threshold == 0 {
            return 0.0;
        }
        state.estimated_tokens as f64 / self.config.token_threshold as f64 * 100.0
    }

    /// Get compression statistics
    pub async fn get_stats(&self) -> CompressionStats {
        let state = self.state.read().await;
        CompressionStats {
            total_messages: state.message_count,
            total_parts: state.message_count,
            tool_calls_count: 0,
            errors_count: 0,
            user_messages_count: state.message_count / 2,
            assistant_messages_count: state.message_count / 2,
            total_tokens: state.estimated_tokens,
        }
    }
}

impl Default for ContextCompressionIntegration {
    fn default() -> Self {
        Self::new()
    }
}

/// Compressed message for LLM input
#[derive(Debug, Clone)]
pub struct LlmInputMessage {
    /// Message role
    pub role: String,
    /// Message content
    pub content: String,
}

impl From<MessageTokens> for LlmInputMessage {
    fn from(msg: MessageTokens) -> Self {
        Self {
            role: msg.role,
            content: msg.text,
        }
    }
}

/// Build LLM input from compressed context
pub fn build_llm_input(
    compressed: &CompressedContext,
    summary_marker: Option<&str>,
) -> Vec<LlmInputMessage> {
    let mut messages = Vec::new();

    // Add summary marker if present
    if !compressed.summary_text.is_empty() {
        let marker = summary_marker.unwrap_or("[[COMPRESSED CONTEXT SUMMARY]]");
        messages.push(LlmInputMessage {
            role: "system".to_string(),
            content: format!("{}\n\n{}", marker, compressed.summary_text),
        });
    }

    // Add kept messages
    for msg in &compressed.kept_messages {
        messages.push(msg.clone().into());
    }

    messages
}

/// Key entities to preserve during compression
pub struct EntityPreservation {
    /// Person names
    pub persons: Vec<String>,
    /// Dates and times
    pub dates: Vec<String>,
    /// Amounts (money, quantities)
    pub amounts: Vec<String>,
    /// Technical terms
    pub technical_terms: Vec<String>,
    /// Custom entities
    pub custom: Vec<String>,
}

impl Default for EntityPreservation {
    fn default() -> Self {
        Self {
            persons: Vec::new(),
            dates: Vec::new(),
            amounts: Vec::new(),
            technical_terms: Vec::new(),
            custom: Vec::new(),
        }
    }
}

/// Extract key entities from messages for preservation
pub fn extract_entities(messages: &[MessageTokens]) -> EntityPreservation {
    let mut preservation = EntityPreservation::default();

    for msg in messages {
        // Simple pattern matching for common entities
        // In production, would use NER or LLM-based extraction
        
        // Dates (simplified pattern)
        for date_pattern in ["2024-", "2025-", "2026-", "今天", "明天", "昨天", "本周", "本月"] {
            if msg.text.contains(date_pattern) {
                preservation.dates.push(date_pattern.to_string());
            }
        }

        // Money amounts (simplified pattern)
        for amount_pattern in ["¥", "$", "元", "美元", "人民币", "金额", "价格"] {
            if msg.text.contains(amount_pattern) {
                preservation.amounts.push(amount_pattern.to_string());
            }
        }
    }

    // Deduplicate
    preservation.dates.dedup();
    preservation.amounts.dedup();

    // Limit to prevent explosion
    preservation.dates.truncate(20);
    preservation.amounts.truncate(20);

    preservation
}

/// Format entities as preservation instructions
pub fn format_entity_instructions(entities: &EntityPreservation) -> String {
    let mut instructions = Vec::new();

    if !entities.persons.is_empty() {
        instructions.push(format!(
            "Important persons: {}",
            entities.persons.join(", ")
        ));
    }

    if !entities.dates.is_empty() {
        instructions.push(format!(
            "Important dates: {}",
            entities.dates.join(", ")
        ));
    }

    if !entities.amounts.is_empty() {
        instructions.push(format!(
            "Important amounts: {}",
            entities.amounts.join(", ")
        ));
    }

    if !entities.technical_terms.is_empty() {
        instructions.push(format!(
            "Technical terms: {}",
            entities.technical_terms.join(", ")
        ));
    }

    if instructions.is_empty() {
        String::new()
    } else {
        format!(
            "\n\n[PRESERVED ENTITIES]\n{}\n[/PRESERVED ENTITIES]",
            instructions.join("\n")
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_auto_compress_trigger() {
        let integration = ContextCompressionIntegration::new();
        
        // Update state with high message count
        integration.update_state(60, 10000).await;
        
        let should_compress = integration.should_auto_compress().await;
        assert_eq!(should_compress, Some(CompressionTriggerType::MessageCount));
    }

    #[tokio::test]
    async fn test_token_threshold_trigger() {
        let integration = ContextCompressionIntegration::new();
        
        // Update state with high token count (over critical threshold)
        integration.update_state(30, 35000).await;
        
        let should_compress = integration.should_auto_compress().await;
        assert_eq!(should_compress, Some(CompressionTriggerType::TokenThreshold));
    }

    #[test]
    fn test_build_llm_input() {
        let compressed = CompressedContext {
            kept_messages: vec![
                MessageTokens {
                    id: "1".to_string(),
                    role: "user".to_string(),
                    text: "Hello".to_string(),
                    tokens: 5,
                    parts_count: 1,
                    has_tool_calls: false,
                    has_error: false,
                },
            ],
            summary_text: "Previous conversation summary".to_string(),
            original_tokens: 100,
            compressed_tokens: 50,
            compression_ratio: 0.5,
            stats: CompressionStats {
                total_messages: 10,
                total_parts: 10,
                tool_calls_count: 2,
                errors_count: 0,
                user_messages_count: 5,
                assistant_messages_count: 5,
                total_tokens: 100,
            },
        };

        let input = build_llm_input(&compressed, Some("[[SUMMARY]]"));
        assert_eq!(input.len(), 2);
        assert_eq!(input[0].role, "system");
        assert!(input[0].content.contains("Previous conversation summary"));
    }

    #[test]
    fn test_entity_extraction() {
        let messages = vec![
            MessageTokens {
                id: "1".to_string(),
                role: "user".to_string(),
                text: "明天2024-01-15有个会议，需要准备1000元的资料".to_string(),
                tokens: 50,
                parts_count: 1,
                has_tool_calls: false,
                has_error: false,
            },
        ];

        let entities = extract_entities(&messages);
        assert!(entities.dates.contains(&"2024-".to_string()));
        assert!(entities.amounts.contains(&"元".to_string()));
    }
}
