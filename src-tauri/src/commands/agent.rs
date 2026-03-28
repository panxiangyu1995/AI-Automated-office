//! Agent runtime Tauri commands.

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::agent::events::RuntimeEventEmitter;
use crate::agent::knowledge_retrieval::{
    format_for_planner_context, format_for_runtime_context, format_for_tool_context,
    KnowledgeRetrieval, KnowledgeRetrievalService, KnowledgeSourceRef, KnowledgeSourceType,
    KnowledgeScope, RetrievalOptions, RetrievalRequest, RetrievalResult,
};
use crate::agent::orchestrator::AgentOrchestrator;
use crate::agent::runtime_session::RuntimeSessionService;
use crate::agent::{AgentExecutionRequest, AgentExecutionResponse, AgentRuntimeState};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartAgentSessionRequest {
    pub tenant_id: String,
    pub user_id: String,
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartAgentSessionResponse {
    pub session_id: String,
    pub session_key: String,
}

#[tauri::command]
pub async fn start_agent_session(
    request: StartAgentSessionRequest,
) -> Result<StartAgentSessionResponse, String> {
    let runtime = RuntimeSessionService::new(&request.tenant_id)
        .await
        .map_err(|err| err.to_string())?;
    let session = runtime
        .create_session(&request.user_id, request.title)
        .await
        .map_err(|err| err.to_string())?;
    Ok(StartAgentSessionResponse {
        session_id: session.id,
        session_key: session.session_key,
    })
}

#[tauri::command]
pub async fn execute_agent(
    request: AgentExecutionRequest,
    state: State<'_, AgentRuntimeState>,
    app: tauri::AppHandle,
) -> Result<AgentExecutionResponse, String> {
    let runtime = RuntimeSessionService::new(&request.tenant_id)
        .await
        .map_err(|err| err.to_string())?;
    let orchestrator = AgentOrchestrator::new(
        state.provider(),
        runtime,
        state.cancellations(),
    );
    let mut event_emitter = RuntimeEventEmitter::new(app, request.session_id.clone());
    orchestrator
        .execute_with_events(request, Some(&mut event_emitter))
        .await
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn interrupt_agent_session(
    session_id: String,
    state: State<'_, AgentRuntimeState>,
) -> Result<bool, String> {
    Ok(state.interrupt(&session_id).await)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeRetrievalRequest {
    pub query: String,
    pub scope: String,
    pub tenant_id: String,
    pub department_id: Option<String>,
    pub user_id: Option<String>,
    pub session_id: Option<String>,
    pub sources: Vec<KnowledgeSourceInfo>,
    pub max_results: Option<usize>,
    pub min_score: Option<f32>,
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeSourceInfo {
    pub source_id: String,
    pub source_type: String,
    pub name: String,
    pub scope: String,
    pub tenant_id: Option<String>,
    pub department_id: Option<String>,
    pub enabled: Option<bool>,
    pub priority: Option<u32>,
}

fn parse_source_type(s: &str) -> KnowledgeSourceType {
    match s {
        "document" => KnowledgeSourceType::Document,
        "database" => KnowledgeSourceType::Database,
        "api" => KnowledgeSourceType::Api,
        "vector_store" => KnowledgeSourceType::VectorStore,
        "rule_set" => KnowledgeSourceType::RuleSet,
        "template" => KnowledgeSourceType::Template,
        "knowledge_graph" => KnowledgeSourceType::KnowledgeGraph,
        _ => KnowledgeSourceType::VectorStore,
    }
}

fn parse_scope(s: &str) -> KnowledgeScope {
    match s {
        "tenant" => KnowledgeScope::Tenant,
        "department" => KnowledgeScope::Department,
        "user" => KnowledgeScope::User,
        "session" => KnowledgeScope::Session,
        "global" => KnowledgeScope::Global,
        _ => KnowledgeScope::Tenant,
    }
}

#[tauri::command]
pub async fn retrieve_knowledge(
    request: KnowledgeRetrievalRequest,
) -> Result<RetrievalResult, String> {
    let service = KnowledgeRetrievalService::new();

    let sources: Vec<KnowledgeSourceRef> = request
        .sources
        .into_iter()
        .map(|s| KnowledgeSourceRef {
            source_id: s.source_id,
            source_type: parse_source_type(&s.source_type),
            name: s.name,
            scope: parse_scope(&s.scope),
            tenant_id: s.tenant_id,
            department_id: s.department_id,
            enabled: s.enabled.unwrap_or(true),
            priority: s.priority.unwrap_or(0),
            metadata: None,
        })
        .collect();

    let options = RetrievalOptions {
        max_results: request.max_results.unwrap_or(10),
        min_score: request.min_score.unwrap_or(0.5),
        include_metadata: true,
        timeout_ms: request.timeout_ms.unwrap_or(30000),
        filters: Vec::new(),
        ranking_strategy: "relevance".to_string(),
    };

    let retrieval_request = RetrievalRequest {
        request_id: format!("req_{}", uuid::Uuid::new_v4()),
        query: request.query,
        scope: parse_scope(&request.scope),
        tenant_id: request.tenant_id,
        department_id: request.department_id,
        user_id: request.user_id,
        session_id: request.session_id,
        sources,
        options,
        created_at: chrono::Utc::now().timestamp(),
        status: crate::agent::knowledge_retrieval::RetrievalStatus::Pending,
    };

    service
        .retrieve(&retrieval_request)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn retrieve_knowledge_cached(
    request: KnowledgeRetrievalRequest,
) -> Result<RetrievalResult, String> {
    let service = KnowledgeRetrievalService::new();

    let sources: Vec<KnowledgeSourceRef> = request
        .sources
        .into_iter()
        .map(|s| KnowledgeSourceRef {
            source_id: s.source_id,
            source_type: parse_source_type(&s.source_type),
            name: s.name,
            scope: parse_scope(&s.scope),
            tenant_id: s.tenant_id,
            department_id: s.department_id,
            enabled: s.enabled.unwrap_or(true),
            priority: s.priority.unwrap_or(0),
            metadata: None,
        })
        .collect();

    let options = RetrievalOptions {
        max_results: request.max_results.unwrap_or(10),
        min_score: request.min_score.unwrap_or(0.5),
        include_metadata: true,
        timeout_ms: request.timeout_ms.unwrap_or(30000),
        filters: Vec::new(),
        ranking_strategy: "relevance".to_string(),
    };

    let retrieval_request = RetrievalRequest {
        request_id: format!("req_{}", uuid::Uuid::new_v4()),
        query: request.query,
        scope: parse_scope(&request.scope),
        tenant_id: request.tenant_id,
        department_id: request.department_id,
        user_id: request.user_id,
        session_id: request.session_id,
        sources,
        options,
        created_at: chrono::Utc::now().timestamp(),
        status: crate::agent::knowledge_retrieval::RetrievalStatus::Pending,
    };

    service
        .retrieve_with_cache(&retrieval_request, true)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn format_knowledge_for_planner(result: RetrievalResult) -> String {
    format_for_planner_context(&result)
}

#[tauri::command]
pub fn format_knowledge_for_runtime(result: RetrievalResult) -> String {
    format_for_runtime_context(&result)
}

#[tauri::command]
pub fn format_knowledge_for_tool(result: RetrievalResult, tool_name: Option<String>) -> String {
    format_for_tool_context(&result, tool_name.as_deref())
}
