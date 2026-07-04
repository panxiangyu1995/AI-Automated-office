package errors

import "fmt"

type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
	Status  int    `json:"-"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *AppError) WithDetail(detail string) *AppError {
	e.Detail = detail
	return e
}

var (
	ErrInternal       = &AppError{Code: "INTERNAL_ERROR", Message: "服务器内部错误", Status: 500}
	ErrNotFound       = &AppError{Code: "NOT_FOUND", Message: "资源不存在", Status: 404}
	ErrBadRequest     = &AppError{Code: "BAD_REQUEST", Message: "请求参数错误", Status: 400}
	ErrUnauthorized   = &AppError{Code: "UNAUTHORIZED", Message: "未认证", Status: 401}
	ErrForbidden      = &AppError{Code: "FORBIDDEN", Message: "无权限访问", Status: 403}
	ErrConflict       = &AppError{Code: "CONFLICT", Message: "资源冲突", Status: 409}
	ErrTooManyRequests = &AppError{Code: "TOO_MANY_REQUESTS", Message: "请求频率过高", Status: 429}

	ErrDatabase       = &AppError{Code: "DB_ERROR", Message: "数据库操作失败", Status: 500}
	ErrValidation     = &AppError{Code: "VALIDATION_ERROR", Message: "参数校验失败", Status: 400}
	ErrDuplicateEntry = &AppError{Code: "DUPLICATE_ENTRY", Message: "记录已存在", Status: 409}
	ErrInvalidStatus  = &AppError{Code: "INVALID_STATUS", Message: "状态不合法", Status: 400}
)
