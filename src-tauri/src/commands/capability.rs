//! Capability package management commands.
//!
//! This module exposes:
//! - Package installation (local, marketplace, URL)
//! - Security scanning and signature verification
//! - Approval workflow management
//! - Version checking and updates

use crate::capability::{
    ApprovalDecision,
    CapabilityInstaller, InstallOptions, InstallRequest, InstallResult, InstallSource,
    SandboxConfig, SandboxType, SecurityConfig,
};
use serde::{Deserialize, Serialize};

/// Install result response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum InstallResponse {
    Success {
        capability_id: String,
        installed_path: String,
        version: String,
    },
    PendingApproval {
        request_id: String,
        estimated_wait: u32,
    },
    SecurityBlocked {
        reason: String,
        details: String,
    },
    DependencyMissing {
        missing: Vec<DependencyInfoResponse>,
    },
    Error {
        code: String,
        message: String,
    },
}

/// Dependency info response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyInfoResponse {
    pub id: String,
    pub name: String,
    pub required_version: String,
    pub current_version: Option<String>,
}

/// Security scan response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityScanResponse {
    pub passed: bool,
    pub score: u32,
    pub warnings: Vec<SecurityWarningResponse>,
    pub errors: Vec<SecurityErrorResponse>,
    pub scan_duration_ms: u64,
}

/// Security warning response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SecurityWarningResponse {
    NetworkAccess { path: String },
    FileSystemAccess { path: String },
    SensitiveApi { api: String },
    DynamicCode { method: String },
}

/// Security error response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SecurityErrorResponse {
    MaliciousPattern { pattern: String, location: String },
    TamperedSignature,
    UnknownSource,
    ExcessivePermissions { required: Vec<String> },
    SuspiciousBehavior { behavior: String },
}

/// Approval request response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRequestResponse {
    pub request_id: String,
    pub package_id: String,
    pub package_name: String,
    pub requested_by: String,
    pub requested_at: i64,
    pub urgency: String,
    pub status: String,
}

/// Install a capability package from local file
#[tauri::command]
pub async fn capability_install_local(
    data: Vec<u8>,
    file_name: String,
    skip_approve: bool,
    sandbox_mode: bool,
    tenant_id: String,
    requested_by: String,
) -> Result<InstallResponse, String> {
    let installer = CapabilityInstaller::new();
    let options = InstallOptions {
        skip_approve,
        force_install: false,
        sandbox_mode,
        install_path: None,
    };

    let result = installer
        .install_from_data(data, &file_name, options, &tenant_id, &requested_by)
        .await
        .map_err(|e| e.to_string())?;

    Ok(convert_install_result(result))
}

/// Install a capability package from marketplace
#[tauri::command]
pub async fn capability_install_from_market(
    resource_id: String,
    version: Option<String>,
    marketplace: String,
    skip_approve: bool,
    sandbox_mode: bool,
) -> Result<InstallResponse, String> {
    let installer = CapabilityInstaller::new();
    let source = match marketplace.as_str() {
        "marketplace" => InstallSource::Marketplace,
        "private" => InstallSource::PrivateMarket,
        _ => InstallSource::Marketplace,
    };

    let options = InstallOptions {
        skip_approve,
        force_install: false,
        sandbox_mode,
        install_path: None,
    };

    let request = InstallRequest {
        source,
        resource_id,
        version,
        options,
        tenant_id: String::new(),
        requested_by: String::new(),
    };

    let result = installer
        .install(request)
        .await
        .map_err(|e| e.to_string())?;

    Ok(convert_install_result(result))
}

/// Install a capability package from URL
#[tauri::command]
pub async fn capability_install_from_url(
    url: String,
    version: Option<String>,
    skip_approve: bool,
    sandbox_mode: bool,
) -> Result<InstallResponse, String> {
    let installer = CapabilityInstaller::new();
    let options = InstallOptions {
        skip_approve,
        force_install: false,
        sandbox_mode,
        install_path: None,
    };

    let request = InstallRequest {
        source: InstallSource::Url,
        resource_id: url,
        version,
        options,
        tenant_id: String::new(),
        requested_by: String::new(),
    };

    let result = installer
        .install(request)
        .await
        .map_err(|e| e.to_string())?;

    Ok(convert_install_result(result))
}

/// Scan a capability package for security issues
#[tauri::command]
pub async fn capability_security_scan(data: Vec<u8>) -> Result<SecurityScanResponse, String> {
    let config = SecurityConfig::default();
    let mut scanner = crate::capability::SecurityScanner::new(config);

    let result = scanner
        .scan(&data, "unknown")
        .await
        .map_err(|e| e.to_string())?;

    Ok(SecurityScanResponse {
        passed: result.passed,
        score: result.score,
        warnings: result
            .warnings
            .into_iter()
            .map(|w| match w {
                crate::capability::SecurityWarning::NetworkAccess { path } => {
                    SecurityWarningResponse::NetworkAccess { path }
                }
                crate::capability::SecurityWarning::FileSystemAccess { path } => {
                    SecurityWarningResponse::FileSystemAccess { path }
                }
                crate::capability::SecurityWarning::SensitiveApi { api } => {
                    SecurityWarningResponse::SensitiveApi { api }
                }
                crate::capability::SecurityWarning::DynamicCode { method } => {
                    SecurityWarningResponse::DynamicCode { method }
                }
            })
            .collect(),
        errors: result
            .errors
            .into_iter()
            .map(|e| match e {
                crate::capability::SecurityError::MaliciousPattern { pattern, location } => {
                    SecurityErrorResponse::MaliciousPattern { pattern, location }
                }
                crate::capability::SecurityError::TamperedSignature => {
                    SecurityErrorResponse::TamperedSignature
                }
                crate::capability::SecurityError::UnknownSource => {
                    SecurityErrorResponse::UnknownSource
                }
                crate::capability::SecurityError::ExcessivePermissions { required } => {
                    SecurityErrorResponse::ExcessivePermissions { required }
                }
                crate::capability::SecurityError::SuspiciousBehavior { behavior } => {
                    SecurityErrorResponse::SuspiciousBehavior { behavior }
                }
            })
            .collect(),
        scan_duration_ms: result.scan_duration_ms,
    })
}

/// Submit an approval request
#[tauri::command]
pub async fn capability_submit_approval(
    package_id: String,
    reason: String,
    _urgency: String,
    _tenant_id: String,
    requested_by: String,
) -> Result<String, String> {
    // Create approval request with placeholder manifest
    let manifest = crate::capability::CapabilityPackageManifest {
        meta: crate::capability::CapabilityPackageMeta {
            package_id: package_id.clone(),
            name: package_id.clone(),
            display_name: package_id.clone(),
            version: "1.0.0".to_string(),
            description: reason.clone(),
            package_type: crate::capability::CapabilityPackageType::Extension,
            department: "custom".to_string(),
            author: requested_by.clone(),
            publisher: None,
            homepage: None,
            repository: None,
            license: "MIT".to_string(),
            keywords: vec![],
            categories: vec![],
            icon: None,
            screenshots: vec![],
            status: crate::capability::CapabilityPackageStatus::Draft,
            created_at: chrono::Utc::now().timestamp(),
            updated_at: chrono::Utc::now().timestamp(),
            published_at: None,
            download_count: 0,
            rating: None,
            rating_count: 0,
        },
        entry_points: vec![],
        tools: vec![],
        skills: vec![],
        triggers: vec![],
        permissions: vec![],
        dependencies: vec![],
        configurations: vec![],
        resources: vec![],
    };

    let request = crate::capability::ApprovalRequester::create_request(
        manifest,
        &requested_by,
        &reason,
        None,
    )
    .map_err(|e| e.to_string())?;

    Ok(request.request_id)
}

/// Get pending approval requests
#[tauri::command]
pub async fn capability_pending_approvals() -> Result<Vec<ApprovalRequestResponse>, String> {
    // Placeholder - return empty list
    Ok(vec![])
}

/// Process an approval decision
#[tauri::command]
pub async fn capability_process_approval(
    _request_id: String,
    decision: String,
    notes: Option<String>,
    user_id: String,
) -> Result<String, String> {
    let decision = match decision.as_str() {
        "approve" => ApprovalDecision::Approve {
            approver: user_id,
            decided_at: chrono::Utc::now().timestamp(),
            notes,
        },
        "reject" => ApprovalDecision::Reject {
            rejector: user_id,
            decided_at: chrono::Utc::now().timestamp(),
            reason: notes.unwrap_or_default(),
        },
        _ => {
            return Err("Invalid decision. Use 'approve' or 'reject'".to_string());
        }
    };

    let status = crate::capability::ApprovalProcessor::process(decision);
    Ok(format!("{:?}", status))
}

/// Check for capability package updates
#[tauri::command]
pub async fn capability_check_updates(
    _tenant_id: String,
) -> Result<Vec<UpdateInfoResponse>, String> {
    // Placeholder - return empty list
    Ok(vec![])
}

/// Update info response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfoResponse {
    pub package_id: String,
    pub current_version: String,
    pub latest_version: String,
}

/// Execute a capability package update
#[tauri::command]
pub async fn capability_execute_update(
    package_id: String,
    target_version: Option<String>,
) -> Result<InstallResponse, String> {
    // Placeholder - delegate to marketplace install
    capability_install_from_market(
        package_id,
        target_version,
        "marketplace".to_string(),
        false,
        true,
    )
    .await
}

/// Get sandbox configuration
#[tauri::command]
pub fn capability_get_sandbox_config() -> Result<SandboxConfig, String> {
    Ok(SandboxConfig::default())
}

/// Update sandbox configuration
#[tauri::command]
pub fn capability_update_sandbox_config(
    sandbox_type: String,
    max_memory_mb: u64,
    max_cpu_percent: u32,
    max_duration_secs: u64,
    network_allowed: bool,
) -> Result<SandboxConfig, String> {
    let sandbox_type = match sandbox_type.as_str() {
        "none" => SandboxType::None,
        "process" => SandboxType::Process,
        "wasm" => SandboxType::Wasm,
        "container" => SandboxType::Container,
        _ => SandboxType::Process,
    };

    Ok(SandboxConfig {
        sandbox_type,
        max_memory_mb,
        max_cpu_percent,
        max_duration_secs,
        network_allowed,
        filesystem_readonly: true,
        environment_vars: std::collections::HashMap::new(),
        allowed_syscalls: vec![],
        denied_syscalls: vec![],
    })
}

/// Convert internal InstallResult to response type
fn convert_install_result(result: InstallResult) -> InstallResponse {
    match result {
        InstallResult::Success {
            capability_id,
            installed_path,
            version,
        } => InstallResponse::Success {
            capability_id,
            installed_path,
            version,
        },
        InstallResult::PendingApproval {
            request_id,
            estimated_wait,
        } => InstallResponse::PendingApproval {
            request_id,
            estimated_wait,
        },
        InstallResult::SecurityBlocked { reason, details } => {
            InstallResponse::SecurityBlocked { reason, details }
        }
        InstallResult::DependencyMissing { missing } => InstallResponse::DependencyMissing {
            missing: missing
                .into_iter()
                .map(|m| DependencyInfoResponse {
                    id: m.id,
                    name: m.name,
                    required_version: m.required_version,
                    current_version: m.current_version,
                })
                .collect(),
        },
        InstallResult::Error { code, message } => InstallResponse::Error { code, message },
    }
}
