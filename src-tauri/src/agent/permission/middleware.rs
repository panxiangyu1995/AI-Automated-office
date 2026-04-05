//! Permission Middleware
//!
//! Integrates permission checking into the tool execution pipeline.
//! Provides middleware-style permission validation before tool execution.

use std::collections::HashMap;
use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use super::engine::{PermissionEngine, ExecutionContext, UserPermissions};
use super::field_checker::{FieldPermissionChecker, FieldAction};
use super::scope_filter::{DataScopeFilter, ScopeFilterResult};
use super::DataScopeType;

/// Permission middleware error types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PermissionMiddlewareError {
    /// Tool not allowed
    ToolNotAllowed { tool_id: String, reason: Option<String> },
    /// Field access denied
    FieldAccessDenied { field: String, reason: Option<String> },
    /// Scope violation
    ScopeViolation { requested: String, allowed: String },
    /// Permission calculation failed
    CalculationFailed { message: String },
}

/// Permission middleware result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MiddlewareResult<T = ()> {
    /// Whether the operation is allowed
    pub allowed: bool,
    /// Error details if not allowed
    pub error: Option<PermissionMiddlewareError>,
    /// Data if allowed (for filter operations)
    pub data: Option<T>,
    /// Applied scope filter
    pub scope_filter: Option<ScopeFilterResult>,
    /// Allowed fields (for field filtering)
    pub allowed_fields: Option<Vec<String>>,
}

impl<T> MiddlewareResult<T> {
    /// Create a success result
    pub fn allowed() -> Self {
        Self {
            allowed: true,
            error: None,
            data: None,
            scope_filter: None,
            allowed_fields: None,
        }
    }

    /// Create a success result with data
    pub fn allowed_with_data(data: T) -> Self {
        Self {
            allowed: true,
            error: None,
            data: Some(data),
            scope_filter: None,
            allowed_fields: None,
        }
    }

    /// Create a denial result
    pub fn denied(error: PermissionMiddlewareError) -> Self {
        Self {
            allowed: false,
            error: Some(error),
            data: None,
            scope_filter: None,
            allowed_fields: None,
        }
    }

    /// Map the data if allowed
    pub fn map<U>(self, f: impl FnOnce(T) -> U) -> MiddlewareResult<U> {
        MiddlewareResult {
            allowed: self.allowed,
            error: self.error,
            data: self.data.map(f),
            scope_filter: self.scope_filter,
            allowed_fields: self.allowed_fields,
        }
    }
}

/// Permission middleware for tool execution
pub struct PermissionMiddleware {
    engine: Arc<PermissionEngine>,
    field_checker: Arc<FieldPermissionChecker>,
    default_timeout_ms: u64,
}

impl Default for PermissionMiddleware {
    fn default() -> Self {
        Self::new()
    }
}

impl PermissionMiddleware {
    /// Create a new middleware with default configuration
    pub fn new() -> Self {
        Self {
            engine: Arc::new(PermissionEngine::new()),
            field_checker: Arc::new(FieldPermissionChecker::standard()),
            default_timeout_ms: 100,
        }
    }

    /// Create with custom engine and field checker
    pub fn with_components(
        engine: PermissionEngine,
        field_checker: FieldPermissionChecker,
    ) -> Self {
        Self {
            engine: Arc::new(engine),
            field_checker: Arc::new(field_checker),
            default_timeout_ms: 100,
        }
    }

    /// Check tool permission
    pub async fn check_tool(
        &self,
        context: &ExecutionContext,
        tool_id: &str,
    ) -> Result<MiddlewareResult, PermissionMiddlewareError> {
        // Calculate permissions
        let permissions = self.engine
            .calculate_permissions(context)
            .await
            .map_err(|e| PermissionMiddlewareError::CalculationFailed {
                message: e.to_string(),
            })?;

        // Check if tool is allowed
        if !permissions.is_tool_allowed(tool_id) {
            return Ok(MiddlewareResult::denied(
                PermissionMiddlewareError::ToolNotAllowed {
                    tool_id: tool_id.to_string(),
                    reason: Some(format!(
                        "Tool '{}' is not allowed for role '{}'",
                        tool_id, context.role
                    )),
                },
            ));
        }

        Ok(MiddlewareResult::allowed())
    }

    /// Check field permission
    pub async fn check_field(
        &self,
        context: &ExecutionContext,
        entity: &str,
        field: &str,
        action: FieldAction,
    ) -> Result<MiddlewareResult, PermissionMiddlewareError> {
        let allowed = self.field_checker.check_field_access(
            &context.role,
            entity,
            field,
            action,
        );

        if !allowed {
            return Ok(MiddlewareResult::denied(
                PermissionMiddlewareError::FieldAccessDenied {
                    field: field.to_string(),
                    reason: Some(format!(
                        "Field '{}' access denied for role '{}'",
                        field, context.role
                    )),
                },
            ));
        }

        Ok(MiddlewareResult::allowed())
    }

    /// Check and get allowed fields
    pub async fn get_allowed_fields(
        &self,
        context: &ExecutionContext,
        entity: &str,
    ) -> Result<MiddlewareResult<Vec<String>>, PermissionMiddlewareError> {
        let fields = self.field_checker.get_allowed_fields(&context.role, entity);

        Ok(MiddlewareResult {
            allowed: true,
            error: None,
            data: Some(fields),
            scope_filter: None,
            allowed_fields: None,
        })
    }

    /// Check scope permission
    pub async fn check_scope(
        &self,
        context: &ExecutionContext,
        entity_type: &str,
    ) -> Result<MiddlewareResult<ScopeFilterResult>, PermissionMiddlewareError> {
        let filter = DataScopeFilter::from_context(
            &context.user_id,
            context.department_id.as_deref(),
            &context.role,
        );

        let result = filter.get_filter_result(entity_type);

        Ok(MiddlewareResult {
            allowed: true,
            error: None,
            data: Some(result.clone()),
            scope_filter: Some(result),
            allowed_fields: None,
        })
    }

    /// Full permission check (tool + field + scope)
    pub async fn check_full(
        &self,
        context: &ExecutionContext,
        tool_id: &str,
        entity: &str,
        fields: &[String],
    ) -> Result<MiddlewareResult<FullCheckResult>, PermissionMiddlewareError> {
        // Check tool permission
        let tool_result = self.check_tool(context, tool_id).await?;
        if !tool_result.allowed {
            return Ok(tool_result.map(|_| FullCheckResult {
                allowed_tools: vec![tool_id.to_string()],
                allowed_fields: Vec::new(),
                scope_filter: None,
            }));
        }

        // Check field permissions
        let mut allowed_fields = Vec::new();
        for field in fields {
            let field_result = self.check_field(context, entity, field, FieldAction::Read).await?;
            if field_result.allowed {
                allowed_fields.push(field.clone());
            }
        }

        // Get scope filter
        let scope_result = self.check_scope(context, entity).await?;
        let scope_filter = scope_result.scope_filter.clone();

        Ok(MiddlewareResult {
            allowed: true,
            error: None,
            data: Some(FullCheckResult {
                allowed_tools: vec![tool_id.to_string()],
                allowed_fields,
                scope_filter,
            }),
            scope_filter,
            allowed_fields: Some(allowed_fields.clone()),
        })
    }

    /// Filter response data based on permissions
    pub fn filter_response<T: serde::Serialize>(
        &self,
        context: &ExecutionContext,
        entity: &str,
        data: &T,
    ) -> Result<serde_json::Value, PermissionMiddlewareError> {
        self.field_checker
            .filter_fields(data, &context.role, entity)
            .map_err(|e| PermissionMiddlewareError::CalculationFailed {
                message: e.to_string(),
            })
    }

    /// Apply scope filter to query
    pub fn apply_scope_to_query(
        &self,
        context: &ExecutionContext,
        entity_type: &str,
    ) -> String {
        DataScopeFilter::from_context(
            &context.user_id,
            context.department_id.as_deref(),
            &context.role,
        ).filter_query(
            DataScopeFilter::from_context(
                &context.user_id,
                context.department_id.as_deref(),
                &context.role,
            ).get_scope_for_entity(entity_type),
            entity_type,
        )
    }

    /// Get middleware for a specific tool execution
    pub fn for_tool(&self, tool_id: &str) -> ToolPermissionGuard {
        ToolPermissionGuard {
            middleware: self.clone(),
            tool_id: tool_id.to_string(),
        }
    }

    /// Set timeout for permission calculation
    pub fn with_timeout_ms(mut self, timeout_ms: u64) -> Self {
        self.default_timeout_ms = timeout_ms;
        self
    }
}

/// Result of full permission check
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FullCheckResult {
    /// Allowed tool IDs
    pub allowed_tools: Vec<String>,
    /// Allowed field names
    pub allowed_fields: Vec<String>,
    /// Applied scope filter
    pub scope_filter: Option<ScopeFilterResult>,
}

/// Guard for tool-specific permission checks
#[derive(Debug, Clone)]
pub struct ToolPermissionGuard {
    middleware: PermissionMiddleware,
    tool_id: String,
}

impl ToolPermissionGuard {
    /// Set the execution context
    pub fn with_context(self, context: ExecutionContext) -> ToolPermissionCheck {
        ToolPermissionCheck {
            middleware: self.middleware,
            context: Some(context),
            tool_id: self.tool_id,
            entity: None,
            fields: Vec::new(),
        }
    }
}

/// Builder for tool permission checks
#[derive(Debug, Clone)]
pub struct ToolPermissionCheck {
    middleware: PermissionMiddleware,
    context: Option<ExecutionContext>,
    tool_id: String,
    entity: Option<String>,
    fields: Vec<String>,
}

impl ToolPermissionCheck {
    /// Set the entity type
    pub fn entity(mut self, entity: &str) -> Self {
        self.entity = Some(entity.to_string());
        self
    }

    /// Add fields to check
    pub fn fields(mut self, fields: Vec<String>) -> Self {
        self.fields = fields;
        self
    }

    /// Execute the permission check
    pub async fn check(self) -> Result<MiddlewareResult<FullCheckResult>, PermissionMiddlewareError> {
        let context = self.context
            .ok_or_else(|| PermissionMiddlewareError::CalculationFailed {
                message: "Context not set".to_string(),
            })?;

        self.middleware
            .check_full(&context, &self.tool_id, self.entity.as_deref().unwrap_or("default"), &self.fields)
            .await
    }
}

/// Async permission middleware trait for integration
#[async_trait]
pub trait PermissionMiddlewareTrait: Send + Sync {
    /// Check permission before tool execution
    async fn before_execute(
        &self,
        context: &ExecutionContext,
        tool_id: &str,
    ) -> Result<MiddlewareResult, PermissionMiddlewareError>;

    /// Filter response after tool execution
    fn after_execute(
        &self,
        context: &ExecutionContext,
        entity: &str,
        response: serde_json::Value,
    ) -> Result<serde_json::Value, PermissionMiddlewareError>;
}

#[async_trait]
impl PermissionMiddlewareTrait for PermissionMiddleware {
    async fn before_execute(
        &self,
        context: &ExecutionContext,
        tool_id: &str,
    ) -> Result<MiddlewareResult, PermissionMiddlewareError> {
        self.check_tool(context, tool_id).await
    }

    fn after_execute(
        &self,
        context: &ExecutionContext,
        entity: &str,
        response: serde_json::Value,
    ) -> Result<serde_json::Value, PermissionMiddlewareError> {
        // Filter sensitive fields from response
        self.field_checker
            .filter_fields(&response, &context.role, entity)
            .map_err(|e| PermissionMiddlewareError::CalculationFailed {
                message: e.to_string(),
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_tool_permission_check() {
        let middleware = PermissionMiddleware::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        // Staff should be able to use finance_query
        let result = middleware.check_tool(&context, "finance_query").await.unwrap();
        assert!(result.allowed);

        // Staff should NOT be able to use finance_forecast
        let result = middleware.check_tool(&context, "finance_forecast").await.unwrap();
        assert!(!result.allowed);
    }

    #[tokio::test]
    async fn test_field_permission_check() {
        let middleware = PermissionMiddleware::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        // Staff can read amount field
        let result = middleware.check_field(&context, "invoice", "amount", FieldAction::Read).await.unwrap();
        assert!(result.allowed);

        // Staff cannot read bank_account field
        let result = middleware.check_field(&context, "invoice", "bank_account", FieldAction::Read).await.unwrap();
        assert!(!result.allowed);
    }

    #[tokio::test]
    async fn test_scope_filter() {
        let middleware = PermissionMiddleware::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        let result = middleware.check_scope(&context, "finance").await.unwrap();
        assert!(result.allowed);
        let scope = result.data.unwrap();
        assert_eq!(scope.scope, DataScopeType::Personal);
    }

    #[tokio::test]
    async fn test_full_check() {
        let middleware = PermissionMiddleware::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        let fields = vec!["amount".to_string(), "bank_account".to_string(), "date".to_string()];
        let result = middleware.check_full(&context, "finance_query", "invoice", &fields).await.unwrap();

        assert!(result.allowed);
        assert!(result.data.as_ref().unwrap().allowed_fields.contains(&"amount".to_string()));
        assert!(result.data.as_ref().unwrap().allowed_fields.contains(&"date".to_string()));
        assert!(!result.data.as_ref().unwrap().allowed_fields.contains(&"bank_account".to_string()));
    }

    #[test]
    fn test_filter_response() {
        let middleware = PermissionMiddleware::new();
        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        let data = serde_json::json!({
            "id": "123",
            "amount": 1000.0,
            "bank_account": "1234567890",
            "tax_id": "ABC123",
            "description": "Test"
        });

        let filtered = middleware.filter_response(&context, "expense", &data).unwrap();

        assert!(filtered.get("id").is_some());
        assert!(filtered.get("amount").is_some());
        assert!(filtered.get("description").is_some());
        assert!(filtered.get("bank_account").is_none());
        assert!(filtered.get("tax_id").is_none());
    }

    #[test]
    fn test_guard_pattern() {
        let middleware = PermissionMiddleware::new();
        let tool_guard = middleware.for_tool("finance_query");

        let context = ExecutionContext::new(
            "tenant1".to_string(),
            "user1".to_string(),
            "staff".to_string(),
        ).with_department("finance".to_string());

        let result = tokio::runtime::Runtime::new().unwrap()
            .block_on(async {
                tool_guard.with_context(context)
                    .entity("invoice")
                    .fields(vec!["amount".to_string()])
                    .check()
            });

        assert!(result.unwrap().allowed);
    }
}
