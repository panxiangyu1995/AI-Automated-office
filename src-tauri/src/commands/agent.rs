//! Agent runtime Tauri commands.

use serde::{Deserialize, Serialize};
use tauri::State;

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
) -> Result<AgentExecutionResponse, String> {
    let runtime = RuntimeSessionService::new(&request.tenant_id)
        .await
        .map_err(|err| err.to_string())?;
    let orchestrator = AgentOrchestrator::new(
        state.provider(),
        runtime,
        state.cancellations(),
    );
    orchestrator.execute(request).await.map_err(|err| err.to_string())
}

#[tauri::command]
pub async fn interrupt_agent_session(
    session_id: String,
    state: State<'_, AgentRuntimeState>,
) -> Result<bool, String> {
    Ok(state.interrupt(&session_id).await)
}
