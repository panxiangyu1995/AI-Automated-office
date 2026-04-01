//! Context Compression Integration Tests
//!
//! Tests for the context compression integration with message flow.

use crate::agent::context_compression::{
    ContextCompressor, TokenBudget, CompressionStrategy, CompressionStats,
    SessionSummary, ThresholdStatus,
};
use crate::agent::context_compression_integration::{
    ContextCompressionIntegration, CompressionConfig, CompressedContext,
    MessageTokens, ThresholdStatusResponse,
};
use crate::storage::message_store::Message;

#[cfg(test)]
mod compression_config_tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = CompressionConfig::default();
        
        assert_eq!(config.message_count_threshold, 50);
        assert_eq!(config.token_count_threshold, 32000);
        assert_eq!(config.recent_rounds_kept, 10);
        assert!(config.auto_compress);
        assert_eq!(config.strategy, CompressionStrategy::Hybrid);
    }

    #[test]
    fn test_custom_config() {
        let config = CompressionConfig {
            message_count_threshold: 100,
            token_count_threshold: 64000,
            recent_rounds_kept: 20,
            auto_compress: false,
            strategy: CompressionStrategy::Summary,
        };
        
        assert_eq!(config.message_count_threshold, 100);
        assert_eq!(config.token_count_threshold, 64000);
        assert_eq!(config.recent_rounds_kept, 20);
        assert!(!config.auto_compress);
        assert_eq!(config.strategy, CompressionStrategy::Summary);
    }
}

#[cfg(test)]
mod compression_integration_tests {
    use super::*;

    fn create_test_messages(count: usize) -> Vec<Message> {
        (0..count)
            .map(|i| Message {
                id: format!("msg-{}", i),
                session_id: "test-session".to_string(),
                role: if i % 2 == 0 { "user".to_string() } else { "assistant".to_string() },
                content: Some(format!("This is test message number {}.", i)),
                tool_calls: None,
                tool_call_id: None,
                metadata: None,
                created_at: i as i64,
            })
            .collect()
    }

    #[test]
    fn test_compressor_creation() {
        let compressor = ContextCompressor::new();
        let result = compressor.calculate_usage(4000);
        
        // With default 8000 max tokens, 4000 should be 50%
        assert!((result - 0.5).abs() < 0.01);
    }

    #[test]
    fn test_token_estimation() {
        let compressor = ContextCompressor::new();
        
        // Empty string
        assert_eq!(compressor.estimate_tokens(""), 0);
        
        // Short English text
        let tokens = compressor.estimate_tokens("Hello world");
        assert!(tokens > 0);
    }

    #[test]
    fn test_needs_compression() {
        let compressor = ContextCompressor::new();
        
        // Below threshold
        assert!(!compressor.needs_compression(4000));
        
        // Above threshold (90% of 8000)
        assert!(compressor.needs_compression(8000));
    }

    #[test]
    fn test_threshold_status() {
        let compressor = ContextCompressor::new();
        
        // Normal (below warning)
        assert_eq!(
            compressor.get_threshold_status(3000),
            ThresholdStatus::Normal
        );
        
        // Warning (70-90%)
        assert_eq!(
            compressor.get_threshold_status(6000),
            ThresholdStatus::Warning
        );
        
        // Critical (above 90%)
        assert_eq!(
            compressor.get_threshold_status(8000),
            ThresholdStatus::Critical
        );
    }

    #[test]
    fn test_message_tokens_calculation() {
        let compressor = ContextCompressor::new();
        
        let messages = vec![
            MessageTokens {
                id: "1".to_string(),
                role: "user".to_string(),
                tokens: 100,
                has_tool_calls: false,
                has_error: false,
                parts_count: 1,
            },
            MessageTokens {
                id: "2".to_string(),
                role: "assistant".to_string(),
                tokens: 200,
                has_tool_calls: false,
                has_error: false,
                parts_count: 1,
            },
        ];
        
        let stats = compressor.calculate_stats(&messages);
        
        assert_eq!(stats.total_messages, 2);
        assert_eq!(stats.total_tokens, 300);
        assert_eq!(stats.user_messages_count, 1);
        assert_eq!(stats.assistant_messages_count, 1);
    }

    #[test]
    fn test_summary_generation() {
        let compressor = ContextCompressor::new();
        
        let messages = vec![
            MessageTokens {
                id: "1".to_string(),
                role: "user".to_string(),
                tokens: 100,
                has_tool_calls: false,
                has_error: false,
                parts_count: 1,
            },
        ];
        
        let summary = compressor.generate_summary_text(&messages);
        
        assert!(!summary.is_empty());
        assert!(summary.contains("1 message"));
    }

    #[test]
    fn test_integration_threshold_check() {
        let compressor = ContextCompressor::new();
        let integration = ContextCompressionIntegration::new(Arc::new(compressor));
        
        let response = integration.check_threshold(100, 8000);
        
        assert_eq!(response.status, ThresholdStatus::Critical);
        assert!(response.needs_compression);
    }

    #[test]
    fn test_integration_auto_compress_disabled() {
        let compressor = ContextCompressor::new();
        let mut config = CompressionConfig::default();
        config.auto_compress = false;
        let integration = ContextCompressionIntegration::with_config(
            Arc::new(compressor),
            config
        );
        
        let should_compress = integration.should_compress(100, 50000);
        
        assert!(!should_compress);
    }

    #[test]
    fn test_entity_extraction() {
        let compressor = ContextCompressor::new();
        let integration = ContextCompressionIntegration::new(Arc::new(compressor));
        
        let messages = vec![
            Message {
                id: "1".to_string(),
                session_id: "test".to_string(),
                role: "user".to_string(),
                content: Some("Hello John, please help with the project.".to_string()),
                tool_calls: None,
                tool_call_id: None,
                metadata: None,
                created_at: 0,
            },
        ];
        
        let result = integration.compress_context("session-1", messages);
        
        assert!(result.is_ok());
        let compressed = result.unwrap();
        
        // Should extract "John" as entity
        assert!(!compressed.preserved_entities.is_empty());
    }

    #[test]
    fn test_is_pending() {
        let compressor = ContextCompressor::new();
        let integration = ContextCompressionIntegration::new(Arc::new(compressor));
        
        let is_pending = integration.is_pending("session-1");
        
        assert!(!is_pending);
    }

    #[test]
    fn test_get_pending_sessions() {
        let compressor = ContextCompressor::new();
        let integration = ContextCompressionIntegration::new(Arc::new(compressor));
        
        let pending = integration.get_pending_sessions();
        
        assert!(pending.is_empty());
    }
}
