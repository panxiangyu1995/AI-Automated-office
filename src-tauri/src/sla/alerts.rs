//! SLA 告警规则模块
//!
//! 提供告警规则定义、评估和通知功能

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use uuid::Uuid;

/// 告警级别
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AlertSeverity {
    /// 信息
    Info,
    /// 警告
    Warning,
    /// 错误
    Error,
    /// 严重
    Critical,
}

impl AlertSeverity {
    /// 获取优先级（数值越高优先级越高）
    pub fn priority(&self) -> u8 {
        match self {
            AlertSeverity::Info => 0,
            AlertSeverity::Warning => 1,
            AlertSeverity::Error => 2,
            AlertSeverity::Critical => 3,
        }
    }
}

/// 告警条件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AlertCondition {
    /// 大于
    GreaterThan { threshold: f64 },
    /// 小于
    LessThan { threshold: f64 },
    /// 等于
    Equals { threshold: f64 },
    /// 在范围内
    InRange { min: f64, max: f64 },
    /// 不在范围内
    OutOfRange { min: f64, max: f64 },
    /// 变化率超过
    ChangeRateExceeds { percentage: f64 },
}

/// 告警规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlertRule {
    /// 规则 ID
    pub id: String,
    /// 规则名称
    pub name: String,
    /// 规则描述
    pub description: String,
    /// 监控的指标名称
    pub metric_name: String,
    /// 告警条件
    pub condition: AlertCondition,
    /// 告警级别
    pub severity: AlertSeverity,
    /// 是否启用
    pub enabled: bool,
    /// 冷却时间（秒）
    pub cooldown_secs: u64,
    /// 创建时间
    pub created_at: DateTime<Utc>,
    /// 最后触发时间
    pub last_triggered: Option<DateTime<Utc>>,
}

impl AlertRule {
    /// 创建新的告警规则
    pub fn new(name: String, metric_name: String, condition: AlertCondition, severity: AlertSeverity) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description: String::new(),
            metric_name,
            condition,
            severity,
            enabled: true,
            cooldown_secs: 300, // 默认 5 分钟冷却
            created_at: Utc::now(),
            last_triggered: None,
        }
    }

    /// 检查条件是否满足
    pub fn evaluate(&self, value: f64) -> bool {
        match &self.condition {
            AlertCondition::GreaterThan { threshold } => value > *threshold,
            AlertCondition::LessThan { threshold } => value < *threshold,
            AlertCondition::Equals { threshold } => (value - threshold).abs() < f64::EPSILON,
            AlertCondition::InRange { min, max } => value >= *min && value <= *max,
            AlertCondition::OutOfRange { min, max } => value < *min || value > *max,
            AlertCondition::ChangeRateExceeds { percentage } => {
                // 简化实现：实际应该比较历史值
                false
            }
        }
    }

    /// 检查是否在冷却期
    pub fn is_in_cooldown(&self) -> bool {
        if let Some(last) = self.last_triggered {
            let elapsed = (Utc::now() - last).num_seconds() as u64;
            elapsed < self.cooldown_secs
        } else {
            false
        }
    }

    /// 标记为已触发
    pub fn mark_triggered(&mut self) {
        self.last_triggered = Some(Utc::now());
    }
}

/// 告警
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Alert {
    /// 告警 ID
    pub id: String,
    /// 关联的规则 ID
    pub rule_id: String,
    /// 规则名称
    pub rule_name: String,
    /// 告警级别
    pub severity: AlertSeverity,
    /// 告警消息
    pub message: String,
    /// 触发时的指标值
    pub metric_value: f64,
    /// 阈值
    pub threshold: f64,
    /// 触发时间
    pub triggered_at: DateTime<Utc>,
    /// 确认时间
    pub acknowledged_at: Option<DateTime<Utc>>,
    /// 解决时间
    pub resolved_at: Option<DateTime<Utc>>,
    /// 是否已确认
    pub acknowledged: bool,
    /// 是否已解决
    pub resolved: bool,
}

impl Alert {
    /// 创建新的告警
    pub fn new(rule: &AlertRule, metric_value: f64) -> Self {
        let threshold = match &rule.condition {
            AlertCondition::GreaterThan { threshold } => *threshold,
            AlertCondition::LessThan { threshold } => *threshold,
            AlertCondition::Equals { threshold } => *threshold,
            AlertCondition::InRange { min, .. } => *min,
            AlertCondition::OutOfRange { min, .. } => *min,
            AlertCondition::ChangeRateExceeds { percentage } => *percentage,
        };

        Self {
            id: Uuid::new_v4().to_string(),
            rule_id: rule.id.clone(),
            rule_name: rule.name.clone(),
            severity: rule.severity,
            message: format!("Alert '{}' triggered: {} (value: {}, threshold: {})", 
                rule.name, 
                rule.description,
                metric_value,
                threshold
            ),
            metric_value,
            threshold,
            triggered_at: Utc::now(),
            acknowledged_at: None,
            resolved_at: None,
            acknowledged: false,
            resolved: false,
        }
    }

    /// 确认告警
    pub fn acknowledge(&mut self) {
        self.acknowledged = true;
        self.acknowledged_at = Some(Utc::now());
    }

    /// 解决告警
    pub fn resolve(&mut self) {
        self.resolved = true;
        self.resolved_at = Some(Utc::now());
    }
}

/// 告警历史
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlertHistory {
    /// 历史记录
    pub alerts: VecDeque<Alert>,
    /// 最大记录数
    max_size: usize,
}

impl AlertHistory {
    /// 创建新的告警历史
    pub fn new(max_size: usize) -> Self {
        Self {
            alerts: VecDeque::new(),
            max_size,
        }
    }

    /// 添加告警
    pub fn push(&mut self, alert: Alert) {
        self.alerts.push_front(alert);
        while self.alerts.len() > self.max_size {
            self.alerts.pop_back();
        }
    }

    /// 获取所有告警
    pub fn get_all(&self) -> Vec<&Alert> {
        self.alerts.iter().collect()
    }

    /// 获取未解决的告警
    pub fn get_unresolved(&self) -> Vec<&Alert> {
        self.alerts.iter().filter(|a| !a.resolved).collect()
    }

    /// 获取指定级别的告警
    pub fn get_by_severity(&self, severity: AlertSeverity) -> Vec<&Alert> {
        self.alerts.iter().filter(|a| a.severity == severity).collect()
    }
}

/// 告警引擎
pub struct AlertEngine {
    /// 告警规则
    rules: HashMap<String, AlertRule>,
    /// 告警历史
    history: AlertHistory,
    /// 活跃告警
    active_alerts: HashMap<String, Alert>,
}

impl AlertEngine {
    /// 创建新的告警引擎
    pub fn new() -> Self {
        Self {
            rules: HashMap::new(),
            history: AlertHistory::new(1000),
            active_alerts: HashMap::new(),
        }
    }

    /// 添加告警规则
    pub fn add_rule(&mut self, rule: AlertRule) {
        self.rules.insert(rule.id.clone(), rule);
    }

    /// 移除告警规则
    pub fn remove_rule(&mut self, rule_id: &str) -> Option<AlertRule> {
        self.rules.remove(rule_id)
    }

    /// 获取告警规则
    pub fn get_rule(&self, rule_id: &str) -> Option<&AlertRule> {
        self.rules.get(rule_id)
    }

    /// 获取所有告警规则
    pub fn get_all_rules(&self) -> Vec<&AlertRule> {
        self.rules.values().collect()
    }

    /// 获取启用的告警规则
    pub fn get_enabled_rules(&self) -> Vec<&AlertRule> {
        self.rules.values().filter(|r| r.enabled).collect()
    }

    /// 启用/禁用规则
    pub fn set_rule_enabled(&mut self, rule_id: &str, enabled: bool) -> Option<()> {
        if let Some(rule) = self.rules.get_mut(rule_id) {
            rule.enabled = enabled;
            Some(())
        } else {
            None
        }
    }

    /// 评估指标
    pub fn evaluate(&mut self, metric_name: &str, value: f64) -> Vec<Alert> {
        let mut triggered = Vec::new();

        for rule in self.rules.values_mut() {
            if !rule.enabled || rule.metric_name != metric_name {
                continue;
            }

            if rule.is_in_cooldown() {
                continue;
            }

            if rule.evaluate(value) {
                let alert = Alert::new(rule, value);
                rule.mark_triggered();
                triggered.push(alert.clone());
                self.active_alerts.insert(alert.id.clone(), alert.clone());
                self.history.push(alert);
            }
        }

        triggered
    }

    /// 获取活跃告警
    pub fn get_active_alerts(&self) -> Vec<&Alert> {
        self.active_alerts.values().collect()
    }

    /// 获取活跃告警（按级别）
    pub fn get_active_alerts_by_severity(&self, severity: AlertSeverity) -> Vec<&Alert> {
        self.active_alerts.values()
            .filter(|a| a.severity == severity)
            .collect()
    }

    /// 确认告警
    pub fn acknowledge_alert(&mut self, alert_id: &str) -> Option<()> {
        if let Some(alert) = self.active_alerts.get_mut(alert_id) {
            alert.acknowledge();
            Some(())
        } else {
            None
        }
    }

    /// 解决告警
    pub fn resolve_alert(&mut self, alert_id: &str) -> Option<()> {
        if let Some(alert) = self.active_alerts.get_mut(alert_id) {
            alert.resolve();
            self.active_alerts.remove(alert_id);
            Some(())
        } else {
            None
        }
    }

    /// 检查告警是否已解决（指标恢复正常）
    pub fn check_resolved(&mut self, metric_name: &str, value: f64) -> Vec<String> {
        let mut resolved_ids = Vec::new();

        for (alert_id, alert) in self.active_alerts.iter_mut() {
            let rule = match self.rules.get(&alert.rule_id) {
                Some(r) => r,
                None => continue,
            };

            if rule.metric_name != metric_name {
                continue;
            }

            // 如果条件不再满足，则解决告警
            if !rule.evaluate(value) {
                alert.resolve();
                resolved_ids.push(alert_id.clone());
            }
        }

        // 移除已解决的告警
        for id in &resolved_ids {
            self.active_alerts.remove(id);
        }

        resolved_ids
    }

    /// 获取告警历史
    pub fn get_history(&self, limit: Option<usize>) -> Vec<&Alert> {
        let limit = limit.unwrap_or(100);
        self.history.get_all().into_iter().take(limit).collect()
    }

    /// 获取统计信息
    pub fn get_statistics(&self) -> AlertStatistics {
        let total = self.active_alerts.len();
        let by_severity: HashMap<String, usize> = self.active_alerts.values()
            .fold(HashMap::new(), |mut acc, alert| {
                *acc.entry(format!("{:?}", alert.severity)).or_insert(0) += 1;
                acc
            });

        AlertStatistics {
            total_active_alerts: total,
            alerts_by_severity: by_severity,
            total_rules: self.rules.len(),
            enabled_rules: self.rules.values().filter(|r| r.enabled).count(),
            total_history_count: self.history.alerts.len(),
        }
    }
}

impl Default for AlertEngine {
    fn default() -> Self {
        Self::new()
    }
}

/// 告警统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AlertStatistics {
    /// 活跃告警总数
    pub total_active_alerts: usize,
    /// 按级别分类的告警数
    pub alerts_by_severity: HashMap<String, usize>,
    /// 总规则数
    pub total_rules: usize,
    /// 启用的规则数
    pub enabled_rules: usize,
    /// 历史记录总数
    pub total_history_count: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add_and_evaluate_rule() {
        let mut engine = AlertEngine::new();
        
        let rule = AlertRule::new(
            "High Response Time".to_string(),
            "response_time".to_string(),
            AlertCondition::GreaterThan { threshold: 1000.0 },
            AlertSeverity::Warning,
        );
        
        engine.add_rule(rule);
        
        // 触发告警
        let alerts = engine.evaluate("response_time", 1500.0);
        assert_eq!(alerts.len(), 1);
        assert_eq!(alerts[0].rule_name, "High Response Time");
    }

    #[test]
    fn test_cooldown() {
        let mut rule = AlertRule::new(
            "Test Rule".to_string(),
            "test_metric".to_string(),
            AlertCondition::GreaterThan { threshold: 100.0 },
            AlertSeverity::Warning,
        );
        rule.cooldown_secs = 60;
        
        assert!(!rule.is_in_cooldown());
        
        rule.mark_triggered();
        assert!(rule.is_in_cooldown());
    }

    #[test]
    fn test_acknowledge_and_resolve() {
        let mut engine = AlertEngine::new();
        
        let rule = AlertRule::new(
            "Test".to_string(),
            "test".to_string(),
            AlertCondition::GreaterThan { threshold: 100.0 },
            AlertSeverity::Warning,
        );
        
        engine.add_rule(rule);
        let alerts = engine.evaluate("test", 150.0);
        let alert_id = alerts[0].id.clone();
        
        // 确认告警
        engine.acknowledge_alert(&alert_id);
        assert!(engine.active_alerts.get(&alert_id).unwrap().acknowledged);
        
        // 解决告警
        engine.resolve_alert(&alert_id);
        assert!(engine.active_alerts.get(&alert_id).is_none());
    }
}
