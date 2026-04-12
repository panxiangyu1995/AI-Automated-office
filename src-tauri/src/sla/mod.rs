//! SLA 与运维监控模块
//!
//! 提供 SLA 指标收集、告警规则、运维看板和报告生成功能

pub mod metrics;
pub mod alerts;
pub mod dashboard;
pub mod reporter;

use std::sync::Arc;
use tokio::sync::RwLock;

/// SLA 监控状态
pub struct SlaMonitoringState {
    /// 指标收集器
    pub metrics_collector: Arc<RwLock<metrics::MetricsCollector>>,
    /// 告警引擎
    pub alert_engine: Arc<RwLock<alerts::AlertEngine>>,
    /// 运维看板
    pub dashboard: Arc<RwLock<dashboard::SlaDashboard>>,
    /// SLA 报告生成器
    pub reporter: Arc<RwLock<reporter::SlaReporter>>,
}

impl Default for SlaMonitoringState {
    fn default() -> Self {
        Self::new()
    }
}

impl SlaMonitoringState {
    /// 创建新的 SLA 监控状态
    pub fn new() -> Self {
        Self {
            metrics_collector: Arc::new(RwLock::new(metrics::MetricsCollector::new())),
            alert_engine: Arc::new(RwLock::new(alerts::AlertEngine::new())),
            dashboard: Arc::new(RwLock::new(dashboard::SlaDashboard::new())),
            reporter: Arc::new(RwLock::new(reporter::SlaReporter::new())),
        }
    }
}
