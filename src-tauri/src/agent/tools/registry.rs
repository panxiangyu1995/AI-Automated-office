use std::collections::HashMap;
use std::sync::{Arc, PoisonError, RwLock};

use serde::{Deserialize, Serialize};

use super::descriptor::{validate_parameters, ToolDescriptor};

/// 工具注册表错误类型
#[derive(Debug)]
pub enum RegistryError {
    LockError(String),
}

impl std::fmt::Display for RegistryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RegistryError::LockError(msg) => write!(f, "Lock error: {}", msg),
        }
    }
}

impl std::error::Error for RegistryError {}

/// 工具权限类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolPermission {
    /// 允许访问所有工具
    All,
    /// 仅允许访问白名单中的工具
    Whitelist,
    /// 拒绝访问黑名单中的工具
    Blacklist,
}

impl Default for ToolPermission {
    fn default() -> Self {
        ToolPermission::All
    }
}

/// 工具访问策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolAccessPolicy {
    /// 权限类型
    pub permission: ToolPermission,
    /// 工具名称模式列表
    pub patterns: Vec<String>,
    /// 是否需要用户确认
    pub requires_confirmation: bool,
    /// 确认超时时间（秒）
    pub confirmation_timeout_secs: Option<u64>,
}

impl Default for ToolAccessPolicy {
    fn default() -> Self {
        Self {
            permission: ToolPermission::All,
            patterns: Vec::new(),
            requires_confirmation: false,
            confirmation_timeout_secs: None,
        }
    }
}

impl ToolAccessPolicy {
    /// 创建允许所有工具的策略
    pub fn allow_all() -> Self {
        Self {
            permission: ToolPermission::All,
            patterns: Vec::new(),
            requires_confirmation: false,
            confirmation_timeout_secs: None,
        }
    }

    /// 创建白名单策略
    pub fn whitelist(patterns: Vec<String>) -> Self {
        Self {
            permission: ToolPermission::Whitelist,
            patterns,
            requires_confirmation: false,
            confirmation_timeout_secs: None,
        }
    }

    /// 创建黑名单策略
    pub fn blacklist(patterns: Vec<String>) -> Self {
        Self {
            permission: ToolPermission::Blacklist,
            patterns,
            requires_confirmation: false,
            confirmation_timeout_secs: None,
        }
    }

    /// 设置需要确认
    pub fn with_confirmation(mut self, timeout_secs: Option<u64>) -> Self {
        self.requires_confirmation = true;
        self.confirmation_timeout_secs = timeout_secs;
        self
    }

    /// 检查工具是否允许访问
    pub fn is_allowed(&self, tool_name: &str) -> bool {
        match self.permission {
            ToolPermission::All => true,
            ToolPermission::Whitelist => {
                self.patterns.iter().any(|p| glob_match_pattern(p, tool_name))
            }
            ToolPermission::Blacklist => {
                !self.patterns.iter().any(|p| glob_match_pattern(p, tool_name))
            }
        }
    }
}

/// 工具注册表
///
/// 统一管理所有工具的注册和查询
/// 使用 Arc<RwLock> 统一并发原语，读多写少场景下性能更优
pub struct ToolRegistry {
    tools: Arc<RwLock<HashMap<String, ToolDescriptor>>>,
}

impl Default for ToolRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self {
            tools: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 安全地获取读锁，将 PoisonError 转换为 RegistryError
    fn read_tools(&self) -> Result<std::sync::RwLockReadGuard<'_, HashMap<String, ToolDescriptor>>, RegistryError> {
        self.tools.read()
            .map_err(|e: PoisonError<std::sync::RwLockReadGuard<'_, HashMap<String, ToolDescriptor>>>| {
                RegistryError::LockError(format!("Failed to acquire tools read lock: {}", e))
            })
    }

    /// 安全地获取写锁，将 PoisonError 转换为 RegistryError
    fn write_tools(&self) -> Result<std::sync::RwLockWriteGuard<'_, HashMap<String, ToolDescriptor>>, RegistryError> {
        self.tools.write()
            .map_err(|e: PoisonError<std::sync::RwLockWriteGuard<'_, HashMap<String, ToolDescriptor>>>| {
                RegistryError::LockError(format!("Failed to acquire tools write lock: {}", e))
            })
    }

    pub fn register(&self, descriptor: ToolDescriptor) -> Result<(), RegistryError> {
        let mut tools = self.write_tools()?;
        tools.insert(descriptor.id.clone(), descriptor);
        Ok(())
    }

    pub fn unregister(&self, tool_id: &str) -> Result<Option<ToolDescriptor>, RegistryError> {
        let mut tools = self.write_tools()?;
        Ok(tools.remove(tool_id))
    }

    pub fn get(&self, tool_id: &str) -> Result<Option<ToolDescriptor>, RegistryError> {
        let tools = self.read_tools()?;
        Ok(tools.get(tool_id).cloned())
    }

    pub fn list(&self) -> Result<Vec<ToolDescriptor>, RegistryError> {
        let tools = self.read_tools()?;
        Ok(tools.values().cloned().collect())
    }

    pub fn validate(
        &self,
        tool_id: &str,
        params: &serde_json::Map<String, serde_json::Value>,
    ) -> Result<Result<(), Vec<String>>, RegistryError> {
        let descriptor = match self.get(tool_id) {
            Ok(Some(d)) => d,
            Ok(None) => return Ok(Err(vec![format!("Tool not found: {}", tool_id)])),
            Err(e) => return Err(e),
        };
        Ok(validate_parameters(&descriptor, params))
    }

    /// Filter tools to only include read-only tools (for Plan mode)
    pub fn filter_readonly_tools(&self) -> Result<Vec<ToolDescriptor>, RegistryError> {
        let tools = self.read_tools()?;
        Ok(tools
            .values()
            .filter(|tool| tool.capabilities.is_read_only)
            .cloned()
            .collect())
    }

    /// Filter tools based on access policy
    pub fn filter_by_policy(
        &self,
        policy: &ToolAccessPolicy,
    ) -> Result<Vec<ToolDescriptor>, RegistryError> {
        let tools = self.read_tools()?;
        Ok(tools
            .values()
            .filter(|tool| policy.is_allowed(&tool.id))
            .cloned()
            .collect())
    }

    /// Validate tool access based on policy
    /// Returns Ok(()) if allowed, Err(message) if denied
    pub fn validate_access(
        &self,
        tool_id: &str,
        policy: &ToolAccessPolicy,
    ) -> Result<(), String> {
        if policy.is_allowed(tool_id) {
            Ok(())
        } else {
            Err(format!(
                "Tool '{}' is not allowed by current policy (type: {:?})",
                tool_id, policy.permission
            ))
        }
    }
}

// ============================================================================
// Glob Pattern Matching Utilities (same as builtin_agent_config)
// ============================================================================

/// Simple glob pattern matching for tool names
/// Supports: * (any chars), ? (single char), [abc] (char set)
fn glob_match_pattern(pattern: &str, name: &str) -> bool {
    glob_match_recursive(pattern.chars().peekable(), name.chars().peekable())
}

fn glob_match_recursive(
    mut pattern_chars: std::iter::Peekable<std::str::Chars>,
    mut name_chars: std::iter::Peekable<std::str::Chars>,
) -> bool {
    loop {
        match (pattern_chars.peek(), name_chars.peek()) {
            (None, None) => return true,
            (None, Some(_)) => return false,
            (Some(&'*'), None) => return true,
            (Some(&'*'), Some(_)) => {
                pattern_chars.next();
                let saved_pattern = pattern_chars.clone();
                let saved_name = name_chars.clone();
                
                if glob_match_recursive(pattern_chars.clone(), name_chars.clone()) {
                    return true;
                }
                
                name_chars.next();
                if glob_match_recursive(saved_pattern, name_chars.clone()) {
                    return true;
                }
                return false;
            }
            (Some(&'?'), Some(_)) => {
                pattern_chars.next();
                name_chars.next();
            }
            (Some(&'['), _) => {
                let name_char = name_chars.peek().copied();
                if !match_character_class(&mut pattern_chars, name_char) {
                    return false;
                }
                name_chars.next();
            }
            (Some(p), Some(n)) if p == n => {
                pattern_chars.next();
                name_chars.next();
            }
            (Some(_), Some(_)) => return false,
            (Some(_), None) => return false,
        }
    }
}

fn match_character_class(
    pattern_chars: &mut std::iter::Peekable<std::str::Chars>,
    name_char: Option<char>,
) -> bool {
    pattern_chars.next();

    let negated = pattern_chars.peek() == Some(&'^') || pattern_chars.peek() == Some(&'!');
    if negated {
        pattern_chars.next();
    }

    let mut matched = false;
    let mut prev_char: Option<char> = None;

    while let Some(&c) = pattern_chars.peek() {
        if c == ']' && prev_char.is_some() {
            pattern_chars.next();
            break;
        }

        if let Some(nc) = name_char {
            if c == nc {
                matched = true;
            }
            if pattern_chars.peek() == Some(&'-') {
                pattern_chars.next();
                if let Some(&end) = pattern_chars.peek() {
                    if end != ']' {
                        if nc >= c && nc <= end {
                            matched = true;
                        }
                        pattern_chars.next();
                    }
                }
            }
        }
        prev_char = Some(c);
        pattern_chars.next();
    }

    if negated { !matched } else { matched }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tool_permission_allows_all() {
        let policy = ToolAccessPolicy::allow_all();
        assert!(policy.is_allowed("any_tool"));
        assert!(policy.is_allowed("hr_employee_create"));
    }

    #[test]
    fn test_tool_permission_whitelist() {
        let policy = ToolAccessPolicy::whitelist(vec![
            "hr_*".to_string(),
            "approval_*".to_string(),
        ]);
        assert!(policy.is_allowed("hr_employee_create"));
        assert!(policy.is_allowed("approval_submit"));
        assert!(!policy.is_allowed("finance_*"));
        assert!(!policy.is_allowed("fs_write"));
    }

    #[test]
    fn test_tool_permission_blacklist() {
        let policy = ToolAccessPolicy::blacklist(vec![
            "*_delete".to_string(),
            "*_admin".to_string(),
        ]);
        assert!(policy.is_allowed("hr_employee_create"));
        assert!(!policy.is_allowed("data_delete"));
        assert!(!policy.is_allowed("user_admin"));
    }

    #[test]
    fn test_tool_policy_with_confirmation() {
        let policy = ToolAccessPolicy::allow_all().with_confirmation(Some(30));
        assert!(policy.requires_confirmation);
        assert_eq!(policy.confirmation_timeout_secs, Some(30));
    }

    #[test]
    fn test_glob_patterns() {
        let policy = ToolAccessPolicy::whitelist(vec![
            "hr_employee_*".to_string(),
            "approval_*".to_string(),
        ]);
        assert!(policy.is_allowed("hr_employee_create"));
        assert!(policy.is_allowed("hr_employee_query"));
        assert!(policy.is_allowed("approval_submit"));
        assert!(!policy.is_allowed("hr_department_create"));
    }

    #[test]
    fn test_registry_filter_by_policy() {
        let registry = ToolRegistry::new();
        
        // Note: In real usage, tools would be registered first
        // This is a simplified test showing the API
        let policy = ToolAccessPolicy::whitelist(vec!["hr_*".to_string()]);
        let filtered = registry.filter_by_policy(&policy);
        assert!(filtered.is_ok());
    }
}
