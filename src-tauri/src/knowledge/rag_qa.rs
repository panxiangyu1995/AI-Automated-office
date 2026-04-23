//! RAG Q&A Command Module
//!
//! Provides Tauri commands for RAG-based question answering.

use serde::{Deserialize, Serialize};

use crate::knowledge::types::{RagContext, RetrievedChunk};
use crate::knowledge::search::VectorServiceState;

/// RAG Q&A request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagQuestionRequest {
    /// Question text
    pub question: String,
    /// Knowledge base IDs to search (None = all accessible)
    pub knowledge_base_ids: Option<Vec<String>>,
    /// Maximum number of context chunks (default: 5)
    pub max_chunks: Option<usize>,
    /// Minimum relevance score threshold (0.0-1.0)
    pub min_score: Option<f32>,
    /// Whether to include sources in response
    pub include_sources: Option<bool>,
}

/// RAG Q&A response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagQuestionResponse {
    /// Generated answer
    pub answer: String,
    /// Sources used
    pub sources: Vec<RagSource>,
    /// Retrieved context info
    pub context_info: RagContextInfo,
    /// Total response time in milliseconds
    pub response_time_ms: u64,
}

/// Source document information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagSource {
    /// Source ID
    pub id: String,
    /// Document title
    pub title: String,
    /// Chunk content snippet
    pub snippet: String,
    /// Relevance score
    pub score: f32,
}

/// Context information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RagContextInfo {
    /// Number of chunks retrieved
    pub chunks_retrieved: usize,
    /// Total tokens in context
    pub total_tokens: usize,
    /// Retrieval time in milliseconds
    pub retrieval_time_ms: u64,
    /// Search mode used
    pub search_mode: String,
}

/// LLM response for RAG Q&A
#[derive(Debug, Clone, Serialize, Deserialize)]
struct LlmRagResponse {
    answer: String,
    sources: Vec<RagSource>,
}

/// Perform RAG-based question answering
#[tauri::command]
pub async fn rag_question(
    tenant_id: String,
    user_id: String,
    request: RagQuestionRequest,
    vector_state: tauri::State<'_, VectorServiceState>,
) -> Result<RagQuestionResponse, String> {
    let start = std::time::Instant::now();
    
    tracing::info!(
        "[RagQuestion] Processing question for tenant: {}, query: {}", 
        tenant_id, request.question
    );

    // First, search for relevant chunks
    let search_request = crate::knowledge::search::KnowledgeSearchRequest {
        query: request.question.clone(),
        top_k: request.max_chunks.or(Some(5)),
        score_threshold: request.min_score,
        knowledge_base_ids: request.knowledge_base_ids.clone(),
        search_mode: Some("hybrid".to_string()),
    };

    let search_response = crate::knowledge::search::knowledge_search(
        tenant_id.clone(),
        user_id.clone(),
        search_request,
        vector_state,
    ).await?;

    // Build context from retrieved chunks
    let chunks: Vec<RetrievedChunk> = search_response.results
        .iter()
        .map(|r| RetrievedChunk {
            chunk_id: r.id.clone(),
            document_id: r.document_id.clone(),
            content: r.content.clone(),
            score: r.score,
            metadata: Some(r.metadata.clone()),
        })
        .collect();

    // Build RAG context
    let total_tokens = chunks.iter()
        .map(|c| c.content.len() / 4) // Rough token estimation
        .sum();

    let context = RagContext {
        query: request.question.clone(),
        chunks,
        total_tokens,
        retrieval_time_ms: search_response.query_time_ms,
    };

    // Generate answer using LLM
    let llm_response = generate_answer(&request.question, &context).await
        .map_err(|e| format!("LLM生成失败: {}", e))?;

    let response_time_ms = start.elapsed().as_millis() as u64;

    tracing::info!(
        "[RagQuestion] Generated answer in {}ms", 
        response_time_ms
    );

    Ok(RagQuestionResponse {
        answer: llm_response.answer,
        sources: llm_response.sources,
        context_info: RagContextInfo {
            chunks_retrieved: context.chunks.len(),
            total_tokens: context.total_tokens,
            retrieval_time_ms: context.retrieval_time_ms,
            search_mode: search_response.search_mode,
        },
        response_time_ms,
    })
}

/// Generate answer using LLM with RAG context
async fn generate_answer(question: &str, context: &RagContext) -> Result<LlmRagResponse, String> {
    // Build prompt with context
    let context_text = if context.chunks.is_empty() {
        "未找到相关知识库内容，请基于一般知识回答。".to_string()
    } else {
        context.chunks.iter()
            .enumerate()
            .map(|(i, chunk)| {
                format!(
                    "[参考文档 {}]\n{}\n[/参考文档 {}]",
                    i + 1,
                    chunk.content,
                    i + 1
                )
            })
            .collect::<Vec<_>>()
            .join("\n\n")
    };

    let system_prompt = format!(
        "你是一个知识库问答助手。请根据提供的参考文档内容，准确回答用户的问题。\n\
        如果参考文档中有相关信息，请基于文档内容回答；如果没有，可以基于一般知识回答，但需说明。\n\
        请用简洁清晰的语言回答，并适当引用参考文档。",
    );

    let user_prompt = format!(
        "参考文档:\n{}\n\n问题: {}",
        context_text, question
    );

    // Get LLM client from agent runtime
    // For now, return a simulated response if LLM is not available
    // In production, this would call the actual LLM API
    
    tracing::info!("[RagQuestion] Generating answer with prompt length: {}", user_prompt.len());
    
    // Simulate LLM response (in production, this would be replaced with actual LLM call)
    let answer = generate_simulated_answer(question, context);
    
    let sources: Vec<RagSource> = context.chunks.iter()
        .map(|chunk| RagSource {
            id: chunk.chunk_id.clone(),
            title: chunk.document_id.clone(),
            snippet: chunk.content.chars().take(200).collect(),
            score: chunk.score,
        })
        .collect();

    Ok(LlmRagResponse { answer, sources })
}

/// Generate simulated answer when LLM is not available
fn generate_simulated_answer(question: &str, context: &RagContext) -> String {
    if context.chunks.is_empty() {
        return format!(
            "抱歉，知识库中没有找到与「{}」直接相关的内容。\
            您可以尝试使用不同的关键词搜索，或者联系管理员添加相关文档到知识库中。",
            question
        );
    }

    let first_chunk = &context.chunks[0];
    let relevance_percent = (first_chunk.score * 100.0).round() as i32;

    format!(
        "根据知识库中的相关内容（匹配度: {}%），以下是与「{}」相关的信息：\n\n{}\n\n\
        这是从知识库中找到的最相关结果。如果需要更详细的答案，请尝试更具体的问题。",
        relevance_percent,
        question,
        first_chunk.content
    )
}
