//! 故障转移模块
//!
//! 提供自动故障检测和切换功能

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 故障转移状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FailoverState {
    /// 正常
    Normal,
    /// 检测中
    Detecting,
    /// 故障转移中
    FailingOver,
    /// 已故障转移
    FailedOver,
    /// 恢复中
    Recovering,
}

/// 故障原因
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum FailoverReason {
    /// 健康检查失败
    HealthCheckFailed,
    /// 响应超时
    ResponseTimeout,
    /// 错误率过高
    HighErrorRate,
    /// 手动触发
    ManualTrigger,
}

/// 故障转移记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FailoverRecord {
    /// 源节点 ID
    pub from_node_id: String,
    /// 目标节点 ID
    pub to_node_id: String,
    /// 故障原因
    pub reason: FailoverReason,
    /// 发生时间
    pub timestamp: DateTime<Utc>,
    /// 持续时间（秒）
    pub duration_secs: Option<u64>,
    /// 是否已恢复
    pub recovered: bool,
}

impl FailoverRecord {
    /// 创建新的故障转移记录
    pub fn new(
        from_node_id: String,
        to_node_id: String,
        reason: FailoverReason,
    ) -> Self {
        Self {
            from_node_id,
            to_node_id,
            reason,
            timestamp: Utc::now(),
            duration_secs: None,
            recovered: false,
        }
    }

    /// 标记为已恢复
    pub fn mark_recovered(&mut self) {
        self.recovered = true;
        self.duration_secs = Some((Utc::now() - self.timestamp).num_seconds() as u64);
    }
}

/// 节点配对信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodePair {
    /// 主节点 ID
    pub primary_id: String,
    /// 备用节点 ID
    pub standby_id: String,
    /// 主节点地址
    pub primary_endpoint: String,
    /// 备用节点地址
    pub standby_endpoint: String,
    /// 是否为主动切换
    pub is_manual: bool,
}

impl NodePair {
    /// 创建新的节点配对
    pub fn new(
        primary_id: String,
        standby_id: String,
        primary_endpoint: String,
        standby_endpoint: String,
    ) -> Self {
        Self {
            primary_id,
            standby_id,
            primary_endpoint,
            standby_endpoint,
            is_manual: false,
        }
    }
}

/// 故障转移管理器
pub struct FailoverManager {
    /// 节点配对
    pairs: HashMap<String, NodePair>,
    /// 当前状态
    states: HashMap<String, FailoverState>,
    /// 故障转移记录
    records: Vec<FailoverRecord>,
    /// 最后切换时间
    last_switch: HashMap<String, DateTime<Utc>>,
}

impl FailoverManager {
    /// 创建新的故障转移管理器
    pub fn new() -> Self {
        Self {
            pairs: HashMap::new(),
            states: HashMap::new(),
            records: Vec::new(),
            last_switch: HashMap::new(),
        }
    }

    /// 注册节点配对
    pub fn register_pair(&mut self, pair: NodePair) {
        self.pairs.insert(pair.primary_id.clone(), pair);
        self.states.insert(pair.primary_id.clone(), FailoverState::Normal);
    }

    /// 注销节点配对
    pub fn unregister_pair(&mut self, primary_id: &str) {
        self.pairs.remove(primary_id);
        self.states.remove(primary_id);
    }

    /// 获取节点状态
    pub fn get_state(&self, primary_id: &str) -> Option<&FailoverState> {
        self.states.get(primary_id)
    }

    /// 触发故障转移
    pub fn trigger_failover(
        &mut self,
        primary_id: &str,
        reason: FailoverReason,
        is_manual: bool,
    ) -> Option<FailoverRecord> {
        let pair = self.pairs.get(primary_id)?;

        // 检查当前状态
        let current_state = self.states.get(primary_id)?;
        if *current_state == FailoverState::FailingOver || *current_state == FailoverState::FailedOver {
            return None;
        }

        // 更新状态
        self.states.insert(primary_id.to_string(), FailoverState::FailingOver);

        // 创建记录
        let mut record = FailoverRecord::new(
            primary_id.to_string(),
            pair.standby_id.clone(),
            reason,
        );

        // 更新最后切换时间
        self.last_switch.insert(primary_id.to_string(), Utc::now());

        // 更新状态为已故障转移
        self.states.insert(primary_id.to_string(), FailoverState::FailedOver);

        self.records.push(record.clone());
        Some(record)
    }

    /// 触发恢复
    pub fn trigger_recovery(&mut self, primary_id: &str) -> Option<()> {
        let pair = self.pairs.get(primary_id)?;

        // 检查当前状态
        let current_state = self.states.get(primary_id)?;
        if *current_state != FailoverState::FailedOver {
            return None;
        }

        // 更新状态为恢复中
        self.states.insert(primary_id.to_string(), FailoverState::Recovering);

        // 查找并更新记录
        if let Some(record) = self.records.iter_mut().rev().find(|r| r.from_node_id == primary_id && !r.recovered) {
            record.mark_recovered();
        }

        // 更新状态为正常
        self.states.insert(primary_id.to_string(), FailoverState::Normal);

        Some(())
    }

    /// 检查是否可以恢复
    pub fn can_recover(&self, primary_id: &str) -> bool {
        // 检查是否在故障转移状态
        if let Some(state) = self.states.get(primary_id) {
            if *state != FailoverState::FailedOver {
                return false;
            }
        } else {
            return false;
        }

        // 检查冷却时间（至少 30 秒后才能恢复）
        if let Some(last) = self.last_switch.get(primary_id) {
            let elapsed = (Utc::now() - *last).num_seconds();
            return elapsed >= 30;
        }

        true
    }

    /// 获取故障转移历史
    pub fn get_history(&self, primary_id: Option<&str>) -> Vec<&FailoverRecord> {
        match primary_id {
            Some(id) => self.records.iter().filter(|r| r.from_node_id == id).collect(),
            None => self.records.iter().collect(),
        }
    }

    /// 获取当前故障的节点
    pub fn get_failed_nodes(&self) -> Vec<String> {
        self.states.iter()
            .filter(|(_, state)| **state == FailoverState::FailedOver)
            .map(|(id, _)| id.clone())
            .collect()
    }

    /// 获取节点配对信息
    pub fn get_pair(&self, primary_id: &str) -> Option<&NodePair> {
        self.pairs.get(primary_id)
    }

    /// 获取所有节点配对
    pub fn get_all_pairs(&self) -> Vec<&NodePair> {
        self.pairs.values().collect()
    }

    /// 获取统计信息
    pub fn get_stats(&self) -> FailoverStats {
        let total_records = self.records.len();
        let recovered_count = self.records.iter().filter(|r| r.recovered).count();
        let failed_count = self.records.iter().filter(|r| !r.recovered).count();

        FailoverStats {
            total_failovers: total_records,
            recovered_failovers: recovered_count,
            active_failovers: failed_count,
            current_failed_nodes: self.get_failed_nodes().len(),
        }
    }
}

impl Default for FailoverManager {
    fn default() -> Self {
        Self::new()
    }
}

/// 故障转移统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FailoverStats {
    /// 总故障转移次数
    pub total_failovers: usize,
    /// 已恢复的故障转移次数
    pub recovered_failovers: usize,
    /// 活跃的故障转移次数
    pub active_failovers: usize,
    /// 当前故障节点数
    pub current_failed_nodes: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_register_and_unregister_pair() {
        let mut manager = FailoverManager::new();
        
        let pair = NodePair::new(
            "primary-1".to_string(),
            "standby-1".to_string(),
            "http://primary:8080".to_string(),
            "http://standby:8080".to_string(),
        );
        
        manager.register_pair(pair);
        
        assert!(manager.get_pair("primary-1").is_some());
        assert_eq!(manager.get_state("primary-1"), Some(&FailoverState::Normal));
        
        manager.unregister_pair("primary-1");
        assert!(manager.get_pair("primary-1").is_none());
    }

    #[test]
    fn test_failover_and_recovery() {
        let mut manager = FailoverManager::new();
        
        let pair = NodePair::new(
            "primary-1".to_string(),
            "standby-1".to_string(),
            "http://primary:8080".to_string(),
            "http://standby:8080".to_string(),
        );
        
        manager.register_pair(pair);
        
        // 触发故障转移
        let record = manager.trigger_failover("primary-1", FailoverReason::HealthCheckFailed, false);
        assert!(record.is_some());
        assert_eq!(manager.get_state("primary-1"), Some(&FailoverState::FailedOver));
        
        // 触发恢复
        let result = manager.trigger_recovery("primary-1");
        assert!(result.is_some());
        assert_eq!(manager.get_state("primary-1"), Some(&FailoverState::Normal));
        
        // 检查记录
        let history = manager.get_history(Some("primary-1"));
        assert_eq!(history.len(), 1);
        assert!(history[0].recovered);
    }

    #[test]
    fn test_stats() {
        let mut manager = FailoverManager::new();
        
        let pair1 = NodePair::new("primary-1".to_string(), "standby-1".to_string(), "http://p1".to_string(), "http://s1".to_string());
        let pair2 = NodePair::new("primary-2".to_string(), "standby-2".to_string(), "http://p2".to_string(), "http://s2".to_string());
        
        manager.register_pair(pair1);
        manager.register_pair(pair2);
        
        manager.trigger_failover("primary-1", FailoverReason::ManualTrigger, true);
        manager.trigger_recovery("primary-1");
        manager.trigger_failover("primary-2", FailoverReason::HighErrorRate, false);
        
        let stats = manager.get_stats();
        assert_eq!(stats.total_failovers, 2);
        assert_eq!(stats.recovered_failovers, 1);
        assert_eq!(stats.active_failovers, 1);
    }
}
