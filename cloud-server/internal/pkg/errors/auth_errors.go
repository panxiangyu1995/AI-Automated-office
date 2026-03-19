package errors

import "fmt"

type AuthError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	TraceID string `json:"trace_id,omitempty"`
}

func (e *AuthError) Error() string {
	if e.TraceID == "" {
		return fmt.Sprintf("%s: %s", e.Code, e.Message)
	}
	return fmt.Sprintf("%s: %s (trace_id=%s)", e.Code, e.Message, e.TraceID)
}

var (
	ErrInvalidCredentials = &AuthError{Code: "AUTH_001", Message: "用户名或密码错误"}
	ErrAccountLocked      = &AuthError{Code: "AUTH_002", Message: "账户已被锁定"}
	ErrAccountDisabled    = &AuthError{Code: "AUTH_003", Message: "账户已禁用"}
	ErrTokenExpired       = &AuthError{Code: "AUTH_004", Message: "令牌已过期"}
	ErrTokenInvalid       = &AuthError{Code: "AUTH_005", Message: "令牌无效"}
	ErrSessionExpired     = &AuthError{Code: "AUTH_006", Message: "会话已过期"}
)
