//! Tenant Data Import/Export Commands
//!
//! Tauri commands for multi-tenant data operations.

use crate::export::tenant_data::{
    DataCategory, TenantDataService, TenantDataState,
    TenantExportRequest, TenantExportResult,
    TenantImportRequest, TenantImportResult,
};

/// Export tenant data
#[tauri::command]
pub async fn tenant_export_data(
    state: tauri::State<'_, TenantDataState>,
    request: TenantExportRequest,
) -> Result<TenantExportResult, String> {
    tracing::info!(
        "[TenantData] Export request: tenant={}, categories={:?}",
        request.tenant_id, request.categories
    );

    let service = state.read().await;
    service.export_data(request).await.map_err(|e| e.to_string())
}

/// Import tenant data
#[tauri::command]
pub async fn tenant_import_data(
    state: tauri::State<'_, TenantDataState>,
    request: TenantImportRequest,
) -> Result<TenantImportResult, String> {
    tracing::info!(
        "[TenantData] Import request: tenant={}, mode={}",
        request.tenant_id, request.mode
    );

    let service = state.read().await;
    service.import_data(request).await.map_err(|e| e.to_string())
}

/// Get export result by ID
#[tauri::command]
pub async fn tenant_get_export(
    state: tauri::State<'_, TenantDataState>,
    export_id: String,
) -> Result<Option<TenantExportResult>, String> {
    let service = state.read().await;
    Ok(service.get_export(&export_id).await)
}

/// Get import result by ID
#[tauri::command]
pub async fn tenant_get_import(
    state: tauri::State<'_, TenantDataState>,
    import_id: String,
) -> Result<Option<TenantImportResult>, String> {
    let service = state.read().await;
    Ok(service.get_import(&import_id).await)
}

/// Get supported data categories
#[tauri::command]
pub fn tenant_get_data_categories() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({"id": "employees", "name": "员工数据", "description": "HR员工信息"}),
        serde_json::json!({"id": "customers", "name": "客户数据", "description": "客户信息"}),
        serde_json::json!({"id": "orders", "name": "订单数据", "description": "销售订单"}),
        serde_json::json!({"id": "knowledge", "name": "知识库", "description": "知识库文档"}),
        serde_json::json!({"id": "approvals", "name": "审批流程", "description": "审批流程定义"}),
        serde_json::json!({"id": "workflows", "name": "工作流", "description": "工作流定义"}),
        serde_json::json!({"id": "all", "name": "全部数据", "description": "所有数据类别"}),
    ]
}

/// Validate import data without actually importing
#[tauri::command]
pub async fn tenant_validate_import(
    state: tauri::State<'_, TenantDataState>,
    data: serde_json::Value,
    categories: Vec<String>,
) -> Result<Vec<serde_json::Value>, String> {
    let service = state.read().await;
    
    let mut errors = Vec::new();
    
    // Basic validation
    if let Some(data_obj) = data.get("data").and_then(|v| v.as_object()) {
        for category in categories {
            if let Some(items) = data_obj.get(&category).and_then(|v| v.as_array()) {
                for (idx, item) in items.iter().enumerate() {
                    if item.is_null() || (item.as_object().map(|o| o.is_empty()).unwrap_or(false)) {
                        errors.push(serde_json::json!({
                            "category": category,
                            "record_id": format!("{}-{}", category, idx),
                            "field": "data",
                            "message": "记录为空或格式无效"
                        }));
                    }
                }
            }
        }
    } else {
        errors.push(serde_json::json!({
            "category": "root",
            "record_id": "data",
            "field": "data",
            "message": "缺少data字段"
        }));
    }

    Ok(errors)
}
