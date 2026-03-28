//! RAG context builder implementation.

use std::sync::Arc;
use std::time::Instant;

use crate::vector::embedding::EmbeddingService;

use super::super::types::*;

/// RAG context builder for constructing retrieval prompts
pub struct RagContextBuilder {
    config: RagRetrievalConfig,
    embedding_service: Arc<EmbeddingService>,
}

impl RagContextBuilder {
    /// Create a new context builder
    pub fn new(embedding_service: Arc<EmbeddingService>) -> Self {
        Self {
            config: RagRetrievalConfig::default(),
            embedding_service,
        }
    }

    /// Create with custom config
    pub fn with_config(mut self, config: RagRetrievalConfig) -> Self {
        self.config = config;
        self
    }

    /// Build context from retrieved chunks
    pub async fn build_context(
        &self,
        query: &str,
        chunks: Vec<RetrievedChunk>,
    ) -> Result<RagContext, ContextError> {
        if chunks.is_empty() {
            return Err(ContextError::NoChunks);
        }

        let start_time = Instant::now();

        // Sort by relevance score
        let mut sorted_chunks = chunks;
        sorted_chunks.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));

        // Take top chunks based on config
        let top_chunks: Vec<RetrievedChunk> = sorted_chunks
            .into_iter()
            .take(self.config.max_chunks)
            .collect();

        // Calculate total tokens
        let total_tokens = top_chunks.iter().map(|c| {
            // Estimate tokens from content (roughly 4 chars per token)
            c.content.chars().count() / 4
        }).sum();

        let retrieval_time_ms = start_time.elapsed().as_millis() as u64;

        Ok(RagContext {
            query: query.to_string(),
            chunks: top_chunks,
            total_tokens,
            retrieval_time_ms,
        })
    }

    /// Build system prompt with context
    pub fn build_system_prompt(&self, context: &RagContext) -> String {
        let context_parts: Vec<String> = context.chunks
            .iter()
            .enumerate()
            .map(|(i, chunk)| {
                format!(
                    "[文档{}]\n{}\n[/文档{}]",
                    i + 1,
                    chunk.content,
                    i + 1
                )
            })
            .collect();

        let context_string = context_parts.join("\n\n");

        format!(
            "你是一个专业的AI助手。请根据以下上下文信息回答用户的问题。\n\n\
             【上下文信息】\n{}\n\n\
             【回答要求】\n\
             1. 基于提供的上下文信息进行回答\n\
             2. 如果上下文中没有相关信息，请明确说明\n\
             3. 引用相关文档来源时请注明文档编号",
            context_string
        )
    }

    /// Check if context exceeds token limit
    pub fn exceeds_token_limit(&self, context: &RagContext) -> bool {
        context.total_tokens > self.config.max_tokens
    }

    /// Compress context if needed
    pub async fn compress_context(
        &self,
        context: &RagContext,
    ) -> Result<RagContext, ContextError> {
        if !self.exceeds_token_limit(context) {
            return Ok(context.clone());
        }

        let target_tokens = (self.config.max_tokens as f32 * 0.8) as usize;
        let mut current_tokens = 0;
        let mut compressed_chunks = Vec::new();

        for chunk in &context.chunks {
            let chunk_tokens = chunk.content.chars().count() / 4;
            if current_tokens + chunk_tokens <= target_tokens {
                compressed_chunks.push(chunk.clone());
                current_tokens += chunk_tokens;
            } else {
                break;
            }
        }

        Ok(RagContext {
            query: context.query.clone(),
            chunks: compressed_chunks,
            total_tokens: current_tokens,
            retrieval_time_ms: context.retrieval_time_ms,
        })
    }
}

/// Context error types
#[derive(Debug, thiserror::Error)]
pub enum ContextError {
    #[error("No chunks provided")]
    NoChunks,

    #[error("Context too large: {0} tokens")]
    ContextTooLarge(usize),

    #[error("Build failed: {0}")]
    BuildFailed(String),
}
