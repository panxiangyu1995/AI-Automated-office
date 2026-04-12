//! SLA 监控 Tauri 命令
//!
//! 提供 SLA 指标收集、告警规则、运维看板和报告生成的 IPC 接口

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::sla::{
    metrics::{MetricsCollector, MetricType, AggregateType, MetricStatistics},
    alerts::{AlertEngine, AlertRule, AlertCondition, AlertSeverity, Alert},
    dashboard::{SlaDashboard, ServiceHealth, HealthStatus, DashboardTimeRange},
    reporter::{SlaReporter, SlaReport, ReportPeriod, ReportFormat},
    SlaMonitoringState,
};

// ============================================================================
// 指标收集命令
// ============================================================================

/// 记录指标
#[tauri::command]
pub async fn record_sla_metric(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    name: String,
    metric_type: String,
    value: f64,
    unit: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let collector = state.metrics_collector.write().await;
    
    let mtype = match metric_type.as_str() {
        "request_count" => MetricType::RequestCount,
        "response_time" => MetricType::ResponseTime,
        "error_count" => MetricType::ErrorCount,
        "availability" => MetricType::Availability,
        "cpu_usage" => MetricType::CpuUsage,
        "memory_usage" => MetricType::MemoryUsage,
        "disk_usage" => MetricType::DiskUsage,
        "network_traffic" => MetricType::NetworkTraffic,
        _ => MetricType::Custom,
    };
    
    collector.record(&name, mtype, value, &unit);
    Ok(())
}

/// 获取指标
#[tauri::command]
pub async fn get_sla_metric(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    name: String,
) -> Result<Option<crate::sla::metrics::SlaMetric>, String> {
    let state = state.read().await;
    let collector = state.metrics_collector.read().await;
    Ok(collector.get_metric(&name).cloned())
}

/// 获取所有指标
#[tauri::command]
pub async fn list_sla_metrics(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
) -> Result<Vec<crate::sla::metrics::SlaMetric>, String> {
    let state = state.read().await;
    let collector = state.metrics_collector.read().await;
    Ok(collector.get_all_metrics().iter().map(|m| (*m).clone()).collect())
}

/// 获取指标统计
#[tauri::command]
pub async fn get_metric_statistics(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    name: String,
) -> Result<Option<MetricStatistics>, String> {
    let state = state.read().await;
    let collector = state.metrics_collector.read().await;
    Ok(collector.get_statistics(&name))
}

/// 计算聚合值
#[tauri::command]
pub async fn calculate_metric_aggregate(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    name: String,
    aggregate_type: String,
) -> Result<Option<f64>, String> {
    let state = state.read().await;
    let collector = state.metrics_collector.read().await;
    
    let agg_type = match aggregate_type.as_str() {
        "sum" => AggregateType::Sum,
        "avg" => AggregateType::Avg,
        "min" => AggregateType::Min,
        "max" => AggregateType::Max,
        "count" => AggregateType::Count,
        "p50" => AggregateType::P50,
        "p95" => AggregateType::P95,
        "p99" => AggregateType::P99,
        _ => return Err(format!("Invalid aggregate type: {}", aggregate_type)),
    };
    
    Ok(collector.calculate_aggregate(&name, agg_type))
}

/// 重置指标
#[tauri::command]
pub async fn reset_sla_metric(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    name: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let collector = state.metrics_collector.write().await;
    collector.reset(&name);
    Ok(())
}

// ============================================================================
// 告警规则命令
// ============================================================================

/// 创建告警规则
#[tauri::command]
pub async fn create_alert_rule(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    name: String,
    metric_name: String,
    condition_type: String,
    threshold: f64,
    severity: String,
) -> Result<AlertRule, String> {
    let mut state = state.write().await;
    let engine = state.alert_engine.write().await;
    
    let condition = match condition_type.as_str() {
        "greater_than" => AlertCondition::GreaterThan { threshold },
        "less_than" => AlertCondition::LessThan { threshold },
        "equals" => AlertCondition::Equals { threshold },
        _ => return Err(format!("Invalid condition type: {}", condition_type)),
    };
    
    let sev = match severity.as_str() {
        "info" => AlertSeverity::Info,
        "warning" => AlertSeverity::Warning,
        "error" => AlertSeverity::Error,
        "critical" => AlertSeverity::Critical,
        _ => return Err(format!("Invalid severity: {}", severity)),
    };
    
    let rule = AlertRule::new(name, metric_name, condition, sev);
    engine.add_rule(rule.clone());
    
    Ok(rule)
}

/// 获取告警规则
#[tauri::command]
pub async fn get_alert_rules(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
) -> Result<Vec<AlertRule>, String> {
    let state = state.read().await;
    let engine = state.alert_engine.read().await;
    Ok(engine.get_all_rules().iter().map(|r| (*r).clone()).collect())
}

/// 删除告警规则
#[tauri::command]
pub async fn delete_alert_rule(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    rule_id: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let engine = state.alert_engine.write().await;
    engine.remove_rule(&rule_id)
        .ok_or_else(|| format!("Rule not found: {}", rule_id))?;
    Ok(())
}

/// 获取活跃告警
#[tauri::command]
pub async fn get_active_alerts(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
) -> Result<Vec<Alert>, String> {
    let state = state.read().await;
    let engine = state.alert_engine.read().await;
    Ok(engine.get_active_alerts().iter().map(|a| (*a).clone()).collect())
}

/// 确认告警
#[tauri::command]
pub async fn acknowledge_alert(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    alert_id: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let engine = state.alert_engine.write().await;
    engine.acknowledge_alert(&alert_id)
        .ok_or_else(|| format!("Alert not found: {}", alert_id))?;
    Ok(())
}

/// 解决告警
#[tauri::command]
pub async fn resolve_alert(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    alert_id: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let engine = state.alert_engine.write().await;
    engine.resolve_alert(&alert_id)
        .ok_or_else(|| format!("Alert not found: {}", alert_id))?;
    Ok(())
}

/// 获取告警统计
#[tauri::command]
pub async fn get_alert_statistics(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
) -> Result<crate::sla::alerts::AlertStatistics, String> {
    let state = state.read().await;
    let engine = state.alert_engine.read().await;
    Ok(engine.get_statistics())
}

// ============================================================================
// 运维看板命令
// ============================================================================

/// 添加服务健康数据
#[tauri::command]
pub async fn add_service_health(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    service_id: String,
    service_name: String,
    availability: f64,
    avg_response_time_ms: f64,
    error_rate: f64,
    sla_target: f64,
) -> Result<(), String> {
    let mut state = state.write().await;
    let dashboard = state.dashboard.write().await;
    
    let status = ServiceHealth::calculate_status(availability, sla_target);
    
    let health = ServiceHealth {
        service_id,
        service_name,
        status,
        availability,
        avg_response_time_ms,
        error_rate,
        last_checked: chrono::Utc::now(),
        sla_target,
    };
    
    dashboard.add_service_health(health);
    Ok(())
}

/// 获取运维看板数据
#[tauri::command]
pub async fn get_sla_dashboard_data(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    time_range: String,
) -> Result<crate::sla::dashboard::SlaDashboardData, String> {
    let state = state.read().await;
    let dashboard = state.dashboard.read().await;
    
    let range = match time_range.as_str() {
        "last_hour" => DashboardTimeRange::LastHour,
        "last_6_hours" => DashboardTimeRange::Last6Hours,
        "last_24_hours" => DashboardTimeRange::Last24Hours,
        "last_7_days" => DashboardTimeRange::Last7Days,
        "last_30_days" => DashboardTimeRange::Last30Days,
        _ => DashboardTimeRange::Last24Hours,
    };
    
    // 生成看板数据
    Ok(dashboard.generate_dashboard_data())
}

/// 获取健康统计摘要
#[tauri::command]
pub async fn get_health_summary(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
) -> Result<crate::sla::dashboard::HealthSummary, String> {
    let state = state.read().await;
    let dashboard = state.dashboard.read().await;
    Ok(dashboard.get_health_summary())
}

// ============================================================================
// SLA 报告命令
// ============================================================================

/// 生成 SLA 报告
#[tauri::command]
pub async fn generate_sla_report(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    service_id: String,
    service_name: String,
    period: String,
    sla_target: f64,
) -> Result<SlaReport, String> {
    let mut state = state.write().await;
    let reporter = state.reporter.write().await;
    
    let report_period = match period.as_str() {
        "hourly" => ReportPeriod::Hourly,
        "daily" => ReportPeriod::Daily,
        "weekly" => ReportPeriod::Weekly,
        "monthly" => ReportPeriod::Monthly,
        "quarterly" => ReportPeriod::Quarterly,
        "yearly" => ReportPeriod::Yearly,
        _ => return Err(format!("Invalid period: {}", period)),
    };
    
    let duration = report_period.get_duration();
    let now = chrono::Utc::now();
    let start_time = now - duration;
    
    let mut report = SlaReport::new(
        service_id.clone(),
        service_name,
        report_period,
        start_time,
        now,
    );
    report.sla_target = sla_target;
    report.meets_sla = report.availability >= sla_target;
    
    reporter.generate_report(report.clone());
    
    Ok(report)
}

/// 获取 SLA 报告列表
#[tauri::command]
pub async fn get_sla_reports(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
) -> Result<Vec<SlaReport>, String> {
    let state = state.read().await;
    let reporter = state.reporter.read().await;
    Ok(reporter.get_all_reports().to_vec())
}

/// 导出报告
#[tauri::command]
pub async fn export_sla_report(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
    report_id: String,
    format: String,
) -> Result<String, String> {
    let state = state.read().await;
    let reporter = state.reporter.read().await;
    
    match format.as_str() {
        "json" => reporter.export_as_json(&report_id)
            .ok_or_else(|| format!("Report not found: {}", report_id)),
        "csv" => reporter.export_as_csv(&report_id)
            .ok_or_else(|| format!("Report not found: {}", report_id)),
        _ => Err(format!("Invalid format: {}", format)),
    }
}

/// 获取报告统计摘要
#[tauri::command]
pub async fn get_reporter_summary(
    state: State<'_, Arc<RwLock<SlaMonitoringState>>>,
) -> Result<crate::sla::reporter::ReporterSummary, String> {
    let state = state.read().await;
    let reporter = state.reporter.read().await;
    Ok(reporter.get_summary())
}
