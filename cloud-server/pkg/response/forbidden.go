package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// 标准错误码常量
const (
	// 租户相关错误
	ErrTenantRequired = "TENANT_REQUIRED"
	ErrTenantInvalid  = "TENANT_INVALID"
	ErrTenantInactive = "TENANT_INACTIVE"

	// 认证相关错误
	ErrAuthRequired      = "AUTH_REQUIRED"
	ErrInvalidAuthFormat = "INVALID_AUTH_FORMAT"
	ErrTokenInvalid      = "TOKEN_INVALID"
	ErrTokenExpired      = "TOKEN_EXPIRED"
	ErrTokenRevoked      = "TOKEN_REVOKED"
	ErrUserNotFound      = "USER_NOT_FOUND"
	ErrUserInactive      = "USER_INACTIVE"

	// 权限相关错误
	ErrPermissionDenied = "PERMISSION_DENIED"
	ErrPermissionError  = "PERMISSION_ERROR"
)

// ForbiddenResponse 标准 403 响应契约
type ForbiddenResponse struct {
	Success           bool              `json:"success"`
	Code              string            `json:"code"`
	HTTPStatus        int               `json:"http_status"`
	Message           string            `json:"message"`
	Resource          string            `json:"resource,omitempty"`
	RequiredPermission string            `json:"required_permission,omitempty"`
	ApplyEntry        string            `json:"apply_entry,omitempty"`
	TraceID           string            `json:"trace_id,omitempty"`
	Details           map[string]string `json:"details,omitempty"`
}

// Forbidden 返回标准 403 响应
func Forbidden(c *gin.Context, resp ForbiddenResponse) {
	resp.Success = false
	resp.HTTPStatus = http.StatusForbidden
	if resp.Code == "" {
		resp.Code = ErrPermissionDenied
	}
	if resp.Message == "" {
		resp.Message = "当前账号无权限执行该操作"
	}
	c.JSON(http.StatusForbidden, resp)
}

// Unauthorized 返回标准 401 响应
func Unauthorized(c *gin.Context, code string, message string) {
	c.JSON(http.StatusUnauthorized, ApiError{
		Success: false,
		Code:    code,
		Message: message,
	})
}

// TenantError 返回租户相关错误
func TenantError(c *gin.Context, code string, message string) {
	status := http.StatusBadRequest
	switch code {
	case ErrTenantInvalid, ErrTenantInactive:
		status = http.StatusForbidden
	}
	c.JSON(status, ApiError{
		Success: false,
		Code:    code,
		Message: message,
	})
}

// AuthError 返回认证相关错误
func AuthError(c *gin.Context, code string, message string) {
	c.JSON(http.StatusUnauthorized, ApiError{
		Success: false,
		Code:    code,
		Message: message,
	})
}
