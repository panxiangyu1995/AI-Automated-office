//! 数据导出 Tauri 命令
//!
//! 提供数据导出和迁移的 IPC 接口

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::export::{
    ExportFormat, ExportStatus, MigrationDirection, MigrationStatus,
    csv_exporter::{CsvExporter, CsvExportConfig},
    json_exporter::{JsonExporter, JsonExportConfig},
    excel_exporter::{ExcelExporter, ExcelExportConfig},
    migrator::{DataMigrator, ValidationResult, ImportResult},
    ExportMigrationState,
};

// ============================================================================
// 导出命令
// ============================================================================

/// 导出数据为 CSV
#[tauri::command]
pub async fn export_csv(
    _state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    entity_type: String,
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
) -> Result<String, String> {
    let exporter = CsvExporter::new();
    let csv = exporter.export(&headers, &rows);
    tracing::info!("Exported {} rows to CSV for {}", rows.len(), entity_type);
    Ok(csv)
}

/// 导出数据为 JSON
#[tauri::command]
pub async fn export_json(
    _state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    entity_type: String,
    data: String,
) -> Result<String, String> {
    let exporter = JsonExporter::new();
    
    // 尝试解析数据为 JSON 数组
    let parsed: Vec<serde_json::Value> = serde_json::from_str(&data)
        .map_err(|e| format!("Failed to parse data: {}", e))?;
    
    let result = exporter.export(&entity_type, &parsed);
    tracing::info!("Exported {} records to JSON for {}", parsed.len(), entity_type);
    Ok(result.content)
}

/// 导出数据为 Excel（返回元数据）
#[tauri::command]
pub async fn export_excel(
    _state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    entity_type: String,
    headers: Vec<String>,
    rows: Vec<Vec<serde_json::Value>>,
) -> Result<crate::export::excel_exporter::ExcelExportResult, String> {
    let exporter = ExcelExporter::new();
    let result = exporter.export(&headers, &rows);
    tracing::info!("Exported {} rows to Excel for {}", rows.len(), entity_type);
    Ok(result)
}

/// 获取 CSV 导出配置
#[tauri::command]
pub fn get_csv_export_config() -> CsvExportConfig {
    CsvExportConfig::default()
}

/// 获取 JSON 导出配置
#[tauri::command]
pub fn get_json_export_config() -> JsonExportConfig {
    JsonExportConfig::default()
}

/// 获取 Excel 导出配置
#[tauri::command]
pub fn get_excel_export_config() -> ExcelExportConfig {
    ExcelExportConfig::default()
}

// ============================================================================
// 迁移命令
// ============================================================================

/// 创建迁移记录
#[tauri::command]
pub async fn create_migration(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    direction: String,
    source_data: String,
) -> Result<crate::export::migrator::MigrationRecord, String> {
    let mut state = state.write().await;
    let migrator = state.migrator.write().await;
    let record = migrator.create_migration(&direction, &source_data);
    tracing::info!("Created migration {} with direction {}", record.id, direction);
    Ok(record)
}

/// 完成迁移
#[tauri::command]
pub async fn complete_migration(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    migration_id: String,
    target_data: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let migrator = state.migrator.write().await;
    migrator.complete_migration(&migration_id, &target_data, None)
        .ok_or_else(|| format!("Migration not found: {}", migration_id))?;
    tracing::info!("Completed migration {}", migration_id);
    Ok(())
}

/// 回滚迁移
#[tauri::command]
pub async fn rollback_migration(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    migration_id: String,
) -> Result<String, String> {
    let mut state = state.write().await;
    let migrator = state.migrator.write().await;
    let rollback_data = migrator.rollback_migration(&migration_id)?;
    tracing::info!("Rolled back migration {}", migration_id);
    Ok(rollback_data)
}

/// 获取迁移记录
#[tauri::command]
pub async fn get_migration(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    migration_id: String,
) -> Result<Option<crate::export::migrator::MigrationRecord>, String> {
    let state = state.read().await;
    let migrator = state.migrator.read().await;
    Ok(migrator.get_migration(&migration_id).cloned())
}

/// 获取迁移历史
#[tauri::command]
pub async fn get_migration_history(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    limit: Option<usize>,
) -> Result<Vec<crate::export::migrator::MigrationRecord>, String> {
    let state = state.read().await;
    let migrator = state.migrator.read().await;
    let limit = limit.unwrap_or(100);
    Ok(migrator.get_recent_migrations(limit)
        .into_iter()
        .cloned()
        .collect())
}

/// 获取可回滚的迁移
#[tauri::command]
pub async fn get_rollbackable_migrations(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
) -> Result<Vec<crate::export::migrator::MigrationRecord>, String> {
    let state = state.read().await;
    let migrator = state.migrator.read().await;
    Ok(migrator.get_rollbackable_migrations()
        .into_iter()
        .cloned()
        .collect())
}

/// 验证导入数据
#[tauri::command]
pub async fn validate_import(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    data: String,
) -> Result<ValidationResult, String> {
    let state = state.read().await;
    let migrator = state.migrator.read().await;
    Ok(migrator.validate(&data, None))
}

/// 执行导入
#[tauri::command]
pub async fn execute_import(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
    data: String,
) -> Result<ImportResult, String> {
    let mut state = state.write().await;
    let migrator = state.migrator.write().await;
    
    // 创建迁移记录
    let record = migrator.create_migration("import", &data);
    
    // 执行验证
    let validation = migrator.validate(&data, None);
    
    let mut errors = Vec::new();
    let mut imported_count = 0;
    let mut skipped_count = 0;
    
    if validation.is_valid {
        // 执行导入逻辑
        for line in data.lines() {
            if line.trim().is_empty() {
                skipped_count += 1;
                continue;
            }
            imported_count += 1;
        }
        
        migrator.complete_migration(&record.id, &data, Some(data.clone()))?;
    } else {
        for error in &validation.errors {
            errors.push(crate::export::migrator::ImportError {
                row: error.row.unwrap_or(0),
                message: error.message.clone(),
                original_data: None,
            });
        }
        migrator.fail_migration(&record.id, "Validation failed")?;
    }
    
    Ok(ImportResult {
        migration_id: record.id,
        success: validation.is_valid,
        imported_count,
        skipped_count,
        errors,
    })
}

/// 获取迁移统计
#[tauri::command]
pub async fn get_migration_stats(
    state: State<'_, Arc<RwLock<ExportMigrationState>>>,
) -> Result<crate::export::migrator::MigrationStats, String> {
    let state = state.read().await;
    let migrator = state.migrator.read().await;
    Ok(migrator.get_stats())
}
