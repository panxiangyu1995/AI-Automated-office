//! Package permission controller.

use std::collections::HashSet;
use std::sync::Arc;

use anyhow::Result;

use super::super::types::*;

/// Audit event
#[derive(Debug, Clone)]
pub struct AuditEvent {
    pub event_type: String,
    pub user_id: String,
    pub package_id: String,
    pub permission: String,
    pub timestamp: i64,
    pub details: Option<String>,
}

/// Permission service trait
#[async_trait::async_trait]
pub trait PermissionService: Send + Sync {
    async fn check_permission(&self, user_id: &str, permission: &str) -> Result<bool>;
    async fn grant_permission(
        &self,
        user_id: &str,
        permission: &str,
        reason: &str,
    ) -> Result<()>;
    async fn revoke_permission(&self, user_id: &str, permission: &str) -> Result<()>;
}

/// Audit logger trait
#[async_trait::async_trait]
pub trait AuditLogger: Send + Sync {
    async fn log(&self, event: AuditEvent) -> Result<()>;
}

/// Capability package permission controller
pub struct PackagePermissionController {
    permission_service: Arc<dyn PermissionService>,
    audit_logger: Arc<dyn AuditLogger>,
}

impl PackagePermissionController {
    /// Create a new permission controller
    pub fn new(
        permission_service: Arc<dyn PermissionService>,
        audit_logger: Arc<dyn AuditLogger>,
    ) -> Self {
        Self {
            permission_service,
            audit_logger,
        }
    }

    /// Check if user has permission to install package
    pub async fn check_install_permission(
        &self,
        package: &CapabilityPackageManifest,
        user_id: &str,
    ) -> Result<bool> {
        for perm in &package.permissions {
            if perm.required {
                let has_permission = self
                    .permission_service
                    .check_permission(user_id, &perm.permission)
                    .await?;

                if !has_permission {
                    self.audit_logger
                        .log(AuditEvent {
                            event_type: "package_permission_denied".to_string(),
                            user_id: user_id.to_string(),
                            package_id: package.meta.package_id.clone(),
                            permission: perm.permission.clone(),
                            timestamp: chrono::Utc::now().timestamp(),
                            details: Some(perm.reason.clone()),
                        })
                        .await?;

                    return Ok(false);
                }
            }
        }

        Ok(true)
    }

    /// Grant permissions required by package
    pub async fn grant_package_permissions(
        &self,
        package: &CapabilityPackageManifest,
        user_id: &str,
    ) -> Result<()> {
        for perm in &package.permissions {
            if perm.required {
                self.permission_service
                    .grant_permission(user_id, &perm.permission, &perm.reason)
                    .await?;
            }
        }

        self.audit_logger
            .log(AuditEvent {
                event_type: "package_permissions_granted".to_string(),
                user_id: user_id.to_string(),
                package_id: package.meta.package_id.clone(),
                permission: "all".to_string(),
                timestamp: chrono::Utc::now().timestamp(),
                details: None,
            })
            .await?;

        Ok(())
    }

    /// Revoke permissions when package is uninstalled
    pub async fn revoke_package_permissions(
        &self,
        package: &CapabilityPackageManifest,
        user_id: &str,
    ) -> Result<()> {
        for perm in &package.permissions {
            if perm.required {
                self.permission_service
                    .revoke_permission(user_id, &perm.permission)
                    .await?;
            }
        }

        self.audit_logger
            .log(AuditEvent {
                event_type: "package_permissions_revoked".to_string(),
                user_id: user_id.to_string(),
                package_id: package.meta.package_id.clone(),
                permission: "all".to_string(),
                timestamp: chrono::Utc::now().timestamp(),
                details: None,
            })
            .await?;

        Ok(())
    }

    /// Check runtime permission
    pub async fn check_runtime_permission(
        &self,
        package: &CapabilityPackageManifest,
        user_id: &str,
        operation: &str,
    ) -> Result<bool> {
        // Check if operation requires special permission
        for perm in &package.permissions {
            if perm.permission == operation || perm.permission == "*" {
                return self
                    .permission_service
                    .check_permission(user_id, &perm.permission)
                    .await;
            }
        }

        // No special permission required
        Ok(true)
    }
}

/// Simple in-memory permission service (for testing or standalone use)
pub struct SimplePermissionService {
    permissions: std::sync::RwLock<HashMap<String, HashSet<String>>>,
}

impl SimplePermissionService {
    pub fn new() -> Self {
        Self {
            permissions: std::sync::RwLock::new(HashMap::new()),
        }
    }
}

use std::collections::HashMap;

#[async_trait::async_trait]
impl PermissionService for SimplePermissionService {
    async fn check_permission(&self, user_id: &str, permission: &str) -> Result<bool> {
        let permissions = self.permissions.read().unwrap();
        Ok(permissions
            .get(user_id)
            .map(|perms| perms.contains(permission))
            .unwrap_or(false))
    }

    async fn grant_permission(
        &self,
        user_id: &str,
        permission: &str,
        _reason: &str,
    ) -> Result<()> {
        let mut permissions = self.permissions.write().unwrap();
        permissions
            .entry(user_id.to_string())
            .or_insert_with(HashSet::new)
            .insert(permission.to_string());
        Ok(())
    }

    async fn revoke_permission(&self, user_id: &str, permission: &str) -> Result<()> {
        let mut permissions = self.permissions.write().unwrap();
        if let Some(perms) = permissions.get_mut(user_id) {
            perms.remove(permission);
        }
        Ok(())
    }
}

/// Simple audit logger (logs to console)
pub struct SimpleAuditLogger;

impl SimpleAuditLogger {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait::async_trait]
impl AuditLogger for SimpleAuditLogger {
    async fn log(&self, event: AuditEvent) -> Result<()> {
        tracing::info!(
            "Audit: {} - user={} package={} permission={} at {}",
            event.event_type,
            event.user_id,
            event.package_id,
            event.permission,
            event.timestamp
        );
        Ok(())
    }
}
