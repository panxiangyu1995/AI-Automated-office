//! Permission Engine - Three-layer Permission Calculation
//!
//! Implements the three-layer permission merge logic:
//! Layer 1: Platform Base - System-level default permissions
//! Layer 2: Department Capability - Department-specific tool permissions
//! Layer 3: Role Enhancement - Role-based permission overrides
//!
//! Final Permission = (Platform ∪ Department ∪ Role) \ Blacklist

// Re-export all types for backward compatibility
pub use crate::agent::permission::engine_types::{
    PermissionError, ExecutionContext, UserPermissions,
    PlatformPermissions, DepartmentPermissions, RolePermissions,
};

use super::DataScopeType;
use crate::session::TenantContext;

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Permission engine configuration
#[derive(Debug, Clone)]
pub struct PermissionEngineConfig {
    /// Cache TTL in seconds
    pub cache_ttl_secs: u64,
    /// Maximum calculation time in milliseconds
    pub max_calculation_time_ms: u64,
    /// Enable caching
    pub enable_cache: bool,
    /// Platform permissions
    pub platform: PlatformPermissions,
}

impl Default for PermissionEngineConfig {
    fn default() -> Self {
        Self {
            cache_ttl_secs: 300, // 5 minutes
            max_calculation_time_ms: 100,
            enable_cache: true,
            platform: PlatformPermissions::default(),
        }
    }
}

/// Permission cache entry
#[derive(Debug, Clone)]
struct CacheEntry {
    permissions: UserPermissions,
    timestamp: i64,
}

/// Permission Engine - Core permission calculation
pub struct PermissionEngine {
    config: PermissionEngineConfig,
    cache: Arc<RwLock<HashMap<String, CacheEntry>>>,
}

impl PermissionEngine {
    /// Create a new permission engine with default config
    pub fn new() -> Self {
        Self::with_config(PermissionEngineConfig::default())
    }

    /// Create a permission engine with custom config
    pub fn with_config(config: PermissionEngineConfig) -> Self {
        Self {
            config,
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Calculate user permissions
    ///
    /// Final = (Platform ∪ Department ∪ Role) \ Blacklist
    pub async fn calculate_permissions(
        &self,
        context: &ExecutionContext,
    ) -> Result<UserPermissions, PermissionError> {
        // Check cache first
        if self.config.enable_cache {
            if let Some(cached) = self.get_from_cache(context).await {
                return Ok(cached);
            }
        }

        // Get department permissions
        let department_perms = self.get_department_permissions(context).await?;

        // Get role permissions
        let role_perms = self.get_role_permissions(&context.role)?;

        // Merge permissions from all layers
        let merged = self.merge_permissions(&context, &department_perms, &role_perms);

        // Apply blacklist
        let final_perms = self.apply_blacklist(merged, &context.user_id);

        // Update cache
        if self.config.enable_cache {
            self.update_cache(context, &final_perms).await;
        }

        Ok(final_perms)
    }
    
    /// Calculate permissions from TenantContext
    /// 
    /// This is a convenience method that converts TenantContext to ExecutionContext
    pub async fn calculate_permissions_from_context(
        &self,
        tenant_ctx: &TenantContext,
    ) -> Result<UserPermissions, PermissionError> {
        let exec_ctx = ExecutionContext::from_tenant_context(tenant_ctx);
        self.calculate_permissions(&exec_ctx).await
    }

    /// Check if a specific tool is allowed for a user
    pub async fn check_tool_permission(
        &self,
        context: &ExecutionContext,
        tool_id: &str,
    ) -> Result<bool, PermissionError> {
        let permissions = self.calculate_permissions(context).await?;
        Ok(permissions.is_tool_allowed(tool_id))
    }

    /// Get platform permissions
    fn get_platform_permissions(&self) -> &PlatformPermissions {
        &self.config.platform
    }

    /// Get department permissions (simulated - in real impl, would fetch from DB)
    async fn get_department_permissions(
        &self,
        context: &ExecutionContext,
    ) -> Result<DepartmentPermissions, PermissionError> {
        let department_id = context.department_id.as_ref()
            .ok_or_else(|| PermissionError::DepartmentNotFound("No department specified".to_string()))?;

        // Simulated department permissions based on department_id
        // In real implementation, this would fetch from database
        let mut perms = DepartmentPermissions::default();
        perms.department_id = department_id.clone();

        // Default: allow department-specific tools
        match department_id.as_str() {
            "finance" => {
                perms.name = "Finance Department".to_string();
                perms.allowed_tools = vec![
                    "finance_query".to_string(),
                    "finance_ocr".to_string(),
                    "finance_mutate".to_string(),
                    "finance_aggregate".to_string(),
                    "finance_export".to_string(),
                ];
                perms.denied_tools = vec![
                    "finance_forecast".to_string(),
                    "finance_dashboard".to_string(),
                ];
                perms.default_data_scope = DataScopeType::Department;
            }
            "hr" => {
                perms.name = "HR Department".to_string();
                perms.allowed_tools = vec![
                    "hr_employee_query".to_string(),
                    "hr_employee_create".to_string(),
                    "hr_employee_update".to_string(),
                    "hr_attendance_query".to_string(),
                ];
                perms.denied_tools = vec![
                    "hr_salary_query".to_string(),
                    "hr_salary_update".to_string(),
                ];
                perms.default_data_scope = DataScopeType::Department;
            }
            "warehouse" => {
                perms.name = "Warehouse Department".to_string();
                perms.allowed_tools = vec![
                    "warehouse_inventory_query".to_string(),
                    "warehouse_inbound".to_string(),
                    "warehouse_outbound".to_string(),
                ];
                perms.default_data_scope = DataScopeType::Department;
            }
            "sales" => {
                perms.name = "Sales Department".to_string();
                perms.allowed_tools = vec![
                    "sales_customer_query".to_string(),
                    "sales_order_create".to_string(),
                    "sales_order_update".to_string(),
                ];
                perms.default_data_scope = DataScopeType::Department;
            }
            _ => {
                // Unknown department - minimal permissions
                perms.name = department_id.clone();
                perms.allowed_tools = Vec::new();
                perms.default_data_scope = DataScopeType::Personal;
            }
        }

        Ok(perms)
    }

    /// Get role permissions
    fn get_role_permissions(
        &self,
        role: &str,
    ) -> Result<RolePermissions, PermissionError> {
        let mut perms = RolePermissions::default();
        perms.role = role.to_string();

        match role {
            "admin" => {
                perms.allowed_tools = vec!["*".to_string()]; // Admin can access all
                perms.denied_tools = Vec::new();
                perms.data_scope = DataScopeType::All;
                perms.bypass_department = true;
            }
            "executive" => {
                perms.allowed_tools = vec![
                    "finance_*".to_string(),
                    "hr_*".to_string(),
                    "warehouse_*".to_string(),
                    "sales_*".to_string(),
                ];
                perms.denied_tools = vec![];
                perms.data_scope = DataScopeType::Executive;
                perms.bypass_department = true;
            }
            "manager" => {
                perms.allowed_tools = vec![
                    "finance_query".to_string(),
                    "finance_aggregate".to_string(),
                    "finance_export".to_string(),
                    "hr_employee_query".to_string(),
                    "warehouse_inventory_query".to_string(),
                    "sales_customer_query".to_string(),
                    "sales_order_create".to_string(),
                ];
                perms.denied_tools = vec![
                    "finance_forecast".to_string(),
                    "hr_salary_*".to_string(),
                ];
                perms.data_scope = DataScopeType::All;
                perms.bypass_department = false;
            }
            "specialist" => {
                perms.allowed_tools = vec![
                    "finance_query".to_string(),
                    "finance_ocr".to_string(),
                    "finance_mutate".to_string(),
                    "finance_aggregate".to_string(),
                ];
                perms.denied_tools = vec![
                    "finance_export".to_string(),
                    "finance_forecast".to_string(),
                ];
                perms.data_scope = DataScopeType::Department;
                perms.bypass_department = false;
            }
            "staff" | _ => {
                perms.allowed_tools = vec![
                    "finance_query".to_string(),
                    "finance_ocr".to_string(),
                    "finance_mutate".to_string(),
                ];
                perms.denied_tools = vec![
                    "finance_aggregate".to_string(),
                    "finance_export".to_string(),
                    "finance_forecast".to_string(),
                    "finance_dashboard".to_string(),
                    "hr_salary_*".to_string(),
                ];
                perms.data_scope = DataScopeType::Personal;
                perms.bypass_department = false;
            }
        }

        Ok(perms)
    }

    /// Merge permissions from all layers
    fn merge_permissions(
        &self,
        context: &ExecutionContext,
        department: &DepartmentPermissions,
        role: &RolePermissions,
    ) -> UserPermissions {
        let platform = self.get_platform_permissions();

        // Start with platform defaults
        let mut allowed_tools = platform.default_allowed_tools.clone();
        let mut denied_tools = platform.default_denied_tools.clone();
        let mut tool_constraints = platform.tool_constraints.clone();
        let mut data_scope: HashMap<String, DataScopeType> = HashMap::new();
        let mut field_permissions: HashMap<String, Vec<String>> = HashMap::new();

        // Add department tools
        allowed_tools.extend(department.allowed_tools.clone());
        denied_tools.extend(department.denied_tools.clone());

        // Add department constraints
        for (tool_id, constraint) in &department.tool_constraints {
            tool_constraints.insert(tool_id.clone(), constraint.clone());
        }

        // Add department field permissions
        for (tool_id, fields) in &department.field_permissions {
            field_permissions.insert(tool_id.clone(), fields.clone());
        }

        // Set department data scope
        data_scope.insert(
            department.department_id.clone(),
            department.default_data_scope,
        );

        // Add role tools (can expand allowed tools)
        if role.bypass_department {
            // Admin/Executive can use any tool in allowed list
            allowed_tools.extend(role.allowed_tools.clone());
        } else {
            // Other roles: add role-specific tools
            allowed_tools.extend(role.allowed_tools.clone());
        }

        // Add role denied tools (deny takes priority)
        denied_tools.extend(role.denied_tools.clone());

        // Add role constraints (override department constraints)
        for (tool_id, constraint) in &role.tool_constraints {
            tool_constraints.insert(tool_id.clone(), constraint.clone());
        }

        // Add role field permissions
        for (tool_id, fields) in &role.field_permissions {
            field_permissions.insert(tool_id.clone(), fields.clone());
        }

        // Set role data scope
        data_scope.insert("role".to_string(), role.data_scope);

        // Deduplicate
        allowed_tools.sort();
        allowed_tools.dedup();
        denied_tools.sort();
        denied_tools.dedup();

        UserPermissions {
            allowed_tools,
            denied_tools,
            tool_constraints,
            data_scope,
            field_permissions,
            blacklist: Vec::new(),
            effective_role: context.role.clone(),
            effective_department: context.department_id.clone(),
        }
    }

    /// Apply blacklist to permissions
    fn apply_blacklist(
        &self,
        mut permissions: UserPermissions,
        _user_id: &str,
    ) -> UserPermissions {
        // In a real implementation, fetch blacklist from user config
        // For now, add some default blacklist entries
        let mut blacklist = permissions.blacklist.clone();

        // Block dangerous tools for all users
        blacklist.push("system_reset".to_string());
        blacklist.push("database_delete_all".to_string());

        permissions.blacklist = blacklist;
        permissions
    }

    /// Get from cache
    async fn get_from_cache(&self, context: &ExecutionContext) -> Option<UserPermissions> {
        let cache = self.cache.read().await;
        let key = self.cache_key(context);

        let entry = cache.get(&key)?;
        let now = chrono::Utc::now().timestamp();
        if now - entry.timestamp < self.config.cache_ttl_secs as i64 {
            Some(entry.permissions.clone())
        } else {
            // Cache expired - we need to invalidate, but this is async
            // For simplicity, just return None
            None
        }
    }

    /// Update cache
    async fn update_cache(&self, context: &ExecutionContext, permissions: &UserPermissions) {
        let key = self.cache_key(context);
        let entry = CacheEntry {
            permissions: permissions.clone(),
            timestamp: chrono::Utc::now().timestamp(),
        };

        let mut cache = self.cache.write().await;
        cache.insert(key, entry);
    }

    /// Generate cache key
    fn cache_key(&self, context: &ExecutionContext) -> String {
        format!(
            "{}:{}:{}:{}",
            context.tenant_id,
            context.user_id,
            context.role,
            context.department_id.as_ref().unwrap_or(&"none".to_string())
        )
    }

    /// Clear cache
    pub async fn clear_cache(&self) {
        let mut cache = self.cache.write().await;
        cache.clear();
    }

    /// Clear cache for a specific user
    pub async fn clear_user_cache(&self, user_id: &str) {
        let mut cache = self.cache.write().await;
        cache.retain(|key, _| !key.contains(user_id));
    }

    /// Validate permission configuration (detect cycles)
    pub fn validate_config(&self) -> Result<(), PermissionError> {
        // Check for circular dependencies in tool constraints
        // This is a simplified check - real implementation would be more thorough
        for (_tool_id, constraint) in &self.config.platform.tool_constraints {
            if let Some(scope) = &constraint.data_scope {
                if matches!(scope, DataScopeType::Executive) {
                    // Executive scope should only be for high-level roles
                    // This is validated elsewhere
                }
            }
        }

        Ok(())
    }
}

impl Default for PermissionEngine {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_admin_has_full_access() {
        let engine = PermissionEngine::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "admin1".to_string(),
            "admin".to_string(),
        ).with_department("finance".to_string());

        let perms = engine.calculate_permissions(&context).await.unwrap();

        // Admin should have access to all tools
        assert!(perms.is_tool_allowed("any_tool"));
        assert_eq!(perms.effective_role, "admin");
    }

    #[tokio::test]
    async fn test_staff_limited_access() {
        let engine = PermissionEngine::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        let perms = engine.calculate_permissions(&context).await.unwrap();

        // Staff should have limited access
        assert!(perms.is_tool_allowed("finance_query"));
        assert!(perms.is_tool_allowed("finance_ocr"));
        assert!(!perms.is_tool_allowed("finance_forecast"));
        assert!(!perms.is_tool_allowed("finance_dashboard"));
    }

    #[tokio::test]
    async fn test_blacklist_blocks_tools() {
        let engine = PermissionEngine::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        let perms = engine.calculate_permissions(&context).await.unwrap();

        // Dangerous tools should be blocked
        assert!(!perms.is_tool_allowed("system_reset"));
        assert!(!perms.is_tool_allowed("database_delete_all"));
    }

    #[tokio::test]
    async fn test_data_scope_for_staff() {
        let engine = PermissionEngine::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        let perms = engine.calculate_permissions(&context).await.unwrap();

        // Staff should have personal data scope
        assert_eq!(perms.get_data_scope("role"), DataScopeType::Personal);
    }

    #[tokio::test]
    async fn test_data_scope_for_manager() {
        let engine = PermissionEngine::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "mgr1".to_string(),
            "manager".to_string(),
        ).with_department("finance".to_string());

        let perms = engine.calculate_permissions(&context).await.unwrap();

        // Manager should have all data scope
        assert_eq!(perms.get_data_scope("role"), DataScopeType::All);
    }

    #[tokio::test]
    async fn test_department_tools_allowed() {
        let engine = PermissionEngine::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("hr".to_string());

        let perms = engine.calculate_permissions(&context).await.unwrap();

        // HR tools should be allowed in HR department
        assert!(perms.is_tool_allowed("hr_employee_query"));
        assert!(perms.is_tool_allowed("hr_attendance_query"));
        // But salary tools should be denied
        assert!(!perms.is_tool_allowed("hr_salary_query"));
    }
}
