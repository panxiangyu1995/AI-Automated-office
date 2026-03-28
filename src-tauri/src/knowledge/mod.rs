//! Knowledge Base RAG module.
//!
//! This module implements:
//! - Document processing pipeline (upload -> validate -> parse -> chunk -> embed -> index)
//! - Document parsers for various formats (PDF, Word, Markdown, TXT)
//! - Intelligent chunking strategies (fixed, semantic, recursive)
//! - RAG context builder with token budget control
//! - Incremental update mechanism
//!
//! # Architecture
//!
//! - `pipeline/`: Document processing pipeline
//! - `parser/`: Document parsers
//! - `chunker/`: Document chunking strategies
//! - `context_builder/`: RAG context building
//! - `incremental/`: Incremental update mechanism

pub mod types;
pub mod pipeline;
pub mod parser;
pub mod chunker;
pub mod context_builder;
pub mod incremental;

pub use types::*;
pub use pipeline::DocumentPipeline;
pub use context_builder::RagContextBuilder;

use std::sync::Arc;
use tauri::State;

use crate::vector::embedding::EmbeddingService;
use crate::vector::store::{VectorStore, VectorQuery};

// ============================================================================
// Tauri Commands
// ============================================================================

/// Upload and process a document
#[tauri::command]
pub async fn knowledge_upload_document(
    file_path: String,
    tenant_id: String,
    department_id: Option<String>,
    tags: Vec<String>,
    pipeline: State<'_, Arc<DocumentPipeline>>,
) -> Result<DocumentMetadata, String> {
    pipeline.upload_and_process(&file_path, &tenant_id, department_id, tags)
        .await
        .map_err(|e| e.to_string())
}

/// Search knowledge base
#[tauri::command]
pub async fn knowledge_search(
    query: String,
    _tenant_id: String,
    _department_id: Option<String>,
    max_results: usize,
    embedding_service: State<'_, Arc<EmbeddingService>>,
    vector_store: State<'_, Arc<dyn VectorStore>>,
) -> Result<Vec<RetrievedChunk>, String> {
    // Generate query embedding
    let query_embedding = embedding_service
        .embed_text(&query)
        .await
        .map_err(|e| format!("Embedding error: {}", e))?;

    // Search vector store
    let vector_query = VectorQuery {
        vector: query_embedding,
        k: max_results,
        filter: None,
        include_metadata: true,
    };
    let results = vector_store
        .search(vector_query)
        .await
        .map_err(|e| format!("Search error: {}", e))?;

    // Convert to RetrievedChunk using direct fields
    let chunks: Vec<RetrievedChunk> = results
        .into_iter()
        .map(|r| {
            let metadata = r.metadata.clone();
            RetrievedChunk {
                chunk_id: r.id,
                document_id: metadata.get("document_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                content: metadata.get("content").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                score: r.score,
                heading: metadata.get("heading").and_then(|v| v.as_str()).map(String::from),
                page_number: metadata.get("page_number").and_then(|v| v.as_u64()).map(|v| v as usize),
                section: metadata.get("section").and_then(|v| v.as_str()).map(String::from),
                filename: metadata.get("filename").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                highlights: Vec::new(),
            }
        })
        .collect();

    Ok(chunks)
}

/// Get document processing status
#[tauri::command]
pub async fn knowledge_document_status(
    document_id: String,
    pipeline: State<'_, Arc<DocumentPipeline>>,
) -> Result<PipelineStatus, String> {
    pipeline.get_status(&document_id)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a document
#[tauri::command]
pub async fn knowledge_delete_document(
    document_id: String,
    pipeline: State<'_, Arc<DocumentPipeline>>,
) -> Result<(), String> {
    pipeline.delete(&document_id)
        .await
        .map_err(|e| e.to_string())
}

/// Rebuild document index
#[tauri::command]
pub async fn knowledge_rebuild_index(
    document_id: String,
    pipeline: State<'_, Arc<DocumentPipeline>>,
) -> Result<(), String> {
    pipeline.rebuild_index(&document_id)
        .await
        .map_err(|e| e.to_string())
}
