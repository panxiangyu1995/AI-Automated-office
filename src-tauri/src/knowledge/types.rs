//! Knowledge base types.

use serde::{Deserialize, Serialize};

// ============================================================================
// Enums
// ============================================================================

/// Document status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum DocumentStatus {
    Pending,
    Processing,
    Indexed,
    Failed,
    Archived,
}

/// Document type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum DocumentType {
    Pdf,
    Word,
    Excel,
    Txt,
    Markdown,
    Html,
    Json,
    Csv,
}

/// Processing stage
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PipelineStage {
    Upload,
    Validate,
    Parse,
    Chunk,
    Embed,
    Index,
    Complete,
}

/// Task status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

// ============================================================================
// Structs
// ============================================================================

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

/// Document chunk
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
    pub page_number: Option<usize>,
    pub section: Option<String>,
}

/// Chunking strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkingStrategyConfig {
    pub strategy_type: ChunkingStrategyType,
    pub chunk_size: usize,
    pub overlap: usize,
    pub min_chunk_size: usize,
    pub max_chunk_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ChunkingStrategyType {
    FixedSize,
    Semantic,
    Sentence,
    Paragraph,
    Recursive,
}

impl Default for ChunkingStrategyConfig {
    fn default() -> Self {
        Self {
            strategy_type: ChunkingStrategyType::FixedSize,
            chunk_size: 512,
            overlap: 50,
            min_chunk_size: 100,
            max_chunk_size: 1024,
        }
    }
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
    pub retry_count: usize,
}

/// Pipeline status
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

/// Parsed document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedDocument {
    pub document_id: String,
    pub title: Option<String>,
    pub content: String,
    pub metadata: DocumentMetadata,
    pub raw_content: Vec<u8>,
}

/// Retrieved chunk from RAG
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievedChunk {
    pub chunk_id: String,
    pub document_id: String,
    pub content: String,
    pub score: f32,
    pub heading: Option<String>,
    pub page_number: Option<usize>,
    pub section: Option<String>,
    pub filename: String,
    pub highlights: Vec<String>,
}

/// RAG context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagContext {
    pub query: String,
    pub chunks: Vec<RetrievedChunk>,
    pub total_tokens: usize,
    pub retrieval_time_ms: u64,
}

/// Pipeline configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineConfig {
    pub max_concurrent_tasks: usize,
    pub timeout_seconds: u64,
    pub retry_count: usize,
    pub retry_delay_ms: u64,
    pub enable_ocr: bool,
    pub enable_table_extraction: bool,
    pub enable_image_extraction: bool,
}

impl Default for PipelineConfig {
    fn default() -> Self {
        Self {
            max_concurrent_tasks: 4,
            timeout_seconds: 300,
            retry_count: 3,
            retry_delay_ms: 1000,
            enable_ocr: false,
            enable_table_extraction: false,
            enable_image_extraction: false,
        }
    }
}

/// RAG retrieval configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagRetrievalConfig {
    pub max_chunks: usize,
    pub min_relevance_score: f32,
    pub max_tokens: usize,
    pub hybrid_search: bool,
    pub vector_weight: f32,
    pub bm25_weight: f32,
}

impl Default for RagRetrievalConfig {
    fn default() -> Self {
        Self {
            max_chunks: 10,
            min_relevance_score: 0.5,
            max_tokens: 4000,
            hybrid_search: true,
            vector_weight: 0.7,
            bm25_weight: 0.3,
        }
    }
}
