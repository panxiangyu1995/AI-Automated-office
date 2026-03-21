// Package errors provides standardized error codes and error types for the API.
package errors

// Standard error codes for API responses.
// Format: DOMAIN_NUMBER (e.g., AUTH_001, USER_001)
const (
	// ==================== General Errors (GEN_xxx) ====================
	ErrBadRequest          = "GEN_001" // Invalid request format or parameters
	ErrNotFound            = "GEN_002" // Resource not found
	ErrConflict            = "GEN_003" // Resource conflict (e.g., duplicate)
	ErrInternal            = "GEN_004" // Internal server error
	ErrServiceUnavailable  = "GEN_005" // Service temporarily unavailable
	ErrRateLimited         = "GEN_006" // Rate limit exceeded
	ErrValidationFailed    = "GEN_007" // Request validation failed

	// ==================== Authentication Errors (AUTH_xxx) ====================
	ErrAuthRequired        = "AUTH_001" // Authentication required
	ErrInvalidCredentials  = "AUTH_002" // Invalid username or password
	ErrTokenInvalid        = "AUTH_003" // Invalid token
	ErrTokenExpired        = "AUTH_004" // Token has expired
	ErrTokenRevoked        = "AUTH_005" // Token has been revoked
	ErrSessionExpired      = "AUTH_006" // Session has expired
	ErrAccountLocked       = "AUTH_007" // Account is locked
	ErrAccountDisabled     = "AUTH_008" // Account is disabled
	ErrAccountInactive     = "AUTH_009" // Account is inactive
	ErrInvalidAuthFormat   = "AUTH_010" // Invalid authorization header format
	ErrRefreshTokenInvalid = "AUTH_011" // Invalid refresh token
	ErrMFARequired         = "AUTH_012" // Multi-factor authentication required

	// ==================== Tenant Errors (TENANT_xxx) ====================
	ErrTenantRequired      = "TENANT_001" // Tenant ID required
	ErrTenantInvalid       = "TENANT_002" // Invalid tenant ID
	ErrTenantInactive      = "TENANT_003" // Tenant is inactive
	ErrTenantNotFound      = "TENANT_004" // Tenant not found
	ErrTenantExpired       = "TENANT_005" // Tenant subscription expired

	// ==================== Permission Errors (PERM_xxx) ====================
	ErrPermissionDenied    = "PERM_001" // Permission denied
	ErrRoleNotFound        = "PERM_002" // Role not found
	ErrRoleAlreadyExists   = "PERM_003" // Role already exists
	ErrPermissionNotFound  = "PERM_004" // Permission not found
	ErrDataScopeDenied     = "PERM_005" // Data scope access denied
	ErrFieldPermissionDenied = "PERM_006" // Field permission denied
	ErrPermissionExpired   = "PERM_007" // Permission has expired

	// ==================== User Errors (USER_xxx) ====================
	ErrUserNotFound        = "USER_001" // User not found
	ErrUserAlreadyExists   = "USER_002" // User already exists
	ErrUserInactive        = "USER_003" // User is inactive
	ErrUserLocked          = "USER_004" // User is locked
	ErrInvalidUserId       = "USER_005" // Invalid user ID format
	ErrEmailAlreadyUsed    = "USER_006" // Email already in use
	ErrPhoneAlreadyUsed    = "USER_007" // Phone already in use
	ErrEmployeeCodeExists  = "USER_008" // Employee code already exists
	ErrCannotDeleteSelf    = "USER_009" // Cannot delete self
	ErrCannotModifySelf    = "USER_010" // Cannot modify certain fields of self

	// ==================== Department Errors (DEPT_xxx) ====================
	ErrDeptNotFound        = "DEPT_001" // Department not found
	ErrDeptAlreadyExists   = "DEPT_002" // Department already exists
	ErrDeptHasChildren     = "DEPT_003" // Department has child departments
	ErrDeptHasUsers        = "DEPT_004" // Department has users
	ErrDeptCircularRef     = "DEPT_005" // Circular reference detected
	ErrCannotMoveRoot      = "DEPT_006" // Cannot move root department

	// ==================== Role Errors (ROLE_xxx) ====================
	ErrRoleInUse           = "ROLE_001" // Role is in use by users
	ErrCannotModifyBuiltin = "ROLE_002" // Cannot modify built-in role
	ErrInvalidRoleId       = "ROLE_003" // Invalid role ID format

	// ==================== Import/Export Errors (IMP_xxx) ====================
	ErrImportFailed        = "IMP_001" // Import operation failed
	ErrExportFailed        = "IMP_002" // Export operation failed
	ErrInvalidFileFormat   = "IMP_003" // Invalid file format
	ErrFileTooLarge        = "IMP_004" // File size exceeds limit
	ErrImportInProgress    = "IMP_005" // Import already in progress
	ErrTemplateNotFound    = "IMP_006" // Template not found

	// ==================== Session Errors (SESS_xxx) ====================
	ErrSessionNotFound     = "SESS_001" // Session not found
	ErrSessionRevoked      = "SESS_002" // Session has been revoked
	ErrSessionMaxReached   = "SESS_003" // Maximum sessions reached

	// ==================== Audit Errors (AUDIT_xxx) ====================
	ErrAuditLogNotFound    = "AUDIT_001" // Audit log not found
	ErrAuditExportFailed   = "AUDIT_002" // Audit export failed
)

// Error messages for error codes.
var errorMessages = map[string]string{
	// General
	ErrBadRequest:          "Invalid request format or parameters",
	ErrNotFound:            "Resource not found",
	ErrConflict:            "Resource conflict",
	ErrInternal:            "Internal server error",
	ErrServiceUnavailable:  "Service temporarily unavailable",
	ErrRateLimited:         "Rate limit exceeded",
	ErrValidationFailed:    "Request validation failed",

	// Auth
	ErrAuthRequired:        "Authentication required",
	ErrInvalidCredentials:  "Invalid username or password",
	ErrTokenInvalid:        "Invalid token",
	ErrTokenExpired:        "Token has expired",
	ErrTokenRevoked:        "Token has been revoked",
	ErrSessionExpired:      "Session has expired",
	ErrAccountLocked:       "Account is locked",
	ErrAccountDisabled:     "Account is disabled",
	ErrAccountInactive:     "Account is inactive",
	ErrInvalidAuthFormat:   "Invalid authorization header format",
	ErrRefreshTokenInvalid: "Invalid refresh token",
	ErrMFARequired:         "Multi-factor authentication required",

	// Tenant
	ErrTenantRequired:      "Tenant ID required",
	ErrTenantInvalid:       "Invalid tenant ID",
	ErrTenantInactive:      "Tenant is inactive",
	ErrTenantNotFound:      "Tenant not found",
	ErrTenantExpired:       "Tenant subscription expired",

	// Permission
	ErrPermissionDenied:      "Permission denied",
	ErrRoleNotFound:          "Role not found",
	ErrRoleAlreadyExists:     "Role already exists",
	ErrPermissionNotFound:    "Permission not found",
	ErrDataScopeDenied:       "Data scope access denied",
	ErrFieldPermissionDenied: "Field permission denied",
	ErrPermissionExpired:     "Permission has expired",

	// User
	ErrUserNotFound:        "User not found",
	ErrUserAlreadyExists:   "User already exists",
	ErrUserInactive:        "User is inactive",
	ErrUserLocked:          "User is locked",
	ErrInvalidUserId:       "Invalid user ID format",
	ErrEmailAlreadyUsed:    "Email already in use",
	ErrPhoneAlreadyUsed:    "Phone already in use",
	ErrEmployeeCodeExists:  "Employee code already exists",
	ErrCannotDeleteSelf:    "Cannot delete your own account",
	ErrCannotModifySelf:    "Cannot modify this field on your own account",

	// Department
	ErrDeptNotFound:        "Department not found",
	ErrDeptAlreadyExists:   "Department already exists",
	ErrDeptHasChildren:     "Cannot delete department with child departments",
	ErrDeptHasUsers:        "Cannot delete department with users",
	ErrDeptCircularRef:     "Circular reference detected",
	ErrCannotMoveRoot:      "Cannot move root department",

	// Role
	ErrRoleInUse:           "Role is in use and cannot be deleted",
	ErrCannotModifyBuiltin: "Cannot modify built-in role",
	ErrInvalidRoleId:       "Invalid role ID format",

	// Import/Export
	ErrImportFailed:        "Import operation failed",
	ErrExportFailed:        "Export operation failed",
	ErrInvalidFileFormat:   "Invalid file format",
	ErrFileTooLarge:        "File size exceeds limit",
	ErrImportInProgress:    "Import already in progress",
	ErrTemplateNotFound:    "Template not found",

	// Session
	ErrSessionNotFound:     "Session not found",
	ErrSessionRevoked:      "Session has been revoked",
	ErrSessionMaxReached:   "Maximum number of sessions reached",

	// Audit
	ErrAuditLogNotFound:    "Audit log not found",
	ErrAuditExportFailed:   "Audit export failed",
}

// GetMessage returns the error message for a given error code.
func GetMessage(code string) string {
	if msg, ok := errorMessages[code]; ok {
		return msg
	}
	return "Unknown error"
}
