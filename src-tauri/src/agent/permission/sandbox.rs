//! 工具权限沙箱模块
//!
//! 实现FR1020-FR1027: 工具权限沙箱
//! - 黑名单/白名单/灰名单权限判断
//! - 五种匹配模式
//! - 工具执行前权限检查

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use regex::Regex;

/// 匹配模式
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum MatchPattern {
    /// 精确匹配
    Exact { value: String },
    /// 前缀匹配
    Prefix { value: String },
    /// 后缀匹配
    Suffix { value: String },
    /// 包含匹配
    Contains { value: String },
    /// 正则匹配
    Regex { pattern: String },
    /// 分组匹配 (如 "shell_*", "fs_*")
    Group { value: String },
}

impl MatchPattern {
    /// 检查是否匹配
    pub fn matches(&self, tool_name: &str) -> bool {
        match self {
            MatchPattern::Exact { value } => tool_name == value,
            MatchPattern::Prefix { value } => tool_name.starts_with(value),
            MatchPattern::Suffix { value } => tool_name.ends_with(value),
            MatchPattern::Contains { value } => tool_name.contains(value),
            MatchPattern::Regex { pattern } => {
                Regex::new(pattern)
                    .map(|re| re.is_match(tool_name))
                    .unwrap_or(false)
            }
            MatchPattern::Group { value } => {
                // 分组匹配：支持通配符
                let pattern = value.replace('*', ".*");
                Regex::new(&format!("^{}$", pattern))
                    .map(|re| re.is_match(tool_name))
                    .unwrap_or(false)
            }
        }
    }
}

/// 权限结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "lowercase")]
pub enum PermissionResult {
    /// 允许执行
    Allowed,
    /// 拒绝执行
    Denied { reason: String },
    /// 需要用户确认
    Ask { tool_name: String },
}

impl PermissionResult {
    pub fn is_allowed(&self) -> bool {
        matches!(self, PermissionResult::Allowed)
    }

    pub fn is_denied(&self) -> bool {
        matches!(self, PermissionResult::Denied { .. })
    }

    pub fn needs_confirmation(&self) -> bool {
        matches!(self, PermissionResult::Ask { .. })
    }
}

/// 沙箱配置
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SandboxConfig {
    /// 默认策略（无匹配时）
    pub default_policy: DefaultPolicy,
    /// 是否启用严格模式（黑名单优先）
    pub strict_mode: bool,
    /// 审计日志
    pub audit_enabled: bool,
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            default_policy: DefaultPolicy::Allow,
            strict_mode: false,
            audit_enabled: true,
        }
    }
}

/// 默认策略
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DefaultPolicy {
    Allow,
    Deny,
    Ask,
}

/// 沙箱统计
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SandboxStats {
    pub total_checks: usize,
    pub allowed: usize,
    pub denied: usize,
    pub asked: usize,
}

/// 工具权限沙箱
pub struct ToolSandbox {
    /// 黑名单
    blacklist: Arc<RwLock<Vec<MatchPattern>>>,
    /// 白名单
    whitelist: Arc<RwLock<Vec<MatchPattern>>>,
    /// 灰名单
    graylist: Arc<RwLock<Vec<MatchPattern>>>,
    /// 分组规则
    groups: Arc<RwLock<HashMap<String, Vec<MatchPattern>>>>,
    /// 配置
    config: Arc<RwLock<SandboxConfig>>>,
    /// 统计
    stats: Arc<RwLock<SandboxStats>>,
}

impl ToolSandbox {
    pub fn new() -> Self {
        Self {
            blacklist: Arc::new(RwLock::new(Vec::new())),
            whitelist: Arc::new(RwLock::new(Vec::new())),
            graylist: Arc::new(RwLock::new(Vec::new())),
            groups: Arc::new(RwLock::new(HashMap::new())),
            config: Arc::new(RwLock::new(SandboxConfig::default())),
            stats: Arc::new(RwLock::new(SandboxStats {
                total_checks: 0,
                allowed: 0,
                denied: 0,
                asked: 0,
            })),
        }
    }

    /// 设置默认配置
    pub fn with_config(mut self, config: SandboxConfig) -> Self {
        self.config = Arc::new(RwLock::new(config));
        self
    }

    /// 添加到黑名单
    pub async fn add_to_blacklist(&self, pattern: MatchPattern) {
        let mut blacklist = self.blacklist.write().await;
        blacklist.push(pattern);
    }

    /// 从黑名单移除
    pub async fn remove_from_blacklist(&self, pattern: &MatchPattern) {
        let mut blacklist = self.blacklist.write().await;
        blacklist.retain(|p| p != pattern);
    }

    /// 添加到白名单
    pub async fn add_to_whitelist(&self, pattern: MatchPattern) {
        let mut whitelist = self.whitelist.write().await;
        whitelist.push(pattern);
    }

    /// 从白名单移除
    pub async fn remove_from_whitelist(&self, pattern: &MatchPattern) {
        let mut whitelist = self.whitelist.write().await;
        whitelist.retain(|p| p != pattern);
    }

    /// 添加到灰名单
    pub async fn add_to_graylist(&self, pattern: MatchPattern) {
        let mut graylist = self.graylist.write().await;
        graylist.push(pattern);
    }

    /// 从灰名单移除
    pub async fn remove_from_graylist(&self, pattern: &MatchPattern) {
        let mut graylist = self.graylist.write().await;
        graylist.retain(|p| p != pattern);
    }

    /// 添加分组规则
    pub async fn add_group(&self, group_name: &str, patterns: Vec<MatchPattern>) {
        let mut groups = self.groups.write().await;
        groups.insert(group_name.to_string(), patterns);
    }

    /// 获取分组规则
    pub async fn get_group(&self, group_name: &str) -> Option<Vec<MatchPattern>> {
        let groups = self.groups.read().await;
        groups.get(group_name).cloned()
    }

    /// 检查权限
    pub async fn check_permission(&self, tool_name: &str) -> PermissionResult {
        // 更新统计
        {
            let mut stats = self.stats.write().await;
            stats.total_checks += 1;
        }

        // 1. 检查黑名单 (最高优先级)
        {
            let blacklist = self.blacklist.read().await;
            if self.matches_patterns(&blacklist, tool_name) {
                self.increment_stat(&PermissionResult::Denied {
                    reason: "命令在黑名单中".to_string(),
                }).await;
                return PermissionResult::Denied {
                    reason: "命令在黑名单中，禁止执行".to_string(),
                };
            }
        }

        // 2. 检查灰名单 (需要用户确认)
        {
            let graylist = self.graylist.read().await;
            if self.matches_patterns(&graylist, tool_name) {
                self.increment_stat(&PermissionResult::Ask {
                    tool_name: tool_name.to_string(),
                }).await;
                return PermissionResult::Ask {
                    tool_name: tool_name.to_string(),
                };
            }
        }

        // 3. 检查白名单 (如果有设置)
        {
            let whitelist = self.whitelist.read().await;
            if !whitelist.is_empty() {
                if self.matches_patterns(&whitelist, tool_name) {
                    self.increment_stat(&PermissionResult::Allowed).await;
                    return PermissionResult::Allowed;
                } else {
                    self.increment_stat(&PermissionResult::Denied {
                        reason: "命令不在白名单中".to_string(),
                    }).await;
                    return PermissionResult::Denied {
                        reason: "命令不在白名单中".to_string(),
                    };
                }
            }
        }

        // 4. 根据默认策略处理
        let config = self.config.read().await;
        let result = match config.default_policy {
            DefaultPolicy::Allow => PermissionResult::Allowed,
            DefaultPolicy::Deny => PermissionResult::Denied {
                reason: "默认策略拒绝".to_string(),
            },
            DefaultPolicy::Ask => PermissionResult::Ask {
                tool_name: tool_name.to_string(),
            },
        };

        self.increment_stat(&result).await;
        result
    }

    /// 检查是否匹配任何模式
    fn matches_patterns(&self, patterns: &[MatchPattern], tool_name: &str) -> bool {
        patterns.iter().any(|p| p.matches(tool_name))
    }

    /// 更新统计
    async fn increment_stat(&self, result: &PermissionResult) {
        let mut stats = self.stats.write().await;
        match result {
            PermissionResult::Allowed => stats.allowed += 1,
            PermissionResult::Denied { .. } => stats.denied += 1,
            PermissionResult::Ask { .. } => stats.asked += 1,
        }
    }

    /// 批量检查工具权限
    pub async fn check_batch_permissions(&self, tool_names: &[&str]) -> HashMap<String, PermissionResult> {
        let mut results = HashMap::new();
        for tool_name in tool_names {
            let result = self.check_permission(tool_name).await;
            results.insert(tool_name.to_string(), result);
        }
        results
    }

    /// 获取统计
    pub async fn get_stats(&self) -> SandboxStats {
        self.stats.read().await.clone()
    }

    /// 重置统计
    pub async fn reset_stats(&self) {
        let mut stats = self.stats.write().await;
        *stats = SandboxStats {
            total_checks: 0,
            allowed: 0,
            denied: 0,
            asked: 0,
        };
    }

    /// 清空所有规则
    pub async fn clear_all(&self) {
        let mut blacklist = self.blacklist.write().await;
        let mut whitelist = self.whitelist.write().await;
        let mut graylist = self.graylist.write().await;
        let mut groups = self.groups.write().await;
        
        blacklist.clear();
        whitelist.clear();
        graylist.clear();
        groups.clear();
    }

    /// 获取所有黑名单模式
    pub async fn get_blacklist(&self) -> Vec<MatchPattern> {
        self.blacklist.read().await.clone()
    }

    /// 获取所有白名单模式
    pub async fn get_whitelist(&self) -> Vec<MatchPattern> {
        self.whitelist.read().await.clone()
    }

    /// 获取所有灰名单模式
    pub async fn get_graylist(&self) -> Vec<MatchPattern> {
        self.graylist.read().await.clone()
    }
}

impl Default for ToolSandbox {
    fn default() -> Self {
        Self::new()
    }
}

/// 沙箱错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SandboxError {
    InvalidPattern(String),
    ExecutionFailed(String),
}

impl std::fmt::Display for SandboxError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InvalidPattern(s) => write!(f, "无效的模式: {}", s),
            Self::ExecutionFailed(s) => write!(f, "执行失败: {}", s),
        }
    }
}

impl std::error::Error for SandboxError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_blacklist() {
        let sandbox = ToolSandbox::new();
        
        // 添加黑名单
        sandbox.add_to_blacklist(MatchPattern::Exact { 
            value: "dangerous_command".to_string() 
        }).await;
        
        let result = sandbox.check_permission("dangerous_command").await;
        assert!(result.is_denied());
        
        let result = sandbox.check_permission("safe_command").await;
        assert!(result.is_allowed());
    }

    #[tokio::test]
    async fn test_whitelist() {
        let sandbox = ToolSandbox::new();
        
        // 设置白名单
        sandbox.add_to_whitelist(MatchPattern::Prefix { 
            value: "safe_".to_string() 
        }).await;
        
        let result = sandbox.check_permission("safe_read").await;
        assert!(result.is_allowed());
        
        let result = sandbox.check_permission("unsafe_write").await;
        assert!(result.is_denied());
    }

    #[tokio::test]
    async fn test_graylist() {
        let sandbox = ToolSandbox::new();
        
        // 设置灰名单
        sandbox.add_to_graylist(MatchPattern::Contains { 
            value: "system".to_string() 
        }).await;
        
        let result = sandbox.check_permission("read_system_info").await;
        assert!(result.needs_confirmation());
    }

    #[tokio::test]
    async fn test_group_pattern() {
        let sandbox = ToolSandbox::new();
        
        // 添加分组模式
        sandbox.add_to_blacklist(MatchPattern::Group { 
            value: "shell_*".to_string() 
        }).await;
        
        let result = sandbox.check_permission("shell_exec").await;
        assert!(result.is_denied());
        
        let result = sandbox.check_permission("shell_run_command").await;
        assert!(result.is_denied());
    }

    #[tokio::test]
    async fn test_regex_pattern() {
        let sandbox = ToolSandbox::new();
        
        sandbox.add_to_blacklist(MatchPattern::Regex { 
            pattern: r"^danger_.*$".to_string() 
        }).await;
        
        let result = sandbox.check_permission("danger_upload").await;
        assert!(result.is_denied());
        
        let result = sandbox.check_permission("safe_upload").await;
        assert!(result.is_allowed());
    }
}