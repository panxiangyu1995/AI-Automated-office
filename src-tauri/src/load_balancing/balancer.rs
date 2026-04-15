//! 负载均衡器模块
//!
//! 支持轮询、加权、最少连接三种策略

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// 负载均衡策略
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum BalanceStrategy {
    /// 轮询策略
    RoundRobin,
    /// 加权轮询策略
    Weighted,
    /// 最少连接策略
    LeastConnections,
}

/// 负载均衡配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadBalancingConfig {
    /// 负载均衡策略
    pub strategy: BalanceStrategy,
    /// 健康检查间隔（秒）
    pub health_check_interval_secs: u64,
    /// 失败阈值
    pub failure_threshold: u32,
    /// 恢复阈值
    pub recovery_threshold: u32,
}

impl Default for LoadBalancingConfig {
    fn default() -> Self {
        Self {
            strategy: BalanceStrategy::RoundRobin,
            health_check_interval_secs: 30,
            failure_threshold: 3,
            recovery_threshold: 2,
        }
    }
}

/// 节点信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NodeInfo {
    /// 节点 ID
    pub node_id: String,
    /// 节点地址
    pub endpoint: String,
    /// 权重（用于加权策略）
    pub weight: u32,
    /// 当前连接数（用于最少连接策略）
    pub current_connections: u32,
    /// 是否可用
    pub available: bool,
    /// 最后选择时间
    pub last_selected: Option<DateTime<Utc>>,
}

impl NodeInfo {
    /// 创建新节点
    pub fn new(node_id: String, endpoint: String) -> Self {
        Self {
            node_id,
            endpoint,
            weight: 1,
            current_connections: 0,
            available: true,
            last_selected: None,
        }
    }
}

/// 负载均衡结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceResult {
    /// 被选中的节点 ID
    pub selected_node_id: String,
    /// 节点地址
    pub endpoint: String,
    /// 策略类型
    pub strategy: BalanceStrategy,
}

/// 负载均衡器
pub struct LoadBalancer {
    /// 节点列表
    nodes: HashMap<String, NodeInfo>,
    /// 轮询索引
    round_robin_index: usize,
    /// 配置
    config: LoadBalancingConfig,
    /// 启用会话亲和性的节点
    sticky_sessions: HashMap<String, String>, // session_id -> node_id
}

impl LoadBalancer {
    /// 创建新的负载均衡器
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            round_robin_index: 0,
            config: LoadBalancingConfig::default(),
            sticky_sessions: HashMap::new(),
        }
    }

    /// 创建带有配置的负载均衡器
    pub fn with_config(config: LoadBalancingConfig) -> Self {
        Self {
            nodes: HashMap::new(),
            round_robin_index: 0,
            config,
            sticky_sessions: HashMap::new(),
        }
    }

    /// 添加节点
    pub fn add_node(&mut self, node: NodeInfo) {
        self.nodes.insert(node.node_id.clone(), node);
    }

    /// 移除节点
    pub fn remove_node(&mut self, node_id: &str) {
        self.nodes.remove(node_id);
        self.sticky_sessions.retain(|_, v| v != node_id);
    }

    /// 更新节点权重
    pub fn update_weight(&mut self, node_id: &str, weight: u32) -> Option<()> {
        if let Some(node) = self.nodes.get_mut(node_id) {
            node.weight = weight;
            Some(())
        } else {
            None
        }
    }

    /// 设置节点可用性
    pub fn set_available(&mut self, node_id: &str, available: bool) -> Option<()> {
        if let Some(node) = self.nodes.get_mut(node_id) {
            node.available = available;
            Some(())
        } else {
            None
        }
    }

    /// 选择节点（根据策略）
    pub fn select(&mut self, session_id: Option<&str>) -> Option<BalanceResult> {
        // 检查会话亲和性
        if let Some(sid) = session_id {
            if let Some(node_id) = self.sticky_sessions.get(sid).cloned() {
                if let Some(node) = self.nodes.get(&node_id) {
                    if node.available {
                        return Some(BalanceResult {
                            selected_node_id: node.node_id.clone(),
                            endpoint: node.endpoint.clone(),
                            strategy: self.config.strategy,
                        });
                    }
                }
            }
        }

        // 获取可用节点ID
        let node_ids: Vec<String> = self.nodes.values()
            .filter(|n| n.available)
            .map(|n| n.node_id.clone())
            .collect();

        if node_ids.is_empty() {
            return None;
        }

        // 根据策略选择
        let selected_node_id = match self.config.strategy {
            BalanceStrategy::RoundRobin => {
                let len = node_ids.len();
                let index = self.round_robin_index % len;
                self.round_robin_index += 1;
                Some(node_ids[index].clone())
            }
            BalanceStrategy::Weighted => {
                let total_weight: u32 = self.nodes.values()
                    .filter(|n| n.available)
                    .map(|n| n.weight)
                    .sum();
                if total_weight == 0 {
                    node_ids.first().cloned()
                } else {
                    let mut rand = (Utc::now().timestamp() % total_weight as i64) as u32;
                    for nid in &node_ids {
                        if let Some(node) = self.nodes.get(nid) {
                            if rand < node.weight {
                                return Some(BalanceResult {
                                    selected_node_id: node.node_id.clone(),
                                    endpoint: node.endpoint.clone(),
                                    strategy: self.config.strategy,
                                });
                            }
                            rand -= node.weight;
                        }
                    }
                    node_ids.first().cloned()
                }
            }
            BalanceStrategy::LeastConnections => {
                self.nodes.values()
                    .filter(|n| n.available)
                    .min_by_key(|n| n.current_connections)
                    .map(|n| n.node_id.clone())
            }
        };

        // 更新节点状态
        if let Some(ref node_id) = selected_node_id {
            if let Some(node_info) = self.nodes.get_mut(node_id) {
                node_info.current_connections += 1;
                node_info.last_selected = Some(Utc::now());
            }
            
            // 记录会话亲和性
            if let Some(sid) = session_id {
                self.sticky_sessions.insert(sid.to_string(), node_id.clone());
            }
        }

        // 返回结果
        selected_node_id.and_then(|node_id| {
            self.nodes.get(&node_id).map(|node| BalanceResult {
                selected_node_id: node.node_id.clone(),
                endpoint: node.endpoint.clone(),
                strategy: self.config.strategy,
            })
        })
    }

    /// 释放连接（会话结束时调用）
    pub fn release_connection(&mut self, node_id: &str) {
        if let Some(node) = self.nodes.get_mut(node_id) {
            if node.current_connections > 0 {
                node.current_connections -= 1;
            }
        }
    }

    /// 清除会话
    pub fn clear_session(&mut self, session_id: &str) {
        if let Some(node_id) = self.sticky_sessions.remove(session_id) {
            self.release_connection(&node_id);
        }
    }

    /// 获取所有节点信息
    pub fn get_nodes(&self) -> Vec<&NodeInfo> {
        self.nodes.values().collect()
    }

    /// 获取可用节点数
    pub fn available_count(&self) -> usize {
        self.nodes.values().filter(|n| n.available).count()
    }

    /// 更新配置
    pub fn update_config(&mut self, config: LoadBalancingConfig) {
        self.config = config;
    }

    /// 获取当前配置
    pub fn get_config(&self) -> &LoadBalancingConfig {
        &self.config
    }
}

impl Default for LoadBalancer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_round_robin() {
        let mut balancer = LoadBalancer::with_config(LoadBalancingConfig {
            strategy: BalanceStrategy::RoundRobin,
            ..Default::default()
        });
        
        balancer.add_node(NodeInfo::new("node-1".to_string(), "http://localhost:8081".to_string()));
        balancer.add_node(NodeInfo::new("node-2".to_string(), "http://localhost:8082".to_string()));
        
        let result1 = balancer.select(None);
        let result2 = balancer.select(None);
        let result3 = balancer.select(None);
        
        assert!(result1.is_some());
        assert!(result2.is_some());
        assert!(result3.is_some());
        
        // 轮询应该循环
        let ids: Vec<_> = [result1, result2, result3].iter().filter_map(|r| r.as_ref().map(|r| r.selected_node_id.clone())).collect();
        assert_eq!(ids[0], "node-1");
        assert_eq!(ids[1], "node-2");
        assert_eq!(ids[2], "node-1");
    }

    #[test]
    fn test_weighted() {
        let mut balancer = LoadBalancer::with_config(LoadBalancingConfig {
            strategy: BalanceStrategy::Weighted,
            ..Default::default()
        });
        
        let mut node1 = NodeInfo::new("node-1".to_string(), "http://localhost:8081".to_string());
        node1.weight = 3;
        
        let mut node2 = NodeInfo::new("node-2".to_string(), "http://localhost:8082".to_string());
        node2.weight = 1;
        
        balancer.add_node(node1);
        balancer.add_node(node2);
        
        // node-1 应该更频繁被选中
        let mut node1_count = 0;
        let mut node2_count = 0;
        
        for _ in 0..100 {
            if let Some(result) = balancer.select(None) {
                if result.selected_node_id == "node-1" {
                    node1_count += 1;
                } else {
                    node2_count += 1;
                }
            }
        }
        
        assert!(node1_count > node2_count);
    }

    #[test]
    fn test_least_connections() {
        let mut balancer = LoadBalancer::with_config(LoadBalancingConfig {
            strategy: BalanceStrategy::LeastConnections,
            ..Default::default()
        });
        
        let mut node1 = NodeInfo::new("node-1".to_string(), "http://localhost:8081".to_string());
        node1.current_connections = 10;
        
        let mut node2 = NodeInfo::new("node-2".to_string(), "http://localhost:8082".to_string());
        node2.current_connections = 2;
        
        balancer.add_node(node1);
        balancer.add_node(node2);
        
        let result = balancer.select(None);
        
        assert!(result.is_some());
        assert_eq!(result.unwrap().selected_node_id, "node-2");
    }

    #[test]
    fn test_sticky_session() {
        let mut balancer = LoadBalancer::new();
        
        balancer.add_node(NodeInfo::new("node-1".to_string(), "http://localhost:8081".to_string()));
        balancer.add_node(NodeInfo::new("node-2".to_string(), "http://localhost:8082".to_string()));
        
        let result1 = balancer.select(Some("session-123"));
        assert!(result1.is_some());
        
        // 同一会话应该返回同一节点
        let result2 = balancer.select(Some("session-123"));
        assert!(result2.is_some());
        assert_eq!(result1.unwrap().selected_node_id, result2.unwrap().selected_node_id);
    }
}
