//! SLA 监控模块
//!
//! 提供服务可用性监控和 SLA 报告生成

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};

/// SLA 统计周期
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SlaPeriod {
    /// 小时
    Hourly,
    /// 每日
    Daily,
    /// 每周
    Weekly,
    /// 每月
    Monthly,
}

/// SLA 指标
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaMetrics {
    /// 服务 ID
    pub service_id: String,
    /// 可用率百分比
    pub uptime_percentage: f64,
    /// 总请求数
    pub total_requests: u64,
    /// 成功请求数
    pub successful_requests: u64,
    /// 失败请求数
    pub failed_requests: u64,
    /// 平均响应时间（毫秒）
    pub avg_response_time_ms: f64,
    /// 最大响应时间（毫秒）
    pub max_response_time_ms: u64,
    /// 最小响应时间（毫秒）
    pub min_response_time_ms: u64,
    /// 统计开始时间
    pub period_start: DateTime<Utc>,
    /// 统计结束时间
    pub period_end: DateTime<Utc>,
}

impl SlaMetrics {
    /// 创建新的 SLA 指标
    pub fn new(service_id: String, period_start: DateTime<Utc>, period_end: DateTime<Utc>) -> Self {
        Self {
            service_id,
            uptime_percentage: 100.0,
            total_requests: 0,
            successful_requests: 0,
            failed_requests: 0,
            avg_response_time_ms: 0.0,
            max_response_time_ms: 0,
            min_response_time_ms: u64::MAX,
            period_start,
            period_end,
        }
    }

    /// 计算可用率
    pub fn calculate_uptime(&mut self) {
        if self.total_requests > 0 {
            self.uptime_percentage = (self.successful_requests as f64 / self.total_requests as f64) * 100.0;
        }
    }
}

/// SLA 报告
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaReport {
    /// 服务 ID
    pub service_id: String,
    /// 统计周期
    pub period: SlaPeriod,
    /// 可用率百分比
    pub uptime_percentage: f64,
    /// 总请求数
    pub total_requests: u64,
    /// 失败请求数
    pub failed_requests: u64,
    /// 平均响应时间（毫秒）
    pub avg_response_time_ms: f64,
    /// 最大响应时间（毫秒）
    pub max_response_time_ms: u64,
    /// 统计开始时间
    pub period_start: DateTime<Utc>,
    /// 统计结束时间
    pub period_end: DateTime<Utc>,
    /// 报告生成时间
    pub generated_at: DateTime<Utc>,
    /// 是否满足 SLA
    pub meets_sla: bool,
    /// SLA 目标
    pub sla_target: f64,
}

impl SlaReport {
    /// 从指标生成报告
    pub fn from_metrics(metrics: &SlaMetrics, period: SlaPeriod, sla_target: f64) -> Self {
        Self {
            service_id: metrics.service_id.clone(),
            period,
            uptime_percentage: metrics.uptime_percentage,
            total_requests: metrics.total_requests,
            failed_requests: metrics.failed_requests,
            avg_response_time_ms: metrics.avg_response_time_ms,
            max_response_time_ms: metrics.max_response_time_ms,
            period_start: metrics.period_start,
            period_end: metrics.period_end,
            generated_at: Utc::now(),
            meets_sla: metrics.uptime_percentage >= sla_target,
            sla_target,
        }
    }
}

/// SLA 告警配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaAlertConfig {
    /// 服务 ID
    pub service_id: String,
    /// 告警阈值
    pub uptime_threshold: f64,
    /// 响应时间阈值（毫秒）
    pub response_time_threshold_ms: u64,
    /// 是否启用
    pub enabled: bool,
}

impl Default for SlaAlertConfig {
    fn default() -> Self {
        Self {
            service_id: String::new(),
            uptime_threshold: 99.9,
            response_time_threshold_ms: 1000,
            enabled: true,
        }
    }
}

/// SLA 告警
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaAlert {
    /// 告警 ID
    pub alert_id: String,
    /// 服务 ID
    pub service_id: String,
    /// 告警类型
    pub alert_type: SlaAlertType,
    /// 告警消息
    pub message: String,
    /// 当前值
    pub current_value: f64,
    /// 阈值
    pub threshold: f64,
    /// 发生时间
    pub timestamp: DateTime<Utc>,
    /// 是否已解决
    pub resolved: bool,
}

/// SLA 告警类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SlaAlertType {
    /// 可用率低
    LowUptime,
    /// 响应时间长
    HighLatency,
    /// 失败率高
    HighFailureRate,
}

/// SLA 监控器
pub struct SlaMonitor {
    /// 服务指标
    metrics: HashMap<String, SlaMetrics>,
    /// 指标历史
    metrics_history: HashMap<String, VecDeque<SlaMetrics>>,
    /// 告警配置
    alert_configs: HashMap<String, SlaAlertConfig>,
    /// 告警历史
    alerts: VecDeque<SlaAlert>,
    /// SLA 目标
    sla_target: f64,
    /// 历史保留条数
    max_history_size: usize,
}

impl SlaMonitor {
    /// 创建新的 SLA 监控器
    pub fn new() -> Self {
        Self {
            metrics: HashMap::new(),
            metrics_history: HashMap::new(),
            alert_configs: HashMap::new(),
            alerts: VecDeque::new(),
            sla_target: 99.9,
            max_history_size: 100,
        }
    }

    /// 创建带有 SLA 目标的监控器
    pub fn with_target(sla_target: f64) -> Self {
        let mut monitor = Self::new();
        monitor.sla_target = sla_target;
        monitor
    }

    /// 记录请求
    pub fn record_request(&mut self, service_id: &str, success: bool, response_time_ms: u64) {
        let metrics = self.metrics.entry(service_id.to_string())
            .or_insert_with(|| {
                SlaMetrics::new(
                    service_id.to_string(),
                    Utc::now() - Duration::hours(1),
                    Utc::now(),
                )
            });

        metrics.total_requests += 1;
        if success {
            metrics.successful_requests += 1;
        } else {
            metrics.failed_requests += 1;
        }

        // 更新响应时间统计
        if metrics.total_requests == 1 {
            metrics.avg_response_time_ms = response_time_ms as f64;
        } else {
            let total = metrics.avg_response_time_ms * (metrics.total_requests - 1) as f64;
            metrics.avg_response_time_ms = (total + response_time_ms as f64) / metrics.total_requests as f64;
        }
        metrics.max_response_time_ms = metrics.max_response_time_ms.max(response_time_ms);
        metrics.min_response_time_ms = metrics.min_response_time_ms.min(response_time_ms);

        // 检查是否需要告警
        self.check_alerts(service_id);
    }

    /// 获取服务指标
    pub fn get_metrics(&self, service_id: &str) -> Option<&SlaMetrics> {
        self.metrics.get(service_id)
    }

    /// 获取所有服务指标
    pub fn get_all_metrics(&self) -> Vec<&SlaMetrics> {
        self.metrics.values().collect()
    }

    /// 获取 SLA 报告
    pub fn get_report(&self, service_id: &str, period: SlaPeriod) -> Option<SlaReport> {
        let metrics = self.metrics.get(service_id)?;
        Some(SlaReport::from_metrics(metrics, period, self.sla_target))
    }

    /// 获取所有 SLA 报告
    pub fn get_all_reports(&self, period: SlaPeriod) -> Vec<SlaReport> {
        self.metrics.values()
            .map(|m| SlaReport::from_metrics(m, period, self.sla_target))
            .collect()
    }

    /// 获取指标历史
    pub fn get_history(&self, service_id: &str) -> Vec<&SlaMetrics> {
        self.metrics_history.get(service_id)
            .map(|h| h.iter().collect())
            .unwrap_or_default()
    }

    /// 设置 SLA 目标
    pub fn set_sla_target(&mut self, target: f64) {
        self.sla_target = target;
    }

    /// 获取 SLA 目标
    pub fn get_sla_target(&self) -> f64 {
        self.sla_target
    }

    /// 配置告警
    pub fn configure_alert(&mut self, config: SlaAlertConfig) {
        self.alert_configs.insert(config.service_id.clone(), config);
    }

    /// 移除告警配置
    pub fn remove_alert_config(&mut self, service_id: &str) {
        self.alert_configs.remove(service_id);
    }

    /// 获取告警配置
    pub fn get_alert_config(&self, service_id: &str) -> Option<&SlaAlertConfig> {
        self.alert_configs.get(service_id)
    }

    /// 获取所有告警
    pub fn get_alerts(&self, include_resolved: bool) -> Vec<&SlaAlert> {
        if include_resolved {
            self.alerts.iter().collect()
        } else {
            self.alerts.iter().filter(|a| !a.resolved).collect()
        }
    }

    /// 解决告警
    pub fn resolve_alert(&mut self, alert_id: &str) -> Option<()> {
        if let Some(alert) = self.alerts.iter_mut().find(|a| a.alert_id == *alert_id) {
            alert.resolved = true;
            Some(())
        } else {
            None
        }
    }

    /// 检查是否需要告警
    fn check_alerts(&mut self, service_id: &str) {
        let config = match self.alert_configs.get(service_id).cloned() {
            Some(c) => c,
            None => return,
        };

        if !config.enabled {
            return;
        }

        let metrics = match self.metrics.get(service_id).cloned() {
            Some(m) => m,
            None => return,
        };

        // 检查可用率
        if metrics.uptime_percentage < config.uptime_threshold {
            self.create_alert(
                service_id,
                SlaAlertType::LowUptime,
                format!(
                    "Service {} uptime ({:.2}%) is below threshold ({:.2}%)",
                    service_id,
                    metrics.uptime_percentage,
                    config.uptime_threshold
                ),
                metrics.uptime_percentage,
                config.uptime_threshold,
            );
        }

        // 检查响应时间
        if metrics.avg_response_time_ms > config.response_time_threshold_ms as f64 {
            self.create_alert(
                service_id,
                SlaAlertType::HighLatency,
                format!(
                    "Service {} response time ({:.2}ms) exceeds threshold ({}ms)",
                    service_id,
                    metrics.avg_response_time_ms,
                    config.response_time_threshold_ms
                ),
                metrics.avg_response_time_ms,
                config.response_time_threshold_ms as f64,
            );
        }
    }

    /// 创建告警
    fn create_alert(
        &mut self,
        service_id: &str,
        alert_type: SlaAlertType,
        message: String,
        current_value: f64,
        threshold: f64,
    ) {
        // 检查是否已有相同的未解决告警
        if self.alerts.iter().any(|a| {
            !a.resolved
            && a.service_id == service_id
            && a.alert_type == alert_type
        }) {
            return;
        }

        let alert = SlaAlert {
            alert_id: format!("alert-{}", uuid::Uuid::new_v4()),
            service_id: service_id.to_string(),
            alert_type,
            message,
            current_value,
            threshold,
            timestamp: Utc::now(),
            resolved: false,
        };

        self.alerts.push_front(alert);

        // 保留历史
        while self.alerts.len() > self.max_history_size {
            self.alerts.pop_back();
        }
    }

    /// 重置服务指标
    pub fn reset_metrics(&mut self, service_id: &str) {
        if let Some(metrics) = self.metrics.get_mut(service_id) {
            *metrics = SlaMetrics::new(
                service_id.to_string(),
                Utc::now() - Duration::hours(1),
                Utc::now(),
            );
        }
    }

    /// 获取 SLA 统计摘要
    pub fn get_summary(&self) -> SlaSummary {
        let total_services = self.metrics.len();
        let meeting_sla = self.metrics.values()
            .filter(|m| m.uptime_percentage >= self.sla_target)
            .count();
        let total_requests: u64 = self.metrics.values().map(|m| m.total_requests).sum();
        let failed_requests: u64 = self.metrics.values().map(|m| m.failed_requests).sum();

        SlaSummary {
            total_services,
            services_meeting_sla: meeting_sla,
            services_below_sla: total_services - meeting_sla,
            sla_target: self.sla_target,
            total_requests,
            failed_requests,
            overall_uptime: if total_requests > 0 {
                ((total_requests - failed_requests) as f64 / total_requests as f64) * 100.0
            } else {
                100.0
            },
        }
    }
}

impl Default for SlaMonitor {
    fn default() -> Self {
        Self::new()
    }
}

/// SLA 统计摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaSummary {
    /// 总服务数
    pub total_services: usize,
    /// 满足 SLA 的服务数
    pub services_meeting_sla: usize,
    /// 不满足 SLA 的服务数
    pub services_below_sla: usize,
    /// SLA 目标
    pub sla_target: f64,
    /// 总请求数
    pub total_requests: u64,
    /// 失败请求数
    pub failed_requests: u64,
    /// 整体可用率
    pub overall_uptime: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_record_request() {
        let mut monitor = SlaMonitor::new();
        
        monitor.record_request("service-1", true, 100);
        monitor.record_request("service-1", true, 200);
        monitor.record_request("service-1", false, 50);
        
        let metrics = monitor.get_metrics("service-1").unwrap();
        assert_eq!(metrics.total_requests, 3);
        assert_eq!(metrics.successful_requests, 2);
        assert_eq!(metrics.failed_requests, 1);
    }

    #[test]
    fn test_sla_report() {
        let mut monitor = SlaMonitor::with_target(99.0);
        
        monitor.record_request("service-1", true, 100);
        monitor.record_request("service-1", true, 100);
        
        let report = monitor.get_report("service-1", SlaPeriod::Hourly).unwrap();
        assert_eq!(report.uptime_percentage, 100.0);
        assert!(report.meets_sla);
    }

    #[test]
    fn test_alert_config() {
        let mut monitor = SlaMonitor::new();
        
        let config = SlaAlertConfig {
            service_id: "service-1".to_string(),
            uptime_threshold: 99.0,
            response_time_threshold_ms: 1000,
            enabled: true,
        };
        
        monitor.configure_alert(config);
        
        // 记录一些失败的请求
        for _ in 0..100 {
            monitor.record_request("service-1", false, 100);
        }
        
        let alerts = monitor.get_alerts(false);
        assert!(!alerts.is_empty());
    }

    #[test]
    fn test_summary() {
        let mut monitor = SlaMonitor::with_target(99.0);
        
        monitor.record_request("service-1", true, 100);
        monitor.record_request("service-2", true, 100);
        
        let summary = monitor.get_summary();
        assert_eq!(summary.total_services, 2);
        assert_eq!(summary.services_meeting_sla, 2);
    }
}
