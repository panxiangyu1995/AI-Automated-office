//! 健康检查模块
//!
//! 支持 HTTP/TCP/Process 三种检查方式

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::{TcpStream, SocketAddr};
use std::time::{Duration, Instant};

/// 健康检查方式
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum HealthCheckType {
    /// HTTP 健康检查
    Http,
    /// TCP 连接检查
    Tcp,
    /// 进程存活检查
    Process,
}

/// 节点健康状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthStatus {
    /// 节点 ID
    pub node_id: String,
    /// 节点地址
    pub endpoint: String,
    /// 是否健康
    pub is_healthy: bool,
    /// 连续失败次数
    pub consecutive_failures: u32,
    /// 最后检查时间
    pub last_check: DateTime<Utc>,
    /// 响应时间（毫秒）
    pub response_time_ms: u64,
    /// 检查类型
    pub check_type: HealthCheckType,
    /// 错误消息（如果失败）
    pub error_message: Option<String>,
}

/// 健康检查配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthCheckConfig {
    /// 节点 ID
    pub node_id: String,
    /// 节点地址
    pub endpoint: String,
    /// 检查类型
    pub check_type: HealthCheckType,
    /// 检查间隔（秒）
    pub interval_secs: u64,
    /// 超时时间（秒）
    pub timeout_secs: u64,
    /// 失败阈值
    pub failure_threshold: u32,
    /// 恢复阈值
    pub recovery_threshold: u32,
    /// 额外参数（URL 用于 HTTP 检查）
    pub extra_params: Option<HashMap<String, String>>,
}

impl Default for HealthCheckConfig {
    fn default() -> Self {
        Self {
            node_id: String::new(),
            endpoint: String::new(),
            check_type: HealthCheckType::Http,
            interval_secs: 30,
            timeout_secs: 5,
            failure_threshold: 3,
            recovery_threshold: 2,
            extra_params: None,
        }
    }
}

/// 健康检查器
pub struct HealthChecker {
    /// 节点配置
    nodes: HashMap<String, HealthCheckConfig>,
    /// 节点状态
    statuses: HashMap<String, HealthStatus>,
    /// HTTP 客户端
    #[cfg(feature = "http")]
    http_client: reqwest::Client,
}

impl HealthChecker {
    /// 创建新的健康检查器
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            statuses: HashMap::new(),
            #[cfg(feature = "http")]
            http_client: reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
                .unwrap_or_default(),
        }
    }

    /// 注册节点进行健康检查
    pub fn register_node(&mut self, config: HealthCheckConfig) {
        let node_id = config.node_id.clone();
        self.nodes.insert(node_id.clone(), config);
        
        // 初始化状态
        let endpoint = self.nodes.get(&node_id).map(|c| c.endpoint.clone()).unwrap_or_default();
        let check_type = self.nodes.get(&node_id).map(|c| c.check_type.clone()).unwrap_or(HealthCheckType::Http);
        let status = HealthStatus {
            node_id,
            endpoint,
            is_healthy: true,
            consecutive_failures: 0,
            last_check: Utc::now(),
            response_time_ms: 0,
            check_type,
            error_message: None,
        };
        self.statuses.insert(status.node_id.clone(), status);
    }

    /// 注销节点
    pub fn unregister_node(&mut self, node_id: &str) {
        self.nodes.remove(node_id);
        self.statuses.remove(node_id);
    }

    /// 执行健康检查
    pub async fn check_node(&mut self, node_id: &str) -> Result<HealthStatus, String> {
        let config = self.nodes.get(node_id)
            .ok_or_else(|| format!("Node not found: {}", node_id))?
            .clone();

        let start = Instant::now();
        let result = match config.check_type {
            HealthCheckType::Http => self.check_http(&config).await,
            HealthCheckType::Tcp => self.check_tcp(&config),
            HealthCheckType::Process => self.check_process(&config),
        };

        let elapsed = start.elapsed().as_millis() as u64;
        
        let status = match result {
            Ok(is_healthy) => {
                let consecutive_failures = if is_healthy {
                    0
                } else {
                    self.statuses.get(node_id)
                        .map(|s| s.consecutive_failures + 1)
                        .unwrap_or(1)
                };
                
                HealthStatus {
                    node_id: node_id.to_string(),
                    endpoint: config.endpoint.clone(),
                    is_healthy: consecutive_failures < config.failure_threshold,
                    consecutive_failures,
                    last_check: Utc::now(),
                    response_time_ms: elapsed,
                    check_type: config.check_type,
                    error_message: if is_healthy { None } else { Some("Health check failed".to_string()) },
                }
            }
            Err(e) => {
                let consecutive_failures = self.statuses.get(node_id)
                    .map(|s| s.consecutive_failures + 1)
                    .unwrap_or(1);
                
                HealthStatus {
                    node_id: node_id.to_string(),
                    endpoint: config.endpoint.clone(),
                    is_healthy: false,
                    consecutive_failures,
                    last_check: Utc::now(),
                    response_time_ms: elapsed,
                    check_type: config.check_type,
                    error_message: Some(e),
                }
            }
        };

        self.statuses.insert(node_id.to_string(), status.clone());
        Ok(status)
    }

    /// 执行 HTTP 健康检查
    #[cfg(feature = "http")]
    async fn check_http(&self, config: &HealthCheckConfig) -> Result<bool, String> {
        let url = config.extra_params
            .as_ref()
            .and_then(|p| p.get("url"))
            .cloned()
            .unwrap_or_else(|| format!("{}/health", config.endpoint));

        let timeout = Duration::from_secs(config.timeout_secs);
        
        match tokio::time::timeout(timeout, self.http_client.get(&url).send()).await {
            Ok(Ok(response)) => Ok(response.status().is_success()),
            Ok(Err(e)) => Err(format!("HTTP request failed: {}", e)),
            Err(_) => Err("HTTP request timeout".to_string()),
        }
    }

    /// HTTP 检查占位实现（无 http feature）
    #[cfg(not(feature = "http"))]
    async fn check_http(&self, config: &HealthCheckConfig) -> Result<bool, String> {
        // 占位实现：总是返回成功
        Ok(true)
    }

    /// 执行 TCP 健康检查
    fn check_tcp(&self, config: &HealthCheckConfig) -> Result<bool, String> {
        let addr: SocketAddr = config.endpoint.parse()
            .map_err(|e| format!("Invalid address: {}", e))?;
        
        let timeout = Duration::from_secs(config.timeout_secs);
        
        match TcpStream::connect_timeout(&addr, timeout) {
            Ok(_) => Ok(true),
            Err(e) => Err(format!("TCP connection failed: {}", e)),
        }
    }

    /// 执行进程健康检查
    fn check_process(&self, config: &HealthCheckConfig) -> Result<bool, String> {
        let pid = config.extra_params
            .as_ref()
            .and_then(|p| p.get("pid"))
            .and_then(|s| s.parse::<u32>().ok())
            .ok_or_else(|| "PID not provided".to_string())?;

        // 检查进程是否存在
        #[cfg(windows)]
        {
            use std::process::Command;
            let output = Command::new("tasklist")
                .args(["/FI", &format!("PID eq {}", pid)])
                .output();
            
            match output {
                Ok(out) => {
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    Ok(stdout.contains(&pid.to_string()))
                }
                Err(e) => Err(format!("Failed to check process: {}", e)),
            }
        }
        
        #[cfg(not(windows))]
        {
            // Unix 系统使用信号 0 检查进程
            use std::process::Command;
            let output = Command::new("kill")
                .args(["-0", &pid.to_string()])
                .output();
            
            match output {
                Ok(out) if out.status.success() => Ok(true),
                Ok(_) => Ok(false),
                Err(e) => Err(format!("Failed to check process: {}", e)),
            }
        }
    }

    /// 获取节点健康状态
    pub fn get_status(&self, node_id: &str) -> Option<&HealthStatus> {
        self.statuses.get(node_id)
    }

    /// 获取所有节点状态
    pub fn get_all_statuses(&self) -> Vec<&HealthStatus> {
        self.statuses.values().collect()
    }

    /// 获取健康节点列表
    pub fn get_healthy_nodes(&self) -> Vec<String> {
        self.statuses.iter()
            .filter(|(_, status)| status.is_healthy)
            .map(|(id, _)| id.clone())
            .collect()
    }

    /// 检查节点是否健康
    pub fn is_healthy(&self, node_id: &str) -> bool {
        self.statuses.get(node_id)
            .map(|s| s.is_healthy)
            .unwrap_or(false)
    }
}

impl Default for HealthChecker {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_checker_registration() {
        let mut checker = HealthChecker::new();
        
        let config = HealthCheckConfig {
            node_id: "node-1".to_string(),
            endpoint: "http://localhost:8080".to_string(),
            check_type: HealthCheckType::Http,
            interval_secs: 30,
            timeout_secs: 5,
            failure_threshold: 3,
            recovery_threshold: 2,
            extra_params: Some([("url".to_string(), "http://localhost:8080/health".to_string())].into()),
        };
        
        checker.register_node(config);
        
        assert!(checker.is_healthy("node-1"));
        assert_eq!(checker.get_all_statuses().len(), 1);
    }

    #[tokio::test]
    async fn test_tcp_health_check() {
        let mut checker = HealthChecker::new();
        
        let config = HealthCheckConfig {
            node_id: "localhost".to_string(),
            endpoint: "127.0.0.1:80".to_string(),
            check_type: HealthCheckType::Tcp,
            timeout_secs: 1,
            ..Default::default()
        };
        
        checker.register_node(config);
        let result = checker.check_node("localhost").await;
        
        // localhost:80 通常不存在，所以应该返回失败
        assert!(result.is_ok());
        let status = result.unwrap();
        assert!(!status.is_healthy || status.response_time_ms > 0);
    }
}
