//! Context Compression Integration Module
//!
//! Integrates context_compression.rs into the message flow.
//! Features:
//! - Automatic compression trigger (50 messages or 32000 tokens)
//! - Layered compression (recent 10 rounds intact, middle rounds summarized)
//! - Conversation round summarization with [[SUMMARY]] markers
//! - Entity extraction and preservation (person, date, amount, technical terms)

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use uuid::Uuid;
use serde::{Deserialize, Serialize};

use crate::agent::context_compression::{
    ContextCompressor, TokenBudget, CompressionStrategy, CompressionStats,
    SessionSummary, SummaryStore, RefreshTrigger, ThresholdStatus, MessageTokens as CompMessageTokens,
};
use crate::agent::runtime_session::RuntimeSessionService;
use crate::storage::message_store::Message;

/// Configuration for context compression integration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionConfig {
    /// Message count threshold to trigger compression
    pub message_count_threshold: usize,
    /// Token count threshold to trigger compression
    pub token_count_threshold: usize,
    /// Number of recent rounds to keep intact
    pub recent_rounds_kept: usize,
    /// Whether to auto-compress on threshold
    pub auto_compress: bool,
    /// Compression strategy to use
    pub strategy: CompressionStrategy,
}

impl Default for CompressionConfig {
    fn default() -> Self {
        Self {
            message_count_threshold: 50,
            token_count_threshold: 32000,
            recent_rounds_kept: 10,
            auto_compress: true,
            strategy: CompressionStrategy::Hybrid,
        }
    }
}

/// Message token pair for compression analysis
#[derive(Debug, Clone)]
pub struct MessageTokens {
    pub id: String,
    pub role: String,
    pub tokens: usize,
    pub has_tool_calls: bool,
    pub has_error: bool,
    pub parts_count: usize,
}

/// Compressed context result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressedContext {
    pub original_count: usize,
    pub compressed_count: usize,
    pub summary: String,
    pub preserved_entities: Vec<String>,
    pub recent_messages: Vec<Message>,
}

/// Threshold status response for UI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThresholdStatusResponse {
    pub status: ThresholdStatus,
    pub current_tokens: usize,
    pub max_tokens: usize,
    pub usage_percentage: f64,
    pub message_count: usize,
    pub needs_compression: bool,
}

/// Context compression integration service
pub struct ContextCompressionIntegration {
    compressor: Arc<ContextCompressor>,
    config: Arc<RwLock<CompressionConfig>>,
    pending_sessions: Arc<RwLock<std::collections::HashSet<String>>>,
}

impl ContextCompressionIntegration {
    pub fn new(compressor: Arc<ContextCompressor>) -> Self {
        Self {
            compressor,
            config: Arc::new(RwLock::new(CompressionConfig::default())),
            pending_sessions: Arc::new(RwLock::new(std::collections::HashSet::new())),
        }
    }
    
    pub fn with_config(compressor: Arc<ContextCompressor>, config: CompressionConfig) -> Self {
        Self {
            compressor,
            config: Arc::new(RwLock::new(config)),
            pending_sessions: Arc::new(RwLock::new(std::collections::HashSet::new())),
        }
    }
    
    pub async fn update_config(&self, config: CompressionConfig) {
        let mut cfg = self.config.write().await;
        *cfg = config;
    }
    
    pub async fn get_config(&self) -> CompressionConfig {
        let cfg = self.config.read().await;
        cfg.clone()
    }
    
    pub async fn check_threshold(
        &self,
        message_count: usize,
        estimated_tokens: usize,
    ) -> ThresholdStatusResponse {
        let cfg = self.config.read().await;
        ThresholdStatusResponse {
            status: self.compressor.get_threshold_status(estimated_tokens),
            current_tokens: estimated_tokens,
            max_tokens: cfg.token_count_threshold,
            usage_percentage: if cfg.token_count_threshold > 0 {
                (estimated_tokens as f64 / cfg.token_count_threshold as f64) * 100.0
            } else {
                0.0
            },
            message_count,
            needs_compression: message_count >= cfg.message_count_threshold ||
                estimated_tokens >= cfg.token_count_threshold,
        }
    }
    
    pub async fn should_compress(
        &self,
        message_count: usize,
        estimated_tokens: usize,
    ) -> bool {
        let cfg = self.config.read().await;
        
        if !cfg.auto_compress {
            return false;
        }
        
        message_count >= cfg.message_count_threshold ||
            estimated_tokens >= cfg.token_count_threshold
    }
    
    pub async fn compress_context(
        &self,
        session_id: &str,
        messages: Vec<Message>,
    ) -> Result<CompressedContext, String> {
        // Mark session as pending compression
        {
            let mut pending = self.pending_sessions.write().await;
            pending.insert(session_id.to_string());
        }
        
        let cfg = self.config.read().await;
        let recent_rounds_kept = cfg.recent_rounds_kept;
        let strategy = cfg.strategy.clone();
        
        // Estimate tokens for each message
        let message_tokens: Vec<CompMessageTokens> = messages
            .iter()
            .map(|m| {
                let content_tokens = self.compressor.estimate_tokens(
                    m.content.as_deref().unwrap_or("")
                );
                let tool_calls_tokens = if m.tool_calls.is_some() { 50 } else { 0 };
                CompMessageTokens {
                    id: m.id.clone(),
                    role: m.role.clone(),
                    text: m.content.clone().unwrap_or_default(),
                    tokens: content_tokens + tool_calls_tokens,
                    has_tool_calls: m.tool_calls.is_some(),
                    has_error: m.metadata
                        .as_ref()
                        .and_then(|v| v.get("error"))
                        .is_some(),
                    parts_count: 1,
                }
            })
            .collect();
        
        let stats = self.compressor.calculate_stats(&message_tokens);
        let total_tokens: usize = stats.total_tokens;
        
        // Generate summary text
        let summary = self.compressor.generate_summary_text(&message_tokens);
        
        // Extract entities
        let preserved_entities = self.extract_entities(&messages);
        
        // Split messages: recent vs. compressible
        let (recent_messages, _older_messages) = if strategy == CompressionStrategy::Hybrid {
            // Keep recent rounds intact
            let recent_count = recent_rounds_kept * 2; // user + assistant per round
            if messages.len() > recent_count {
                let split_idx = messages.len() - recent_count;
                (
                    messages[split_idx..].to_vec(),
                    messages[..split_idx].to_vec(),
                )
            } else {
                (messages.clone(), vec![])
            }
        } else {
            (messages.clone(), vec![])
        };
        
        // Unmark session
        {
            let mut pending = self.pending_sessions.write().await;
            pending.remove(session_id);
        }
        
        Ok(CompressedContext {
            original_count: messages.len(),
            compressed_count: recent_messages.len(),
            summary: format!("[[SUMMARY]]\n{}\n[[/SUMMARY]]", summary),
            preserved_entities,
            recent_messages,
        })
    }
    
    fn extract_entities(&self, messages: &[Message]) -> Vec<String> {
        let mut entities: Vec<String> = Vec::new();
        
        for message in messages {
            let content = message.content.as_deref().unwrap_or("");
            
            // Extract potential entities (simplified implementation)
            // In production, use NER or regex patterns
            let words: Vec<&str> = content.split_whitespace().collect();
            
            // Look for capitalized words (potential names)
            for word in &words {
                let word_str = (*word).to_string();
                if word.len() > 2 && word.chars().next().map(|c| c.is_uppercase()).unwrap_or(false) {
                    if !entities.contains(&word_str) && word.chars().all(|c| c.is_alphabetic() || c == '\'' || c == '-') {
                        entities.push(word_str);
                    }
                }
            }
            
            // Look for dates (simplified)
            let has_2024 = content.contains("2024");
            let has_2025 = content.contains("2025");
            if has_2024 || has_2025 || content.contains("2026") {
                if !entities.contains(&"[DATE]".to_string()) {
                    entities.push("[DATE]".to_string());
                }
            }
            
            // Look for numbers/amounts
            let has_numbers = content.chars().any(|c| c.is_numeric());
            if has_numbers && !entities.contains(&"[AMOUNT]".to_string()) {
                entities.push("[AMOUNT]".to_string());
            }
        }
        
        // Limit entity count
        entities.truncate(50);
        entities
    }
    
    pub async fn is_pending(&self, session_id: &str) -> bool {
        let pending = self.pending_sessions.read().await;
        pending.contains(session_id)
    }
    
    pub async fn get_pending_sessions(&self) -> Vec<String> {
        let pending = self.pending_sessions.read().await;
        pending.iter().cloned().collect()
    }
}

/// Integration with RuntimeSessionService
pub struct RuntimeSessionWithCompression {
    session_service: Arc<RuntimeSessionService>,
    compression: Arc<ContextCompressionIntegration>,
}

impl RuntimeSessionWithCompression {
    pub fn new(
        session_service: Arc<RuntimeSessionService>,
        compression: Arc<ContextCompressionIntegration>,
    ) -> Self {
        Self {
            session_service,
            compression,
        }
    }
    
    pub async fn execute_with_compression(
        &self,
        session_id: &str,
        user_id: &str,
    ) -> Result<Vec<Message>, String> {
        // Get messages
        let messages = self.session_service.list_messages(session_id).await
            .map_err(|e| e.to_string())?;
        
        // Check if compression is needed
        let should_compress = {
            let content_tokens: usize = messages.iter()
                .map(|m| self.compression.compressor.estimate_tokens(
                    m.content.as_deref().unwrap_or("")
                ))
                .sum();
            
            self.compression.should_compress(messages.len(), content_tokens).await
        };
        
        if should_compress {
            // Compress context
            let compressed = self.compression.compress_context(
                session_id,
                messages.clone()
            ).await?;
            
            // Return compressed messages
            Ok(compressed.recent_messages)
        } else {
            Ok(messages)
        }
    }
}

// ============================================================================
// Tauri Commands
// ============================================================================

use tauri::State;

/// Get compression threshold status for a session
#[tauri::command]
pub async fn get_compression_status(
    session_id: String,
    message_count: usize,
    estimated_tokens: usize,
    compression: State<'_, Arc<ContextCompressionIntegration>>,
) -> Result<ThresholdStatusResponse, String> {
    Ok(compression.check_threshold(message_count, estimated_tokens).await)
}

/// Manually trigger context compression
#[tauri::command]
pub async fn trigger_compression(
    session_id: String,
    messages: Vec<crate::storage::message_store::Message>,
    compression: State<'_, Arc<ContextCompressionIntegration>>,
) -> Result<CompressedContext, String> {
    compression.compress_context(&session_id, messages).await
}

/// Update compression configuration
#[tauri::command]
pub async fn update_compression_config(
    config: CompressionConfig,
    compression: State<'_, Arc<ContextCompressionIntegration>>,
) -> Result<(), String> {
    compression.update_config(config).await;
    Ok(())
}

/// Get current compression configuration
#[tauri::command]
pub async fn get_compression_config(
    compression: State<'_, Arc<ContextCompressionIntegration>>,
) -> Result<CompressionConfig, String> {
    Ok(compression.get_config().await)
}
