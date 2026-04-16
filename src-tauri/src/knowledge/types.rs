//! Knowledge 模块类型

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeDocument {
    pub id: String,
    pub title: String,
    pub content: String,
    pub category: String,
    pub tags: Vec<String>,
    pub author: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// Document type supported by the knowledge pipeline
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum DocumentType {
    Txt,
    Markdown,
    Pdf,
    Docx,
    Html,
    Csv,
    Json,
}

/// Document status in the pipeline
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum DocumentStatus {
    Pending,
    Processing,
    Indexed,
    Failed,
    Deleted,
}

/// Task status for pipeline processing
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// Pipeline stage
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PipelineStage {
    Upload,
    Validate,
    Parse,
    Chunk,
    Embed,
    Index,
    Complete,
}

/// Document metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub document_id: String,
    pub filename: String,
    pub document_type: DocumentType,
    pub file_size: u64,
    pub mime_type: String,
    pub checksum: String,
    pub tenant_id: String,
    pub department_id: Option<String>,
    pub uploaded_by: String,
    pub uploaded_at: i64,
    pub indexed_at: Option<i64>,
    pub status: DocumentStatus,
    pub chunk_count: usize,
    pub total_tokens: usize,
    pub tags: Vec<String>,
    pub custom_metadata: Option<serde_json::Value>,
}

/// Processing task
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingTask {
    pub task_id: String,
    pub document_id: String,
    pub stage: PipelineStage,
    pub progress: f32,
    pub status: TaskStatus,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub error: Option<String>,
    pub retry_count: u32,
}

/// Pipeline configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineConfig {
    pub max_file_size: u64,
    pub chunk_size: usize,
    pub chunk_overlap: usize,
    pub max_retries: u32,
    pub concurrent_tasks: usize,
}

impl Default for PipelineConfig {
    fn default() -> Self {
        Self {
            max_file_size: 50 * 1024 * 1024, // 50MB
            chunk_size: 512,
            chunk_overlap: 50,
            max_retries: 3,
            concurrent_tasks: 4,
        }
    }
}

/// Pipeline status for UI display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineStatus {
    pub document_id: String,
    pub current_stage: PipelineStage,
    pub progress: f32,
    pub status: TaskStatus,
    pub chunks_processed: usize,
    pub total_chunks: usize,
    pub error: Option<String>,
}

/// Parsed document result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedDocument {
    pub document_id: String,
    pub title: Option<String>,
    pub content: String,
    pub metadata: DocumentMetadata,
    pub raw_content: Vec<u8>,
}

/// Chunking strategy type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChunkingStrategyType {
    FixedSize,
    Sentence,
    Paragraph,
    Recursive,
    Semantic,
}

/// Chunking strategy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkingStrategyConfig {
    pub strategy_type: ChunkingStrategyType,
    pub chunk_size: usize,
    pub overlap: usize,
    pub min_chunk_size: usize,
    pub max_chunk_size: usize,
}

impl Default for ChunkingStrategyConfig {
    fn default() -> Self {
        Self {
            strategy_type: ChunkingStrategyType::Recursive,
            chunk_size: 512,
            overlap: 50,
            min_chunk_size: 100,
            max_chunk_size: 1024,
        }
    }
}

/// Document chunk produced by chunking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentChunk {
    pub chunk_id: String,
    pub document_id: String,
    pub chunk_index: usize,
    pub content: String,
    pub token_count: usize,
    pub start_offset: usize,
    pub end_offset: usize,
    pub heading: Option<String>,
    pub page_number: Option<u32>,
    pub section: Option<String>,
}

/// RAG retrieval configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagRetrievalConfig {
    pub max_chunks: usize,
    pub max_tokens: usize,
    pub min_score: f32,
    pub rerank: bool,
}

impl Default for RagRetrievalConfig {
    fn default() -> Self {
        Self {
            max_chunks: 5,
            max_tokens: 4096,
            min_score: 0.5,
            rerank: false,
        }
    }
}

/// Retrieved chunk from vector search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievedChunk {
    pub chunk_id: String,
    pub document_id: String,
    pub content: String,
    pub score: f32,
    pub metadata: Option<serde_json::Value>,
}

/// RAG context built from retrieved chunks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagContext {
    pub query: String,
    pub chunks: Vec<RetrievedChunk>,
    pub total_tokens: usize,
    pub retrieval_time_ms: u64,
}
