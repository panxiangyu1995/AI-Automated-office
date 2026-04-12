//! 数据导出与迁移模块
//!
//! 提供 CSV、JSON、Excel 格式的数据导出和迁移功能

pub mod csv_exporter;
pub mod json_exporter;
pub mod excel_exporter;
pub mod migrator;

use std::sync::Arc;
use tokio::sync::RwLock;

/// 导出格式
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportFormat {
    /// CSV 格式
    Csv,
    /// JSON 格式
    Json,
    /// Excel 格式
    Excel,
}

/// 导出状态
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExportStatus {
    /// 准备中
    Preparing,
    /// 导出中
    Exporting,
    /// 完成
    Completed,
    /// 失败
    Failed,
}

/// 迁移方向
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MigrationDirection {
    /// 导入
    Import,
    /// 导出
    Export,
}

/// 迁移状态
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MigrationStatus {
    /// 准备中
    Preparing,
    /// 进行中
    InProgress,
    /// 验证中
    Validating,
    /// 回滚中
    RollingBack,
    /// 完成
    Completed,
    /// 失败
    Failed,
    /// 已回滚
    RolledBack,
}

/// 导出与迁移状态
pub struct ExportMigrationState {
    /// 迁移器
    pub migrator: Arc<RwLock<migrator::DataMigrator>>,
}

impl Default for ExportMigrationState {
    fn default() -> Self {
        Self::new()
    }
}

impl ExportMigrationState {
    /// 创建新的导出迁移状态
    pub fn new() -> Self {
        Self {
            migrator: Arc::new(RwLock::new(migrator::DataMigrator::new())),
        }
    }
}
