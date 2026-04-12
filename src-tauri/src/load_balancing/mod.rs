//! 负载均衡与高可用模块
//!
//! 提供健康检查、负载均衡、故障转移和 SLA 监控功能

pub mod health_check;
pub mod balancer;
pub mod failover;
pub mod sla_monitor;

use std::sync::Arc;
use tokio::sync::RwLock;

/// 负载均衡状态
pub struct LoadBalancingState {
    /// 健康检查器
    pub health_checker: Arc<RwLock<health_check::HealthChecker>>,
    /// 负载均衡器
    pub balancer: Arc<RwLock<balancer::LoadBalancer>>,
    /// 故障转移管理器
    pub failover_manager: Arc<RwLock<failover::FailoverManager>>,
    /// SLA 监控器
    pub sla_monitor: Arc<RwLock<sla_monitor::SlaMonitor>>,
}

impl Default for LoadBalancingState {
    fn default() -> Self {
        Self {
            health_checker: Arc::new(RwLock::new(health_check::HealthChecker::new())),
            balancer: Arc::new(RwLock::new(balancer::LoadBalancer::new())),
            failover_manager: Arc::new(RwLock::new(failover::FailoverManager::new())),
            sla_monitor: Arc::new(RwLock::new(sla_monitor::SlaMonitor::new())),
        }
    }
}

impl LoadBalancingState {
    /// 创建新的负载均衡状态
    pub fn new() -> Self {
        Self::default()
    }
}
