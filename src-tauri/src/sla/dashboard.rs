//! SLA 运维看板模块
//!
//! 提供运维指标和 SLA 状态的聚合展示功能

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 看板数据刷新间隔
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DashboardRefreshInterval {
    /// 实时（5秒）
    RealTime,
    /// 每分钟
    Minute,
    /// 每5分钟
    FiveMinutes,
    /// 每小时
    Hourly,
}

impl DashboardRefreshInterval {
    /// 获取间隔秒数
    pub fn as_secs(&self) -> u64 {
        match self {
            DashboardRefreshInterval::RealTime => 5,
            DashboardRefreshInterval::Minute => 60,
            DashboardRefreshInterval::FiveMinutes => 300,
            DashboardRefreshInterval::Hourly => 3600,
        }
    }
}

/// 看板数据时间范围
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DashboardTimeRange {
    /// 最近1小时
    LastHour,
    /// 最近6小时
    Last6Hours,
    /// 最近24小时
    Last24Hours,
    /// 最近7天
    Last7Days,
    /// 最近30天
    Last30Days,
}

impl DashboardTimeRange {
    /// 获取时间范围
    pub fn get_range(&self) -> (DateTime<Utc>, DateTime<Utc>) {
        let now = Utc::now();
        let start = match self {
            DashboardTimeRange::LastHour => now - Duration::hours(1),
            DashboardTimeRange::Last6Hours => now - Duration::hours(6),
            DashboardTimeRange::Last24Hours => now - Duration::hours(24),
            DashboardTimeRange::Last7Days => now - Duration::days(7),
            DashboardTimeRange::Last30Days => now - Duration::days(30),
        };
        (start, now)
    }
}

/// 服务健康状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum HealthStatus {
    /// 健康
    Healthy,
    /// 降级
    Degraded,
    /// 故障
    Unhealthy,
    /// 未知
    Unknown,
}

/// 服务健康信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceHealth {
    /// 服务 ID
    pub service_id: String,
    /// 服务名称
    pub service_name: String,
    /// 健康状态
    pub status: HealthStatus,
    /// 可用率
    pub availability: f64,
    /// 平均响应时间
    pub avg_response_time_ms: f64,
    /// 错误率
    pub error_rate: f64,
    /// 最后检查时间
    pub last_checked: DateTime<Utc>,
    /// SLA 目标
    pub sla_target: f64,
}

impl ServiceHealth {
    /// 根据指标计算健康状态
    pub fn calculate_status(availability: f64, sla_target: f64) -> HealthStatus {
        if availability >= sla_target {
            HealthStatus::Healthy
        } else if availability >= sla_target - 0.5 {
            HealthStatus::Degraded
        } else {
            HealthStatus::Unhealthy
        }
    }
}

/// 看板指标卡片
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricCard {
    /// 卡片 ID
    pub card_id: String,
    /// 标题
    pub title: String,
    /// 当前值
    pub current_value: f64,
    /// 单位
    pub unit: String,
    /// 变化率
    pub change_rate: f64,
    /// 变化趋势
    pub trend: Trend,
    /// 状态
    pub status: HealthStatus,
}

/// 趋势
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Trend {
    Up,
    Down,
    Stable,
}

/// 事件记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Incident {
    /// 事件 ID
    pub incident_id: String,
    /// 事件类型
    pub incident_type: String,
    /// 服务名称
    pub service_name: String,
    /// 开始时间
    pub started_at: DateTime<Utc>,
    /// 结束时间
    pub ended_at: Option<DateTime<Utc>>,
    /// 影响范围
    pub impact: String,
    /// 状态
    pub status: String,
    /// 描述
    pub description: String,
}

/// SLA 看板数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SlaDashboardData {
    /// 看板 ID
    pub dashboard_id: String,
    /// 服务健康列表
    pub service_healths: Vec<ServiceHealth>,
    /// 指标卡片列表
    pub metric_cards: Vec<MetricCard>,
    /// 事件列表
    pub recent_incidents: Vec<Incident>,
    /// 整体健康状态
    pub overall_health: HealthStatus,
    /// 整体可用率
    pub overall_availability: f64,
    /// 整体 SLA 达成率
    pub overall_sla_achievement: f64,
    /// 数据时间范围
    pub time_range: String,
    /// 刷新时间
    pub refreshed_at: DateTime<Utc>,
}

/// SLA 看板
pub struct SlaDashboard {
    /// 服务健康数据
    service_healths: HashMap<String, ServiceHealth>,
    /// 指标卡片配置
    metric_cards: Vec<MetricCard>,
    /// 事件记录
    incidents: Vec<Incident>,
    /// SLA 目标配置
    sla_targets: HashMap<String, f64>,
    /// 当前时间范围
    current_time_range: DashboardTimeRange,
}

impl SlaDashboard {
    /// 创建新的 SLA 看板
    pub fn new() -> Self {
        Self {
            service_healths: HashMap::new(),
            metric_cards: Vec::new(),
            incidents: Vec::new(),
            sla_targets: HashMap::new(),
            current_time_range: DashboardTimeRange::Last24Hours,
        }
    }

    /// 添加服务健康数据
    pub fn add_service_health(&mut self, health: ServiceHealth) {
        self.service_healths.insert(health.service_id.clone(), health);
    }

    /// 更新服务健康数据
    pub fn update_service_health(&mut self, health: ServiceHealth) -> Option<()> {
        if self.service_healths.contains_key(&health.service_id) {
            self.service_healths.insert(health.service_id, health);
            Some(())
        } else {
            None
        }
    }

    /// 移除服务健康数据
    pub fn remove_service_health(&mut self, service_id: &str) -> Option<ServiceHealth> {
        self.service_healths.remove(service_id)
    }

    /// 获取服务健康数据
    pub fn get_service_health(&self, service_id: &str) -> Option<&ServiceHealth> {
        self.service_healths.get(service_id)
    }

    /// 获取所有服务健康数据
    pub fn get_all_service_healths(&self) -> Vec<&ServiceHealth> {
        self.service_healths.values().collect()
    }

    /// 添加指标卡片
    pub fn add_metric_card(&mut self, card: MetricCard) {
        self.metric_cards.push(card);
    }

    /// 移除指标卡片
    pub fn remove_metric_card(&mut self, card_id: &str) -> Option<MetricCard> {
        let index = self.metric_cards.iter().position(|c| c.card_id == card_id);
        index.map(|i| self.metric_cards.remove(i))
    }

    /// 获取所有指标卡片
    pub fn get_metric_cards(&self) -> &[MetricCard] {
        &self.metric_cards
    }

    /// 添加事件
    pub fn add_incident(&mut self, incident: Incident) {
        self.incidents.push(incident);
    }

    /// 解决事件
    pub fn resolve_incident(&mut self, incident_id: &str) -> Option<()> {
        if let Some(incident) = self.incidents.iter_mut().find(|i| i.incident_id == incident_id) {
            incident.ended_at = Some(Utc::now());
            incident.status = "resolved".to_string();
            Some(())
        } else {
            None
        }
    }

    /// 获取事件列表
    pub fn get_incidents(&self, limit: Option<usize>) -> Vec<&Incident> {
        let limit = limit.unwrap_or(10);
        self.incidents.iter().take(limit).collect()
    }

    /// 设置 SLA 目标
    pub fn set_sla_target(&mut self, service_id: &str, target: f64) {
        self.sla_targets.insert(service_id.to_string(), target);
    }

    /// 获取 SLA 目标
    pub fn get_sla_target(&self, service_id: &str) -> f64 {
        self.sla_targets.get(service_id).copied().unwrap_or(99.9)
    }

    /// 设置时间范围
    pub fn set_time_range(&mut self, range: DashboardTimeRange) {
        self.current_time_range = range;
    }

    /// 获取当前时间范围
    pub fn get_time_range(&self) -> DashboardTimeRange {
        self.current_time_range
    }

    /// 生成看板数据
    pub fn generate_dashboard_data(&self) -> SlaDashboardData {
        let service_healths: Vec<ServiceHealth> = self.service_healths.values().cloned().collect();
        
        // 计算整体可用率
        let overall_availability = if service_healths.is_empty() {
            100.0
        } else {
            let sum: f64 = service_healths.iter().map(|h| h.availability).sum();
            sum / service_healths.len() as f64
        };

        // 计算整体健康状态
        let overall_health = ServiceHealth::calculate_status(
            overall_availability,
            *self.sla_targets.values().next().unwrap_or(&99.9)
        );

        // 计算 SLA 达成率
        let overall_sla_achievement = if service_healths.is_empty() {
            100.0
        } else {
            let met_count = service_healths.iter()
                .filter(|h| h.availability >= h.sla_target)
                .count();
            (met_count as f64 / service_healths.len() as f64) * 100.0
        };

        SlaDashboardData {
            dashboard_id: uuid::Uuid::new_v4().to_string(),
            service_healths,
            metric_cards: self.metric_cards.clone(),
            recent_incidents: self.incidents.iter().take(10).cloned().collect(),
            overall_health,
            overall_availability,
            overall_sla_achievement,
            time_range: format!("{:?}", self.current_time_range),
            refreshed_at: Utc::now(),
        }
    }

    /// 获取服务健康统计
    pub fn get_health_summary(&self) -> HealthSummary {
        let services: Vec<&ServiceHealth> = self.service_healths.values().collect();
        
        let healthy_count = services.iter().filter(|s| s.status == HealthStatus::Healthy).count();
        let degraded_count = services.iter().filter(|s| s.status == HealthStatus::Degraded).count();
        let unhealthy_count = services.iter().filter(|s| s.status == HealthStatus::Unhealthy).count();

        HealthSummary {
            total_services: services.len(),
            healthy_count,
            degraded_count,
            unhealthy_count,
            unknown_count: services.len() - healthy_count - degraded_count - unhealthy_count,
        }
    }
}

impl Default for SlaDashboard {
    fn default() -> Self {
        Self::new()
    }
}

/// 健康统计摘要
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthSummary {
    /// 总服务数
    pub total_services: usize,
    /// 健康服务数
    pub healthy_count: usize,
    /// 降级服务数
    pub degraded_count: usize,
    /// 故障服务数
    pub unhealthy_count: usize,
    /// 未知服务数
    pub unknown_count: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_and_get_service_health() {
        let mut dashboard = SlaDashboard::new();
        
        let health = ServiceHealth {
            service_id: "svc-1".to_string(),
            service_name: "API Service".to_string(),
            status: HealthStatus::Healthy,
            availability: 99.9,
            avg_response_time_ms: 50.0,
            error_rate: 0.1,
            last_checked: Utc::now(),
            sla_target: 99.5,
        };
        
        dashboard.add_service_health(health);
        
        let retrieved = dashboard.get_service_health("svc-1").unwrap();
        assert_eq!(retrieved.service_name, "API Service");
    }

    #[test]
    fn test_health_summary() {
        let mut dashboard = SlaDashboard::new();
        
        let health1 = ServiceHealth {
            service_id: "svc-1".to_string(),
            service_name: "Service 1".to_string(),
            status: HealthStatus::Healthy,
            availability: 99.9,
            avg_response_time_ms: 50.0,
            error_rate: 0.1,
            last_checked: Utc::now(),
            sla_target: 99.5,
        };
        
        dashboard.add_service_health(health1);
        
        let summary = dashboard.get_health_summary();
        assert_eq!(summary.total_services, 1);
        assert_eq!(summary.healthy_count, 1);
    }

    #[test]
    fn test_generate_dashboard_data() {
        let dashboard = SlaDashboard::new();
        let data = dashboard.generate_dashboard_data();
        
        assert_eq!(data.overall_availability, 100.0);
        assert_eq!(data.overall_health, HealthStatus::Healthy);
    }
}
