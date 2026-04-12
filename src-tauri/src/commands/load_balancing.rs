//! 负载均衡 Tauri 命令
//!
//! 提供负载均衡、高可用和 SLA 监控的 IPC 接口

use tauri::State;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::load_balancing::{
    health_check::{HealthChecker, HealthCheckConfig, HealthStatus, HealthCheckType},
    balancer::{LoadBalancer, BalanceStrategy, NodeInfo},
    failover::{FailoverManager, NodePair, FailoverRecord, FailoverReason, FailoverState},
    sla_monitor::{SlaMonitor, SlaReport, SlaAlertConfig, SlaPeriod},
    LoadBalancingState,
};

// ============================================================================
// 健康检查命令
// ============================================================================

/// 获取节点健康状态
#[tauri::command]
pub async fn get_health_status(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
) -> Result<HealthStatus, String> {
    let state = state.read().await;
    let checker = state.health_checker.read().await;
    
    checker.get_status(&node_id)
        .cloned()
        .ok_or_else(|| format!("Node not found: {}", node_id))
}

/// 列出所有节点健康状态
#[tauri::command]
pub async fn list_health_nodes(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
) -> Result<Vec<HealthStatus>, String> {
    let state = state.read().await;
    let checker = state.health_checker.read().await;
    
    Ok(checker.get_all_statuses().iter().cloned().collect())
}

/// 执行健康检查
#[tauri::command]
pub async fn check_health(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
) -> Result<HealthStatus, String> {
    let mut state = state.write().await;
    let checker = state.health_checker.write().await;
    checker.check_node(&node_id).await
}

/// 注册节点进行健康检查
#[tauri::command]
pub async fn register_health_node(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
    endpoint: String,
    check_type: String,
    interval_secs: u64,
    timeout_secs: u64,
) -> Result<(), String> {
    let mut state = state.write().await;
    let checker = state.health_checker.write().await;
    
    let check_type = match check_type.as_str() {
        "http" => HealthCheckType::Http,
        "tcp" => HealthCheckType::Tcp,
        "process" => HealthCheckType::Process,
        _ => return Err(format!("Invalid check type: {}", check_type)),
    };
    
    let config = HealthCheckConfig {
        node_id: node_id.clone(),
        endpoint,
        check_type,
        interval_secs,
        timeout_secs,
        failure_threshold: 3,
        recovery_threshold: 2,
        extra_params: None,
    };
    
    checker.register_node(config);
    Ok(())
}

/// 注销健康检查节点
#[tauri::command]
pub async fn unregister_health_node(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let checker = state.health_checker.write().await;
    checker.unregister_node(&node_id);
    Ok(())
}

// ============================================================================
// 负载均衡命令
// ============================================================================

/// 选择节点（负载均衡）
#[tauri::command]
pub async fn select_balanced_node(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    session_id: Option<String>,
) -> Result<Option<crate::load_balancing::balancer::BalanceResult>, String> {
    let mut state = state.write().await;
    let balancer = state.balancer.write().await;
    Ok(balancer.select(session_id.as_deref()))
}

/// 添加负载均衡节点
#[tauri::command]
pub async fn add_load_balancer_node(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
    endpoint: String,
    weight: u32,
) -> Result<(), String> {
    let mut state = state.write().await;
    let balancer = state.balancer.write().await;
    
    let mut node = NodeInfo::new(node_id, endpoint);
    node.weight = weight;
    balancer.add_node(node);
    Ok(())
}

/// 移除负载均衡节点
#[tauri::command]
pub async fn remove_load_balancer_node(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let balancer = state.balancer.write().await;
    balancer.remove_node(&node_id);
    Ok(())
}

/// 更新节点权重
#[tauri::command]
pub async fn update_node_weight(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
    weight: u32,
) -> Result<(), String> {
    let mut state = state.write().await;
    let balancer = state.balancer.write().await;
    
    balancer.update_weight(&node_id, weight)
        .ok_or_else(|| format!("Node not found: {}", node_id))
}

/// 设置节点可用性
#[tauri::command]
pub async fn set_node_availability(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    node_id: String,
    available: bool,
) -> Result<(), String> {
    let mut state = state.write().await;
    let balancer = state.balancer.write().await;
    
    balancer.set_available(&node_id, available)
        .ok_or_else(|| format!("Node not found: {}", node_id))
}

/// 获取负载均衡节点列表
#[tauri::command]
pub async fn list_load_balancer_nodes(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
) -> Result<Vec<NodeInfo>, String> {
    let state = state.write().await;
    let balancer = state.balancer.write().await;
    
    Ok(balancer.get_nodes().iter().map(|n| (*n).clone()).collect())
}

/// 设置负载均衡策略
#[tauri::command]
pub async fn set_balance_strategy(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    strategy: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let balancer = state.balancer.write().await;
    
    let strategy = match strategy.as_str() {
        "round_robin" => BalanceStrategy::RoundRobin,
        "weighted" => BalanceStrategy::Weighted,
        "least_connections" => BalanceStrategy::LeastConnections,
        _ => return Err(format!("Invalid strategy: {}", strategy)),
    };
    
    let mut config = balancer.get_config().clone();
    config.strategy = strategy;
    balancer.update_config(config);
    Ok(())
}

// ============================================================================
// 故障转移命令
// ============================================================================

/// 注册故障转移节点配对
#[tauri::command]
pub async fn register_failover_pair(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    primary_id: String,
    standby_id: String,
    primary_endpoint: String,
    standby_endpoint: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let manager = state.failover_manager.write().await;
    
    let pair = NodePair::new(primary_id, standby_id, primary_endpoint, standby_endpoint);
    manager.register_pair(pair);
    Ok(())
}

/// 触发故障转移
#[tauri::command]
pub async fn trigger_failover(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    primary_id: String,
    reason: String,
    is_manual: bool,
) -> Result<FailoverRecord, String> {
    let mut state = state.write().await;
    let manager = state.failover_manager.write().await;
    
    let reason = match reason.as_str() {
        "health_check_failed" => FailoverReason::HealthCheckFailed,
        "response_timeout" => FailoverReason::ResponseTimeout,
        "high_error_rate" => FailoverReason::HighErrorRate,
        "manual_trigger" => FailoverReason::ManualTrigger,
        _ => return Err(format!("Invalid reason: {}", reason)),
    };
    
    manager.trigger_failover(&primary_id, reason, is_manual)
        .ok_or_else(|| "Failover failed or node not found".to_string())
}

/// 触发恢复
#[tauri::command]
pub async fn trigger_recovery(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    primary_id: String,
) -> Result<(), String> {
    let mut state = state.write().await;
    let manager = state.failover_manager.write().await;
    
    manager.trigger_recovery(&primary_id)
        .ok_or_else(|| "Recovery failed or node not in failover state".to_string())
}

/// 获取故障转移状态
#[tauri::command]
pub async fn get_failover_state(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    primary_id: String,
) -> Result<String, String> {
    let state = state.read().await;
    let manager = state.failover_manager.read().await;
    
    let state_val = manager.get_state(&primary_id)
        .ok_or_else(|| format!("Node not found: {}", primary_id))?;
    
    let state_str = match state_val {
        FailoverState::Normal => "normal",
        FailoverState::Detecting => "detecting",
        FailoverState::FailingOver => "failing_over",
        FailoverState::FailedOver => "failed_over",
        FailoverState::Recovering => "recovering",
    };
    
    Ok(state_str.to_string())
}

/// 获取故障转移历史
#[tauri::command]
pub async fn get_failover_history(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    primary_id: Option<String>,
) -> Result<Vec<FailoverRecord>, String> {
    let state = state.read().await;
    let manager = state.failover_manager.read().await;
    
    Ok(manager.get_history(primary_id.as_deref()).iter().cloned().collect())
}

/// 获取当前故障节点列表
#[tauri::command]
pub async fn get_failed_nodes(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
) -> Result<Vec<String>, String> {
    let state = state.read().await;
    let manager = state.failover_manager.read().await;
    
    Ok(manager.get_failed_nodes())
}

// ============================================================================
// SLA 监控命令
// ============================================================================

/// 记录 SLA 请求
#[tauri::command]
pub async fn record_sla_request(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    service_id: String,
    success: bool,
    response_time_ms: u64,
) -> Result<(), String> {
    let mut state = state.write().await;
    let monitor = state.sla_monitor.write().await;
    monitor.record_request(&service_id, success, response_time_ms);
    Ok(())
}

/// 获取 SLA 报告
#[tauri::command]
pub async fn get_sla_report(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    service_id: String,
    period: String,
) -> Result<SlaReport, String> {
    let state = state.read().await;
    let monitor = state.sla_monitor.read().await;
    
    let period = match period.as_str() {
        "hourly" => SlaPeriod::Hourly,
        "daily" => SlaPeriod::Daily,
        "weekly" => SlaPeriod::Weekly,
        "monthly" => SlaPeriod::Monthly,
        _ => return Err(format!("Invalid period: {}", period)),
    };
    
    monitor.get_report(&service_id, period)
        .ok_or_else(|| format!("Service not found: {}", service_id))
}

/// 获取所有 SLA 报告
#[tauri::command]
pub async fn get_all_sla_reports(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    period: String,
) -> Result<Vec<SlaReport>, String> {
    let state = state.read().await;
    let monitor = state.sla_monitor.read().await;
    
    let period = match period.as_str() {
        "hourly" => SlaPeriod::Hourly,
        "daily" => SlaPeriod::Daily,
        "weekly" => SlaPeriod::Weekly,
        "monthly" => SlaPeriod::Monthly,
        _ => return Err(format!("Invalid period: {}", period)),
    };
    
    Ok(monitor.get_all_reports(period))
}

/// 配置 SLA 告警
#[tauri::command]
pub async fn configure_sla_alert(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    service_id: String,
    uptime_threshold: f64,
    response_time_threshold_ms: u64,
    enabled: bool,
) -> Result<(), String> {
    let mut state = state.write().await;
    let monitor = state.sla_monitor.write().await;
    
    let config = SlaAlertConfig {
        service_id,
        uptime_threshold,
        response_time_threshold_ms,
        enabled,
    };
    
    monitor.configure_alert(config);
    Ok(())
}

/// 获取 SLA 告警
#[tauri::command]
pub async fn get_sla_alerts(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
    include_resolved: bool,
) -> Result<Vec<crate::load_balancing::sla_monitor::SlaAlert>, String> {
    let state = state.read().await;
    let monitor = state.sla_monitor.read().await;
    
    Ok(monitor.get_alerts(include_resolved).iter().map(|a| (*a).clone()).collect())
}

/// 获取 SLA 摘要
#[tauri::command]
pub async fn get_sla_summary(
    state: State<'_, Arc<RwLock<LoadBalancingState>>>,
) -> Result<crate::load_balancing::sla_monitor::SlaSummary, String> {
    let state = state.read().await;
    let monitor = state.sla_monitor.read().await;
    
    Ok(monitor.get_summary())
}

// ============================================================================
// 导出所有命令
// ============================================================================

pub fn register_commands() -> Vec<tauri::command::CommandDefinition> {
    vec![
        // 健康检查
        get_health_status::definition(),
        list_health_nodes::definition(),
        check_health::definition(),
        register_health_node::definition(),
        unregister_health_node::definition(),
        // 负载均衡
        select_balanced_node::definition(),
        add_load_balancer_node::definition(),
        remove_load_balancer_node::definition(),
        update_node_weight::definition(),
        set_node_availability::definition(),
        list_load_balancer_nodes::definition(),
        set_balance_strategy::definition(),
        // 故障转移
        register_failover_pair::definition(),
        trigger_failover::definition(),
        trigger_recovery::definition(),
        get_failover_state::definition(),
        get_failover_history::definition(),
        get_failed_nodes::definition(),
        // SLA 监控
        record_sla_request::definition(),
        get_sla_report::definition(),
        get_all_sla_reports::definition(),
        configure_sla_alert::definition(),
        get_sla_alerts::definition(),
        get_sla_summary::definition(),
    ]
}
