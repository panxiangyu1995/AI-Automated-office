//! Prompt Guardrails Commands
//!
//! Tauri commands for prompt security guardrails

use std::sync::Arc;
use tauri::State;

use crate::agent::prompt_guardrails::{
    GuardrailHit, GuardrailLayer, GuardrailResult, GuardrailStats, HallucinationResult,
    PromptGuardrailsService,
};

/// Check a prompt against all guardrail layers
#[tauri::command]
pub async fn check_prompt_guardrails(
    prompt: String,
    session_id: Option<String>,
    user_id: Option<String>,
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<GuardrailResult, String> {
    Ok(service.check_prompt(&prompt, session_id, user_id).await)
}

/// Check for hallucination in a conclusion
#[tauri::command]
pub async fn check_hallucination(
    conclusion: String,
    claims: Vec<String>,
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<HallucinationResult, String> {
    Ok(service.check_hallucination(&conclusion, claims).await)
}

/// Add a blocklist pattern
#[tauri::command]
pub async fn add_guardrail_blocklist_pattern(
    pattern: String,
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<(), String> {
    service.add_blocklist_pattern(pattern).await;
    Ok(())
}

/// Remove a blocklist pattern
#[tauri::command]
pub async fn remove_guardrail_blocklist_pattern(
    pattern: String,
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<(), String> {
    service.remove_blocklist_pattern(&pattern).await;
    Ok(())
}

/// Add a confirmation pattern
#[tauri::command]
pub async fn add_guardrail_confirmation_pattern(
    pattern: String,
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<(), String> {
    service.add_confirmation_pattern(pattern).await;
    Ok(())
}

/// Get guardrail hits with optional layer filter
#[tauri::command]
pub async fn get_guardrail_hits(
    layer: Option<String>,
    limit: usize,
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<Vec<GuardrailHit>, String> {
    let layer_filter = layer.map(|l| match l.as_str() {
        "blocklist" => GuardrailLayer::Blocklist,
        "confirmation_required" => GuardrailLayer::ConfirmationRequired,
        "hallucination_red_flag" => GuardrailLayer::HallucinationRedFlag,
        _ => GuardrailLayer::Blocklist,
    });
    Ok(service.get_hits(layer_filter, limit).await)
}

/// Get guardrail statistics
#[tauri::command]
pub async fn get_guardrail_stats(
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<GuardrailStats, String> {
    Ok(service.get_stats().await)
}

/// Enable or disable hallucination detection
#[tauri::command]
pub async fn set_hallucination_detection(
    enabled: bool,
    service: State<'_, Arc<PromptGuardrailsService>>,
) -> Result<(), String> {
    service.set_hallucination_enabled(enabled).await;
    Ok(())
}
