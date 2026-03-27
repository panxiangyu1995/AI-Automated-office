//! Tool execution commands.

use tauri::State;

use crate::agent::events::RuntimeEventEmitter;
use crate::agent::tools::{ToolDescriptor, ToolExecutionPipeline, ToolExecutionRequest, ToolExecutionResponse};

#[tauri::command]
pub async fn list_tools(state: State<'_, ToolExecutionPipeline>) -> Result<Vec<ToolDescriptor>, String> {
    Ok(state.list_tools())
}

#[tauri::command]
pub async fn execute_tool(
    request: ToolExecutionRequest,
    state: State<'_, ToolExecutionPipeline>,
    app: tauri::AppHandle,
) -> Result<ToolExecutionResponse, String> {
    let mut emitter = RuntimeEventEmitter::new(app, request.context.session_id.clone());
    state.execute(request, Some(&mut emitter)).await
}
