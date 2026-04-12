//! 数据迁移器模块
//!
//! 提供数据迁移、验证和回滚功能

use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use std::collections::{HashMap, VecDeque};
use uuid::Uuid;

/// 迁移记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationRecord {
    /// 迁移 ID
    pub id: String,
    /// 方向
    pub direction: String,
    /// 源数据
    pub source_data: String,
    /// 目标数据
    pub target_data: String,
    /// 状态
    pub status: String,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 完成时间
    pub completed_at: Option<DateTime<Utc>>,
    /// 回滚点数据
    pub rollback_data: Option<String>,
    /// 错误信息
    pub error_message: Option<String>,
}

impl MigrationRecord {
    /// 创建新的迁移记录
    pub fn new(direction: &str, source_data: String) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            direction: direction.to_string(),
            source_data,
            target_data: String::new(),
            status: "preparing".to_string(),
            created_at: Utc::now(),
            completed_at: None,
            rollback_data: None,
            error_message: None,
        }
    }
}

/// 迁移验证结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    /// 是否有效
    pub is_valid: bool,
    /// 错误列表
    pub errors: Vec<ValidationError>,
    /// 警告列表
    pub warnings: Vec<ValidationWarning>,
    /// 验证的记录数
    pub validated_count: usize,
}

/// 验证错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationError {
    /// 错误类型
    pub error_type: String,
    /// 错误消息
    pub message: String,
    /// 字段名
    pub field: Option<String>,
    /// 行号
    pub row: Option<usize>,
}

/// 验证警告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationWarning {
    /// 警告类型
    pub warning_type: String,
    /// 警告消息
    pub message: String,
    /// 字段名
    pub field: Option<String>,
    /// 行号
    pub row: Option<usize>,
}

/// 导入结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    /// 迁移记录 ID
    pub migration_id: String,
    /// 是否成功
    pub success: bool,
    /// 导入的记录数
    pub imported_count: usize,
    /// 跳过的记录数
    pub skipped_count: usize,
    /// 错误列表
    pub errors: Vec<ImportError>,
}

/// 导入错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportError {
    /// 行号
    pub row: usize,
    /// 错误消息
    pub message: String,
    /// 原始数据
    pub original_data: Option<String>,
}

/// 数据迁移器
pub struct DataMigrator {
    /// 迁移历史
    migrations: VecDeque<MigrationRecord>,
    /// 最大历史记录数
    max_history_size: usize,
    /// 回滚点数据存储
    rollback_points: HashMap<String, String>,
}

impl DataMigrator {
    /// 创建新的数据迁移器
    pub fn new() -> Self {
        Self {
            migrations: VecDeque::new(),
            max_history_size: 100,
            rollback_points: HashMap::new(),
        }
    }

    /// 创建迁移记录
    pub fn create_migration(&mut self, direction: &str, source_data: &str) -> MigrationRecord {
        let record = MigrationRecord::new(direction, source_data.to_string());
        self.migrations.push_front(record.clone());
        
        // 保持历史记录数量
        while self.migrations.len() > self.max_history_size {
            self.migrations.pop_back();
        }
        
        record
    }

    /// 更新迁移记录状态
    pub fn update_migration_status(&mut self, id: &str, status: &str) -> Option<()> {
        if let Some(record) = self.migrations.iter_mut().find(|r| r.id == id) {
            record.status = status.to_string();
            Some(())
        } else {
            None
        }
    }

    /// 完成迁移
    pub fn complete_migration(&mut self, id: &str, target_data: &str, rollback_data: Option<String>) -> Option<()> {
        if let Some(record) = self.migrations.iter_mut().find(|r| r.id == id) {
            record.status = "completed".to_string();
            record.target_data = target_data.to_string();
            record.completed_at = Some(Utc::now());
            record.rollback_data = rollback_data;
            Some(())
        } else {
            None
        }
    }

    /// 标记迁移失败
    pub fn fail_migration(&mut self, id: &str, error: &str) -> Option<()> {
        if let Some(record) = self.migrations.iter_mut().find(|r| r.id == id) {
            record.status = "failed".to_string();
            record.error_message = Some(error.to_string());
            record.completed_at = Some(Utc::now());
            Some(())
        } else {
            None
        }
    }

    /// 获取迁移记录
    pub fn get_migration(&self, id: &str) -> Option<&MigrationRecord> {
        self.migrations.iter().find(|r| r.id == id)
    }

    /// 获取所有迁移记录
    pub fn get_all_migrations(&self) -> Vec<&MigrationRecord> {
        self.migrations.iter().collect()
    }

    /// 获取最近的迁移记录
    pub fn get_recent_migrations(&self, limit: usize) -> Vec<&MigrationRecord> {
        self.migrations.iter().take(limit).collect()
    }

    /// 获取可回滚的迁移记录
    pub fn get_rollbackable_migrations(&self) -> Vec<&MigrationRecord> {
        self.migrations.iter()
            .filter(|r| r.status == "completed" && r.rollback_data.is_some())
            .collect()
    }

    /// 回滚迁移
    pub fn rollback_migration(&mut self, id: &str) -> Result<String, String> {
        let record = self.migrations.iter_mut()
            .find(|r| r.id == id)
            .ok_or_else(|| format!("Migration not found: {}", id))?;

        if record.status != "completed" {
            return Err(format!("Cannot rollback migration with status: {}", record.status));
        }

        let rollback_data = record.rollback_data.clone()
            .ok_or_else(|| "No rollback data available".to_string())?;

        record.status = "rolled_back".to_string();
        record.completed_at = Some(Utc::now());

        Ok(rollback_data)
    }

    /// 验证数据
    pub fn validate(&self, data: &str, schema: Option<&Schema>) -> ValidationResult {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        let mut validated_count = 0;

        // 简单的数据验证
        for (idx, line) in data.lines().enumerate() {
            validated_count += 1;
            
            // 检查空行
            if line.trim().is_empty() {
                warnings.push(ValidationWarning {
                    warning_type: "empty_row".to_string(),
                    message: "Empty row detected".to_string(),
                    field: None,
                    row: Some(idx + 1),
                });
            }

            // 如果提供了 schema，进行 schema 验证
            if let Some(s) = schema {
                if let Some(field_errors) = s.validate_field(line, idx + 1) {
                    errors.extend(field_errors);
                }
            }
        }

        ValidationResult {
            is_valid: errors.is_empty(),
            errors,
            warnings,
            validated_count,
        }
    }

    /// 记录回滚点
    pub fn save_rollback_point(&mut self, migration_id: &str, data: &str) {
        self.rollback_points.insert(migration_id.to_string(), data.to_string());
    }

    /// 获取回滚点
    pub fn get_rollback_point(&self, migration_id: &str) -> Option<&str> {
        self.rollback_points.get(migration_id).map(|s| s.as_str())
    }

    /// 获取统计信息
    pub fn get_stats(&self) -> MigrationStats {
        let total = self.migrations.len();
        let completed = self.migrations.iter().filter(|r| r.status == "completed").count();
        let failed = self.migrations.iter().filter(|r| r.status == "failed").count();
        let rolled_back = self.migrations.iter().filter(|r| r.status == "rolled_back").count();

        MigrationStats {
            total_migrations: total,
            completed_migrations: completed,
            failed_migrations: failed,
            rolled_back_migrations: rolled_back,
            rollback_points_count: self.rollback_points.len(),
        }
    }
}

impl Default for DataMigrator {
    fn default() -> Self {
        Self::new()
    }
}

/// 迁移统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationStats {
    pub total_migrations: usize,
    pub completed_migrations: usize,
    pub failed_migrations: usize,
    pub rolled_back_migrations: usize,
    pub rollback_points_count: usize,
}

/// 数据 Schema
#[derive(Debug, Clone)]
pub struct Schema {
    /// 字段定义
    pub fields: Vec<FieldDefinition>,
    /// 是否必填
    pub required: bool,
}

/// 字段定义
#[derive(Debug, Clone)]
pub struct FieldDefinition {
    /// 字段名
    pub name: String,
    /// 数据类型
    pub data_type: FieldDataType,
    /// 是否必填
    pub required: bool,
    /// 最大长度
    pub max_length: Option<usize>,
}

/// 字段数据类型
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FieldDataType {
    String,
    Integer,
    Float,
    Boolean,
    Date,
    DateTime,
}

impl Schema {
    /// 创建新的 Schema
    pub fn new(fields: Vec<FieldDefinition>) -> Self {
        Self {
            fields,
            required: true,
        }
    }

    /// 验证字段
    pub fn validate_field(&self, data: &str, row: usize) -> Option<Vec<ValidationError>> {
        let parts: Vec<&str> = data.split(',').collect();
        let mut errors = Vec::new();

        for (idx, field) in self.fields.iter().enumerate() {
            let value = parts.get(idx).map(|s| s.trim()).unwrap_or("");

            // 检查必填字段
            if field.required && value.is_empty() {
                errors.push(ValidationError {
                    error_type: "required".to_string(),
                    message: format!("Field '{}' is required", field.name),
                    field: Some(field.name.clone()),
                    row: Some(row),
                });
            }

            // 检查长度
            if let Some(max_len) = field.max_length {
                if value.len() > max_len {
                    errors.push(ValidationError {
                        error_type: "max_length".to_string(),
                        message: format!("Field '{}' exceeds maximum length {}", field.name, max_len),
                        field: Some(field.name.clone()),
                        row: Some(row),
                    });
                }
            }
        }

        if errors.is_empty() {
            None
        } else {
            Some(errors)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_migration() {
        let mut migrator = DataMigrator::new();
        
        let record = migrator.create_migration("export", "test data");
        
        assert_eq!(record.direction, "export");
        assert_eq!(record.status, "preparing");
        assert!(!record.id.is_empty());
    }

    #[test]
    fn test_complete_migration() {
        let mut migrator = DataMigrator::new();
        
        let record = migrator.create_migration("export", "test data");
        migrator.complete_migration(&record.id, "result data", Some("rollback data".to_string()));
        
        let updated = migrator.get_migration(&record.id).unwrap();
        assert_eq!(updated.status, "completed");
        assert_eq!(updated.target_data, "result data");
        assert!(updated.completed_at.is_some());
    }

    #[test]
    fn test_rollback() {
        let mut migrator = DataMigrator::new();
        
        let record = migrator.create_migration("export", "test data");
        migrator.complete_migration(&record.id, "result data", Some("rollback data".to_string()));
        
        let rollback = migrator.rollback_migration(&record.id);
        assert!(rollback.is_ok());
        assert_eq!(rollback.unwrap(), "rollback data");
        
        let updated = migrator.get_migration(&record.id).unwrap();
        assert_eq!(updated.status, "rolled_back");
    }

    #[test]
    fn test_stats() {
        let mut migrator = DataMigrator::new();
        
        let record1 = migrator.create_migration("export", "data1");
        migrator.complete_migration(&record1.id, "result1", Some("rollback1".to_string()));
        
        let record2 = migrator.create_migration("export", "data2");
        migrator.fail_migration(&record2.id, "error");
        
        let stats = migrator.get_stats();
        assert_eq!(stats.total_migrations, 2);
        assert_eq!(stats.completed_migrations, 1);
        assert_eq!(stats.failed_migrations, 1);
    }

    #[test]
    fn test_validate() {
        let migrator = DataMigrator::new();
        
        let data = "name,age\nAlice,30\n\nBob,25";
        let result = migrator.validate(data, None);
        
        assert!(result.is_valid);
        assert_eq!(result.validated_count, 4);
        assert!(!result.warnings.is_empty());
    }
}
