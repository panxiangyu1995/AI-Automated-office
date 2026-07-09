package errors

import (
	"fmt"
	"time"
)

type AppError struct {
	Code           string    `json:"code"`
	Message        string    `json:"message"`
	Detail         string    `json:"detail,omitempty"`
	Details        []string  `json:"details,omitempty"`
	Status         int       `json:"status,omitempty"`
	Level          string    `json:"level,omitempty"`
	Recoverable    bool      `json:"recoverable,omitempty"`
	RecoveryAction string    `json:"recovery_action,omitempty"`
	RequestID      string    `json:"request_id,omitempty"`
	Timestamp      time.Time `json:"timestamp,omitempty"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *AppError) Is(target error) bool {
	if t, ok := target.(*AppError); ok {
		return e.Code == t.Code
	}
	return false
}

func (e *AppError) clone() *AppError {
	return &AppError{
		Code:           e.Code,
		Message:        e.Message,
		Detail:         e.Detail,
		Details:        e.Details,
		Status:         e.Status,
		Level:          e.Level,
		Recoverable:    e.Recoverable,
		RecoveryAction: e.RecoveryAction,
		RequestID:      e.RequestID,
		Timestamp:      e.Timestamp,
	}
}

func (e *AppError) WithDetail(detail string) *AppError {
	c := e.clone()
	c.Detail = detail
	return c
}

func (e *AppError) WithDetails(details []string) *AppError {
	c := e.clone()
	c.Details = details
	return c
}

func (e *AppError) WithMessage(msg string) *AppError {
	c := e.clone()
	c.Message = msg
	return c
}

func (e *AppError) WithLevel(level string) *AppError {
	c := e.clone()
	c.Level = level
	return c
}

func (e *AppError) WithRecoverable(recoverable bool, action string) *AppError {
	c := e.clone()
	c.Recoverable = recoverable
	c.RecoveryAction = action
	return c
}

func (e *AppError) WithRequestID(requestID string) *AppError {
	c := e.clone()
	c.RequestID = requestID
	return c
}

func (e *AppError) WithTimestamp(t time.Time) *AppError {
	c := e.clone()
	c.Timestamp = t
	return c
}

var (
	ErrInternal        = &AppError{Code: "SYS_INTERNAL_ERROR", Message: "服务器内部错误", Status: 500, Level: "error", Recoverable: true, RecoveryAction: "retry"}
	ErrNotFound        = &AppError{Code: "RES_NOT_FOUND", Message: "资源不存在", Status: 404, Level: "warn"}
	ErrBadRequest      = &AppError{Code: "VAL_INVALID_PARAMS", Message: "请求参数错误", Status: 400, Level: "warn"}
	ErrUnauthorized    = &AppError{Code: "AUTH_UNAUTHORIZED", Message: "未认证，请先登录", Status: 401, Level: "warn", Recoverable: true, RecoveryAction: "login"}
	ErrForbidden       = &AppError{Code: "AUTH_FORBIDDEN", Message: "无权限访问该资源", Status: 403, Level: "warn"}
	ErrConflict        = &AppError{Code: "RES_CONFLICT", Message: "资源冲突", Status: 409, Level: "warn"}
	ErrTooManyRequests = &AppError{Code: "SYS_RATE_LIMIT", Message: "请求频率过高，请稍后重试", Status: 429, Level: "warn", Recoverable: true, RecoveryAction: "retry_after"}

	ErrDatabase       = &AppError{Code: "SYS_DB_ERROR", Message: "数据库操作失败", Status: 500, Level: "error", Recoverable: true, RecoveryAction: "retry"}
	ErrValidation     = &AppError{Code: "VAL_INVALID_PARAMS", Message: "参数校验失败", Status: 400, Level: "warn"}
	ErrDuplicateEntry = &AppError{Code: "BIZ_DUPLICATE_ENTRY", Message: "记录已存在", Status: 409, Level: "warn"}
	ErrInvalidStatus  = &AppError{Code: "BIZ_INVALID_STATUS", Message: "状态不合法", Status: 400, Level: "warn"}
	ErrTenantRequired = &AppError{Code: "AUTH_TENANT_REQUIRED", Message: "缺少企业上下文", Status: 400, Level: "warn"}
	ErrTokenExpired   = &AppError{Code: "AUTH_TOKEN_EXPIRED", Message: "令牌已过期，请重新登录", Status: 401, Level: "warn", Recoverable: true, RecoveryAction: "refresh_token"}
	ErrTokenInvalid   = &AppError{Code: "AUTH_TOKEN_INVALID", Message: "令牌无效", Status: 401, Level: "warn", Recoverable: true, RecoveryAction: "login"}
	ErrPermissionDenied = &AppError{Code: "PERM_DENIED", Message: "权限不足", Status: 403, Level: "warn"}
	ErrQuotaExceeded    = &AppError{Code: "PERM_QUOTA_EXCEEDED", Message: "API 调用配额已超限", Status: 429, Level: "warn", Recoverable: true, RecoveryAction: "upgrade_plan"}
	ErrFeatureDisabled  = &AppError{Code: "PERM_FEATURE_DISABLED", Message: "该功能模块已被禁用", Status: 403, Level: "warn"}

	ErrExportNotFound    = &AppError{Code: "BIZ_EXPORT_NOT_FOUND", Message: "导出任务不存在", Status: 404, Level: "warn"}
	ErrExportFailed      = &AppError{Code: "BIZ_EXPORT_FAILED", Message: "导出任务执行失败", Status: 500, Level: "error", Recoverable: true, RecoveryAction: "retry"}
	ErrCliSourceRequired = &AppError{Code: "AUTH_CLI_SOURCE_REQUIRED", Message: "请求必须来自 CLI 客户端", Status: 403, Level: "warn"}
)

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func NewValidationError(field, message string) *AppError {
	return ErrValidation.WithDetails([]string{fmt.Sprintf("%s: %s", field, message)})
}

func NewAppError(code, message string, status int) *AppError {
	return &AppError{Code: code, Message: message, Status: status}
}

func NewValidationErrors(errs []ValidationError) *AppError {
	details := make([]string, len(errs))
	for i, e := range errs {
		details[i] = fmt.Sprintf("%s: %s", e.Field, e.Message)
	}
	return ErrValidation.WithDetails(details)
}
