package errors

import "net/http"

// Error codes
const (
	// General errors
	ErrBadRequest          = "ERR_BAD_REQUEST"
	ErrUnauthorized         = "ERR_UNAUTHORIZED"
	ErrForbidden            = "ERR_FORBIDDEN"
	ErrNotFound             = "ERR_NOT_FOUND"
	ErrConflict             = "ERR_CONFLICT"
	ErrInternal             = "ERR_INTERNAL"
	ErrValidationFailed     = "ERR_VALIDATION_FAILED"
	ErrRateLimitExceeded    = "ERR_RATE_LIMIT_EXCEEDED"
	ErrServiceUnavailable   = "ERR_SERVICE_UNAVAILABLE"

	// Authentication errors
	ErrAuthRequired         = "AUTH_REQUIRED"
	ErrInvalidCredentials   = "AUTH_INVALID_CREDENTIALS"
	ErrTokenExpired         = "AUTH_TOKEN_EXPIRED"
	ErrTokenInvalid         = "AUTH_TOKEN_INVALID"
	ErrTokenRevoked         = "AUTH_TOKEN_REVOKED"
	ErrSessionExpired       = "AUTH_SESSION_EXPIRED"
	ErrSessionNotFound      = "AUTH_SESSION_NOT_FOUND"
	ErrAccountLocked        = "AUTH_ACCOUNT_LOCKED"
	ErrAccountDisabled      = "AUTH_ACCOUNT_DISABLED"
	ErrPasswordExpired      = "AUTH_PASSWORD_EXPIRED"
	ErrMFARequired          = "AUTH_MFA_REQUIRED"

	// Permission errors
	ErrPermissionDenied     = "PERM_DENIED"
	ErrDataScopeDenied      = "PERM_DATA_SCOPE_DENIED"
	ErrFieldAccessDenied    = "PERM_FIELD_ACCESS_DENIED"
	ErrResourceAccessDenied = "PERM_RESOURCE_ACCESS_DENIED"

	// User errors
	ErrUserNotFound         = "USER_NOT_FOUND"
	ErrUserAlreadyExists    = "USER_ALREADY_EXISTS"
	ErrUserInactive         = "USER_INACTIVE"
	ErrUserLocked           = "USER_LOCKED"

	// Tenant errors
	ErrTenantRequired       = "TENANT_REQUIRED"
	ErrTenantInvalid        = "TENANT_INVALID"
	ErrTenantInactive       = "TENANT_INACTIVE"

	// Import/Export errors
	ErrImportFailed         = "IMPORT_FAILED"
	ErrExportFailed         = "EXPORT_FAILED"
	ErrInvalidFileFormat    = "INVALID_FILE_FORMAT"
	ErrFileTooLarge         = "FILE_TOO_LARGE"

	// Sync errors
	ErrSyncConflict         = "SYNC_CONFLICT"
	ErrSyncFailed           = "SYNC_FAILED"
	ErrVersionMismatch      = "VERSION_MISMATCH"
)

// Error code to message mapping
var errorMessages = map[string]string{
	ErrBadRequest:          "请求参数错误",
	ErrUnauthorized:       "未授权访问",
	ErrForbidden:           "禁止访问",
	ErrNotFound:            "资源不存在",
	ErrConflict:            "资源冲突",
	ErrInternal:            "服务器内部错误",
	ErrValidationFailed:    "数据验证失败",
	ErrRateLimitExceeded:   "请求过于频繁",
	ErrServiceUnavailable:  "服务暂不可用",

	ErrAuthRequired:        "需要登录认证",
	ErrInvalidCredentials:  "用户名或密码错误",
	ErrTokenExpired:        "登录已过期，请重新登录",
	ErrTokenInvalid:        "登录令牌无效",
	ErrTokenRevoked:        "登录令牌已失效",
	ErrSessionExpired:      "会话已过期",
	ErrSessionNotFound:     "会话不存在",
	ErrAccountLocked:       "账号已被锁定",
	ErrAccountDisabled:     "账号已被禁用",
	ErrPasswordExpired:     "密码已过期",
	ErrMFARequired:         "需要多因素认证",

	ErrPermissionDenied:    "没有权限执行此操作",
	ErrDataScopeDenied:    "数据范围受限",
	ErrFieldAccessDenied:  "字段访问被拒绝",
	ErrResourceAccessDenied: "资源访问被拒绝",

	ErrUserNotFound:        "用户不存在",
	ErrUserAlreadyExists:   "用户已存在",
	ErrUserInactive:       "用户已被禁用",
	ErrUserLocked:         "用户已被锁定",

	ErrTenantRequired:      "缺少租户标识",
	ErrTenantInvalid:       "租户无效",
	ErrTenantInactive:      "租户已停用",

	ErrImportFailed:        "导入失败",
	ErrExportFailed:        "导出失败",
	ErrInvalidFileFormat:   "文件格式不支持",
	ErrFileTooLarge:        "文件大小超出限制",

	ErrSyncConflict:        "数据同步冲突",
	ErrSyncFailed:          "数据同步失败",
	ErrVersionMismatch:     "数据版本不匹配",
}

// GetMessage returns the default message for an error code
func GetMessage(code string) string {
	if msg, ok := errorMessages[code]; ok {
		return msg
	}
	return "未知错误"
}

// GetHTTPStatus returns the HTTP status code for an error code
func GetHTTPStatus(code string) int {
	switch code {
	case ErrBadRequest, ErrValidationFailed:
		return http.StatusBadRequest
	case ErrUnauthorized:
		return http.StatusUnauthorized
	case ErrForbidden, ErrPermissionDenied, ErrDataScopeDenied,
		ErrFieldAccessDenied, ErrResourceAccessDenied,
		ErrAccountLocked, ErrAccountDisabled, ErrUserInactive, ErrUserLocked,
		ErrTenantInvalid, ErrTenantInactive:
		return http.StatusForbidden
	case ErrNotFound, ErrUserNotFound:
		return http.StatusNotFound
	case ErrConflict, ErrUserAlreadyExists:
		return http.StatusConflict
	case ErrRateLimitExceeded:
		return http.StatusTooManyRequests
	case ErrServiceUnavailable:
		return http.StatusServiceUnavailable
	case ErrInternal, ErrImportFailed, ErrExportFailed,
		ErrSyncFailed, ErrVersionMismatch:
		return http.StatusInternalServerError
	default:
		return http.StatusInternalServerError
	}
}
