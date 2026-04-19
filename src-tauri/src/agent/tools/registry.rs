use std::collections::HashMap;
use std::sync::{Arc, PoisonError, RwLock};

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
}
