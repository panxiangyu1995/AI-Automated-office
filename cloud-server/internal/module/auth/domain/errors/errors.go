package auth

import "errors"

// 认证相关错误
var (
	// 用户相关错误
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrUserDisabled      = errors.New("user is disabled")
	ErrUserLocked        = errors.New("user is locked")

	// 密码相关错误
	ErrInvalidPassword   = errors.New("invalid password")
	ErrPasswordTooWeak   = errors.New("password is too weak")
	ErrPasswordMismatch  = errors.New("password confirmation does not match")

	// Token 相关错误
	ErrTokenExpired     = errors.New("token has expired")
	ErrTokenInvalid     = errors.New("token is invalid")
	ErrTokenRevoked     = errors.New("token has been revoked")

	// 会话相关错误
	ErrSessionNotFound  = errors.New("session not found")
	ErrSessionExpired   = errors.New("session has expired")

	// 租户相关错误
	ErrTenantNotFound   = errors.New("tenant not found")
	ErrTenantDisabled   = errors.New("tenant is disabled")

	// 权限相关错误
	ErrPermissionDenied = errors.New("permission denied")
	ErrRoleNotFound     = errors.New("role not found")

	// 登录相关错误
	ErrTooManyAttempts  = errors.New("too many login attempts")
	ErrAccountLocked    = errors.New("account is temporarily locked")

	// 通用错误
	ErrInvalidInput     = errors.New("invalid input")
	ErrInternalError    = errors.New("internal server error")
)

// AuthError 认证错误结构
type AuthError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Err     error  `json:"-"`
}

// Error 实现 error 接口
func (e *AuthError) Error() string {
	if e.Err != nil {
		return e.Err.Error()
	}
	return e.Message
}

// Unwrap 实现错误解包
func (e *AuthError) Unwrap() error {
	return e.Err
}

// NewAuthError 创建认证错误
func NewAuthError(code, message string, err error) *AuthError {
	return &AuthError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// 错误代码常量
const (
	CodeUserNotFound      = "USER_NOT_FOUND"
	CodeUserAlreadyExists = "USER_ALREADY_EXISTS"
	CodeUserDisabled      = "USER_DISABLED"
	CodeUserLocked        = "USER_LOCKED"
	CodeInvalidPassword   = "INVALID_PASSWORD"
	CodePasswordTooWeak   = "PASSWORD_TOO_WEAK"
	CodeTokenExpired      = "TOKEN_EXPIRED"
	CodeTokenInvalid      = "TOKEN_INVALID"
	CodeTokenRevoked      = "TOKEN_REVOKED"
	CodeSessionNotFound   = "SESSION_NOT_FOUND"
	CodeSessionExpired    = "SESSION_EXPIRED"
	CodeTenantNotFound    = "TENANT_NOT_FOUND"
	CodeTenantDisabled    = "TENANT_DISABLED"
	CodePermissionDenied  = "PERMISSION_DENIED"
	CodeTooManyAttempts   = "TOO_MANY_ATTEMPTS"
	CodeAccountLocked     = "ACCOUNT_LOCKED"
	CodeInvalidInput      = "INVALID_INPUT"
	CodeInternalError     = "INTERNAL_ERROR"
)
