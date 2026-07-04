package errors

import "fmt"

type AppError struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Detail  string   `json:"detail,omitempty"`
	Details []string `json:"details,omitempty"`
	Status  int      `json:"-"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *AppError) WithDetail(detail string) *AppError {
	e.Detail = detail
	return e
}

func (e *AppError) WithDetails(details []string) *AppError {
	e.Details = details
	return e
}

func (e *AppError) WithMessage(msg string) *AppError {
	e.Message = msg
	return e
}

var (
	ErrInternal        = &AppError{Code: "COMMON_INTERNAL_ERROR", Message: "服务器内部错误", Status: 500}
	ErrNotFound        = &AppError{Code: "COMMON_NOT_FOUND", Message: "资源不存在", Status: 404}
	ErrBadRequest      = &AppError{Code: "COMMON_BAD_REQUEST", Message: "请求参数错误", Status: 400}
	ErrUnauthorized    = &AppError{Code: "AUTH_UNAUTHORIZED", Message: "未认证，请先登录", Status: 401}
	ErrForbidden       = &AppError{Code: "AUTH_FORBIDDEN", Message: "无权限访问该资源", Status: 403}
	ErrConflict        = &AppError{Code: "COMMON_CONFLICT", Message: "资源冲突", Status: 409}
	ErrTooManyRequests = &AppError{Code: "COMMON_RATE_LIMIT", Message: "请求频率过高，请稍后重试", Status: 429}

	ErrDatabase       = &AppError{Code: "DB_OPERATION_FAILED", Message: "数据库操作失败", Status: 500}
	ErrValidation     = &AppError{Code: "COMMON_VALIDATION_ERROR", Message: "参数校验失败", Status: 400}
	ErrDuplicateEntry = &AppError{Code: "DB_DUPLICATE_ENTRY", Message: "记录已存在", Status: 409}
	ErrInvalidStatus  = &AppError{Code: "COMMON_INVALID_STATUS", Message: "状态不合法", Status: 400}
	ErrTenantRequired = &AppError{Code: "AUTH_TENANT_REQUIRED", Message: "缺少企业上下文", Status: 400}
	ErrTokenExpired   = &AppError{Code: "AUTH_TOKEN_EXPIRED", Message: "令牌已过期，请重新登录", Status: 401}
	ErrTokenInvalid   = &AppError{Code: "AUTH_TOKEN_INVALID", Message: "令牌无效", Status: 401}
)

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func NewValidationError(field, message string) *AppError {
	return ErrValidation.WithDetails([]string{fmt.Sprintf("%s: %s", field, message)})
}

func NewValidationErrors(errs []ValidationError) *AppError {
	details := make([]string, len(errs))
	for i, e := range errs {
		details[i] = fmt.Sprintf("%s: %s", e.Field, e.Message)
	}
	return ErrValidation.WithDetails(details)
}
