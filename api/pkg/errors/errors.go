package errors

import (
	"fmt"
	"time"
)

const (
	LevelRecoverable = "recoverable"
	LevelUserAction  = "user_action"
	LevelDataIssue   = "data_issue"
	LevelSystemError = "system_error"
	LevelFatal       = "fatal"
)

type ErrorDetail struct {
	Resource string `json:"resource"`
	Action   string `json:"action"`
	Reason   string `json:"reason"`
}

type RecoveryActionInfo struct {
	Type        string `json:"type"`
	API         string `json:"api,omitempty"`
	Description string `json:"description,omitempty"`
}

type AppError struct {
	Code               string              `json:"code"`
	Message            string              `json:"message"`
	Detail             string              `json:"detail,omitempty"`
	Details            []string            `json:"details,omitempty"`
	DetailItems        []ErrorDetail       `json:"detail_items,omitempty"`
	Status             int                 `json:"status,omitempty"`
	Level              string              `json:"level,omitempty"`
	Recoverable        bool                `json:"recoverable,omitempty"`
	RecoveryAction     string              `json:"recovery_action,omitempty"`
	RecoveryActionInfo *RecoveryActionInfo `json:"recovery_action_info,omitempty"`
	RequestID          string              `json:"request_id,omitempty"`
	Timestamp          time.Time           `json:"timestamp,omitempty"`
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
		Code:               e.Code,
		Message:            e.Message,
		Detail:             e.Detail,
		Details:            e.Details,
		DetailItems:        e.DetailItems,
		Status:             e.Status,
		Level:              e.Level,
		Recoverable:        e.Recoverable,
		RecoveryAction:     e.RecoveryAction,
		RecoveryActionInfo: e.RecoveryActionInfo,
		RequestID:          e.RequestID,
		Timestamp:          e.Timestamp,
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

func (e *AppError) WithDetailItems(items []ErrorDetail) *AppError {
	c := e.clone()
	c.DetailItems = items
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

func (e *AppError) WithRecoveryActionInfo(info *RecoveryActionInfo) *AppError {
	c := e.clone()
	c.RecoveryActionInfo = info
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
	ErrInternal = &AppError{
		Code: "SYS_INTERNAL_ERROR", Message: "服务器内部错误", Status: 500,
		Level: LevelSystemError, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "retry", Description: "服务器临时故障，请稍后重试"},
	}
	ErrNotFound = &AppError{
		Code: "RES_NOT_FOUND", Message: "资源不存在", Status: 404,
		Level: LevelDataIssue,
	}
	ErrBadRequest = &AppError{
		Code: "VAL_INVALID_PARAMS", Message: "请求参数错误", Status: 400,
		Level: LevelUserAction,
	}
	ErrUnauthorized = &AppError{
		Code: "AUTH_UNAUTHORIZED", Message: "未认证，请先登录", Status: 401,
		Level: LevelUserAction, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "login", API: "POST /api/v1/auth/login", Description: "请先登录获取访问令牌"},
	}
	ErrForbidden = &AppError{
		Code: "AUTH_FORBIDDEN", Message: "无权限访问该资源", Status: 403,
		Level: LevelUserAction,
	}
	ErrConflict = &AppError{
		Code: "RES_CONFLICT", Message: "资源冲突", Status: 409,
		Level: LevelDataIssue,
	}
	ErrTooManyRequests = &AppError{
		Code: "SYS_RATE_LIMIT", Message: "请求频率过高，请稍后重试", Status: 429,
		Level: LevelRecoverable, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "retry_after", Description: "请求频率超限，请等待后重试"},
	}

	ErrDatabase = &AppError{
		Code: "SYS_DB_ERROR", Message: "数据库操作失败", Status: 500,
		Level: LevelSystemError, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "retry", Description: "数据库临时不可用，请稍后重试"},
	}
	ErrValidation = &AppError{
		Code: "VAL_INVALID_PARAMS", Message: "参数校验失败", Status: 400,
		Level: LevelUserAction,
	}
	ErrDuplicateEntry = &AppError{
		Code: "BIZ_DUPLICATE_ENTRY", Message: "记录已存在", Status: 409,
		Level: LevelDataIssue,
	}
	ErrInvalidStatus = &AppError{
		Code: "BIZ_INVALID_STATUS", Message: "状态不合法", Status: 400,
		Level: LevelDataIssue,
	}
	ErrTenantRequired = &AppError{
		Code: "AUTH_TENANT_REQUIRED", Message: "缺少企业上下文", Status: 400,
		Level: LevelUserAction,
	}
	ErrTokenExpired = &AppError{
		Code: "AUTH_TOKEN_EXPIRED", Message: "令牌已过期，请重新登录", Status: 401,
		Level: LevelRecoverable, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "refresh_token", API: "POST /api/v1/auth/refresh", Description: "访问令牌已过期，使用刷新令牌获取新令牌"},
	}
	ErrTokenInvalid = &AppError{
		Code: "AUTH_TOKEN_INVALID", Message: "令牌无效", Status: 401,
		Level: LevelUserAction, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "login", API: "POST /api/v1/auth/login", Description: "令牌无效或已撤销，请重新登录"},
	}
	ErrPermissionDenied = &AppError{
		Code: "PERM_DENIED", Message: "权限不足", Status: 403,
		Level: LevelUserAction,
	}
	ErrQuotaExceeded = &AppError{
		Code: "PERM_QUOTA_EXCEEDED", Message: "API 调用配额已超限", Status: 429,
		Level: LevelRecoverable, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "upgrade_plan", Description: "当前计划配额不足，请联系管理员升级计划"},
	}
	ErrFeatureDisabled = &AppError{
		Code: "PERM_FEATURE_DISABLED", Message: "该功能模块已被禁用", Status: 403,
		Level: LevelUserAction,
	}

	ErrExportNotFound = &AppError{
		Code: "BIZ_EXPORT_NOT_FOUND", Message: "导出任务不存在", Status: 404,
		Level: LevelDataIssue,
	}
	ErrExportFailed = &AppError{
		Code: "BIZ_EXPORT_FAILED", Message: "导出任务执行失败", Status: 500,
		Level: LevelSystemError, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "retry", Description: "导出任务执行异常，请重试"},
	}
	ErrCliSourceRequired = &AppError{
		Code: "AUTH_CLI_SOURCE_REQUIRED", Message: "请求必须来自 CLI 客户端", Status: 403,
		Level: LevelUserAction,
	}
	ErrRefreshTokenExpired = &AppError{
		Code: "AUTH_REFRESH_TOKEN_EXPIRED", Message: "刷新令牌已过期，请重新登录", Status: 401,
		Level: LevelUserAction, Recoverable: true,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "login", API: "POST /api/v1/auth/login", Description: "刷新令牌已过期，请重新登录"},
	}
	ErrRoleRequired = &AppError{
		Code: "PERM_ROLE_REQUIRED", Message: "需要指定角色权限", Status: 403,
		Level: LevelUserAction,
	}
	ErrContractLocked = &AppError{
		Code: "BIZ_CONTRACT_LOCKED", Message: "合同已锁定，不可修改", Status: 409,
		Level: LevelDataIssue,
	}
	ErrQuantityInsufficient = &AppError{
		Code: "BIZ_QUANTITY_INSUFFICIENT", Message: "库存数量不足", Status: 409,
		Level: LevelDataIssue,
	}
	ErrWorkflowParallelPending = &AppError{
		Code: "BIZ_WORKFLOW_PARALLEL_PENDING", Message: "并行审批尚未全部完成", Status: 409,
		Level: LevelDataIssue,
	}
	ErrInspectionRequired = &AppError{
		Code: "BIZ_INSPECTION_REQUIRED", Message: "采购入库需先完成质检", Status: 400,
		Level: LevelUserAction,
	}
	ErrDebugDisabled = &AppError{
		Code: "SYS_DEBUG_DISABLED", Message: "调试端点未启用", Status: 404,
		Level: LevelUserAction, Recoverable: false,
		RecoveryActionInfo: &RecoveryActionInfo{Type: "rebuild", Description: "使用 go build -tags debug 启用调试端点"},
	}
	ErrReceivableNotFound = &AppError{
		Code: "FIN_RECEIVABLE_NOT_FOUND", Message: "应收款记录不存在", Status: 404,
		Level: LevelDataIssue,
	}
	ErrPayableNotFound = &AppError{
		Code: "FIN_PAYABLE_NOT_FOUND", Message: "应付款记录不存在", Status: 404,
		Level: LevelDataIssue,
	}
)

type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func NewValidationError(field, message string) *AppError {
	return ErrValidation.WithDetailItems([]ErrorDetail{
		{Resource: field, Action: "validate", Reason: message},
	})
}

func NewAppError(code, message string, status int) *AppError {
	return &AppError{Code: code, Message: message, Status: status}
}

func NewValidationErrors(errs []ValidationError) *AppError {
	items := make([]ErrorDetail, len(errs))
	for i, e := range errs {
		items[i] = ErrorDetail{Resource: e.Field, Action: "validate", Reason: e.Message}
	}
	return ErrValidation.WithDetailItems(items)
}
