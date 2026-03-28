//! Incremental indexing implementation.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::vector::embedding::EmbeddingService;
use crate::vector::store::{VectorStore, VectorItem};

use super::super::types::*;
use super::super::chunker::Chunk;

/// Incremental indexer for real-time updates
pub struct IncrementalIndexer {
    embedding_service: Arc<EmbeddingService>,
    vector_store: Arc<dyn VectorStore>,
    pending_updates: Arc<RwLock<HashMap<String, Vec<Chunk>>>>,
    config: IncrementalIndexConfig,
}

impl IncrementalIndexer {
    /// Create a new incremental indexer
    pub fn new(
        embedding_service: EmbeddingService,
        vector_store: Arc<dyn VectorStore>,
    ) -> Self {
        Self {
            embedding_service: Arc::new(embedding_service),
            vector_store,
            pending_updates: Arc::new(RwLock::new(HashMap::new())),
            config: IncrementalIndexConfig::default(),
        }
    }

    /// Create with custom config
    pub fn with_config(mut self, config: IncrementalIndexConfig) -> Self {
        self.config = config;
        self
    }

    /// Add a document for incremental indexing
    pub async fn add_document(
        &self,
        document_id: &str,
        chunks: Vec<Chunk>,
    ) -> Result<(), IndexError> {
        let mut pending = self.pending_updates.write().await;

        // Add chunks to pending updates
        let entry = pending.entry(document_id.to_string()).or_insert_with(Vec::new);
        entry.extend(chunks);

        // Check if we should flush based on threshold
        if entry.len() >= self.config.batch_size as usize {
            drop(pending);
            self.flush_document(document_id).await?;
        }

        Ok(())
    }

    /// Update existing chunks (re-indexes all chunks for a document)
    pub async fn update_chunks(
        &self,
        document_id: &str,
        chunks: Vec<Chunk>,
    ) -> Result<(), IndexError> {
        // Simply add and flush - VectorStore update is not available
        // In production, you would need to delete old chunks first
        self.add_document(document_id, chunks).await
    }

    /// Delete document from index
    pub async fn delete_document(&self, document_id: &str) -> Result<(), IndexError> {
        // Remove from pending updates
        let mut pending = self.pending_updates.write().await;
        pending.remove(document_id);
        // Note: In production, you would need to track chunk IDs to delete them
        Ok(())
    }

    /// Flush pending updates for a document
    pub async fn flush_document(&self, document_id: &str) -> Result<usize, IndexError> {
        let chunks = {
            let mut pending = self.pending_updates.write().await;
            pending.remove(document_id).unwrap_or_default()
        };

        if chunks.is_empty() {
            return Ok(0);
        }

        // Generate embeddings and create vector items
        let items = self.generate_vector_items(&chunks).await?;

        // Batch insert to vector store
        self.vector_store
            .insert_batch(items)
            .await
            .map_err(|e| IndexError::VectorStoreError(e.to_string()))?;

        Ok(chunks.len())
    }

    /// Flush all pending updates
    pub async fn flush_all(&self) -> Result<usize, IndexError> {
        let documents = {
            let mut pending = self.pending_updates.write().await;
            pending.keys().cloned().collect::<Vec<_>>()
        };

        let mut total_chunks = 0;
        for doc_id in documents {
            total_chunks += self.flush_document(&doc_id).await?;
        }

        Ok(total_chunks)
    }

    /// Get pending update count
    pub async fn pending_count(&self) -> usize {
        let pending = self.pending_updates.read().await;
        pending.values().map(|v| v.len()).sum()
    }

    /// Generate vector items for chunks
    async fn generate_vector_items(
        &self,
        chunks: &[Chunk],
    ) -> Result<Vec<VectorItem>, IndexError> {
        let mut results = Vec::with_capacity(chunks.len());

        for chunk in chunks {
            let embedding = self.embedding_service
                .embed_text(&chunk.content)
                .await
                .map_err(|e| IndexError::EmbeddingError(e.to_string()))?;

            let metadata = serde_json::json!({
                "document_id": chunk.chunk_id.split('_').next().unwrap_or("doc"),
                "content": chunk.content,
                "heading": chunk.heading,
                "page_number": chunk.page_number,
                "section": chunk.section,
            });

            results.push(VectorItem {
                id: chunk.chunk_id.clone(),
                vector: embedding,
                content: Some(chunk.content.clone()),
                metadata,
            });
        }

        Ok(results)
    }
}

/// Incremental index configuration
#[derive(Debug, Clone)]
pub struct IncrementalIndexConfig {
    pub batch_size: u32,
    pub flush_interval_secs: u64,
    pub max_pending_documents: u32,
}

impl Default for IncrementalIndexConfig {
    fn default() -> Self {
        Self {
            batch_size: 100,
            flush_interval_secs: 60,
            max_pending_documents: 1000,
        }
    }
}

/// Index error types
#[derive(Debug, thiserror::Error)]
pub enum IndexError {
    #[error("Embedding error: {0}")]
    EmbeddingError(String),

    #[error("Vector store error: {0}")]
    VectorStoreError(String),

    #[error("Flush error: {0}")]
    FlushError(String),

    #[error("Document not found: {0}")]
    DocumentNotFound(String),
}
