//! Document processing pipeline implementation.

use std::collections::HashMap;
use std::sync::Arc;

use tokio::sync::RwLock;
use chrono::Utc;

use crate::vector::embedding::EmbeddingService;
use crate::vector::store::VectorStore;

use super::super::types::*;
use super::super::parser::ParserRegistry;
use super::super::chunker::DocumentChunker;

/// Document processing pipeline
pub struct DocumentPipeline {
    parser_registry: ParserRegistry,
    chunker: DocumentChunker,
    embedding_service: Arc<EmbeddingService>,
    vector_store: Option<Arc<dyn VectorStore>>,
    tasks: Arc<RwLock<HashMap<String, ProcessingTask>>>,
    config: PipelineConfig,
}

impl DocumentPipeline {
    /// Create a new pipeline
    pub fn new(embedding_service: Arc<EmbeddingService>) -> Self {
        Self {
            parser_registry: ParserRegistry::new(),
            chunker: DocumentChunker::new(ChunkingStrategyConfig::default()),
            embedding_service,
            vector_store: None,
            tasks: Arc::new(RwLock::new(HashMap::new())),
            config: PipelineConfig::default(),
        }
    }

    /// Set vector store
    pub fn with_vector_store(mut self, store: Arc<dyn VectorStore>) -> Self {
        self.vector_store = Some(store);
        self
    }

    /// Upload and process a document
    pub async fn upload_and_process(
        &self,
        file_path: &str,
        tenant_id: &str,
        department_id: Option<String>,
        tags: Vec<String>,
    ) -> Result<DocumentMetadata, PipelineError> {
        let document_id = format!("doc_{}", uuid::Uuid::new_v4());
        let task_id = document_id.clone();

        // Create initial task
        let task = ProcessingTask {
            task_id: task_id.clone(),
            document_id: document_id.clone(),
            stage: PipelineStage::Upload,
            progress: 0.0,
            status: TaskStatus::Running,
            started_at: Some(Utc::now().timestamp()),
            completed_at: None,
            error: None,
            retry_count: 0,
        };

        let mut tasks = self.tasks.write().await;
        tasks.insert(task_id.clone(), task);

        // Read file
        let content = tokio::fs::read(file_path)
            .await
            .map_err(|e| PipelineError::IoError(e.to_string()))?;

        let metadata = DocumentMetadata {
            document_id: document_id.clone(),
            filename: file_path.split('/').last().unwrap_or("unknown").to_string(),
            document_type: DocumentType::Txt, // Would be detected from extension
            file_size: content.len() as u64,
            mime_type: "text/plain".to_string(),
            checksum: format!("{:x}", md5::compute(&content)),
            tenant_id: tenant_id.to_string(),
            department_id,
            uploaded_by: "system".to_string(),
            uploaded_at: Utc::now().timestamp(),
            indexed_at: None,
            status: DocumentStatus::Processing,
            chunk_count: 0,
            total_tokens: 0,
            tags,
            custom_metadata: None,
        };

        // Update to Validate stage
        self.update_stage_internal(&task_id, PipelineStage::Validate, 0.1).await;

        // Parse document
        self.update_stage_internal(&task_id, PipelineStage::Parse, 0.2).await;
        let parsed = self.parser_registry
            .parse(&content, &metadata)
            .await
            .map_err(|e| PipelineError::ParseError(e.to_string()))?;

        // Chunk document
        self.update_stage_internal(&task_id, PipelineStage::Chunk, 0.4).await;
        let chunks = self.chunker
            .chunk(&parsed.content)
            .await
            .map_err(|e| PipelineError::ChunkingError(e.to_string()))?;

        let chunk_count = chunks.len();
        let total_tokens = chunks.iter().map(|c| c.token_count).sum::<usize>();

        // Embed chunks
        self.update_stage_internal(&task_id, PipelineStage::Embed, 0.6).await;
        // Embedding would happen here

        // Index chunks
        self.update_stage_internal(&task_id, PipelineStage::Index, 0.8).await;
        // Indexing would happen here

        // Complete
        self.update_stage_internal(&task_id, PipelineStage::Complete, 1.0).await;

        let mut result = metadata;
        result.chunk_count = chunk_count;
        result.total_tokens = total_tokens;
        result.status = DocumentStatus::Indexed;
        result.indexed_at = Some(Utc::now().timestamp());

        Ok(result)
    }

    /// Update task stage
    async fn update_stage_internal(&self, task_id: &str, stage: PipelineStage, progress: f32) {
        let mut tasks = self.tasks.write().await;
        if let Some(task) = tasks.get_mut(task_id) {
            let is_complete = stage == PipelineStage::Complete;
            task.stage = stage;
            task.progress = progress;
            if is_complete {
                task.status = TaskStatus::Completed;
                task.completed_at = Some(Utc::now().timestamp());
            }
        }
    }

    /// Get pipeline status
    pub async fn get_status(&self, document_id: &str) -> Result<PipelineStatus, PipelineError> {
        let tasks = self.tasks.read().await;
        let task = tasks.get(document_id)
            .ok_or_else(|| PipelineError::NotFound(document_id.to_string()))?;

        Ok(PipelineStatus {
            document_id: task.document_id.clone(),
            current_stage: task.stage.clone(),
            progress: task.progress,
            status: task.status.clone(),
            chunks_processed: (task.progress * 100.0) as usize,
            total_chunks: 100, // Would be actual count
            error: task.error.clone(),
        })
    }

    /// Delete a document
    pub async fn delete(&self, _document_id: &str) -> Result<(), PipelineError> {
        // Would delete from vector store and metadata store
        Ok(())
    }

    /// Rebuild document index
    pub async fn rebuild_index(&self, _document_id: &str) -> Result<(), PipelineError> {
        // Would re-embed and re-index
        Ok(())
    }
}

/// Pipeline error types
#[derive(Debug, thiserror::Error)]
pub enum PipelineError {
    #[error("IO error: {0}")]
    IoError(String),

    #[error("Parse error: {0}")]
    ParseError(String),

    #[error("Chunking error: {0}")]
    ChunkingError(String),

    #[error("Embedding error: {0}")]
    EmbeddingError(String),

    #[error("Indexing error: {0}")]
    IndexingError(String),

    #[error("Document not found: {0}")]
    NotFound(String),

    #[error("Pipeline error: {0}")]
    PipelineError(String),
}
