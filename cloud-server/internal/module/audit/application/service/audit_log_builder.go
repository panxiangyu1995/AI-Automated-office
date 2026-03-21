package service

import (
	"time"

	"cloud-server/internal/model"

	"gorm.io/datatypes"
)

// AuditLogBuilder 审计日志构建器（流式 API）
type AuditLogBuilder struct {
	log *model.AuditLog
}

// NewAuditLogBuilder 创建审计日志构建器
func NewAuditLogBuilder() *AuditLogBuilder {
	return &AuditLogBuilder{
		log: &model.AuditLog{
			CreatedAt: time.Now(),
		},
	}
}

// Tenant 设置租户 ID
func (b *AuditLogBuilder) Tenant(tenantID string) *AuditLogBuilder {
	b.log.TenantID = tenantID
	return b
}

// Operator 设置操作者
func (b *AuditLogBuilder) Operator(operatorID, operatorName string) *AuditLogBuilder {
	b.log.OperatorID = operatorID
	b.log.OperatorName = operatorName
	return b
}

// Target 设置目标
func (b *AuditLogBuilder) Target(targetID, targetType string) *AuditLogBuilder {
	b.log.TargetID = targetID
	b.log.TargetType = targetType
	return b
}

// EventType 设置事件类型
func (b *AuditLogBuilder) EventType(eventType string) *AuditLogBuilder {
	b.log.EventType = eventType
	return b
}

// Resource 设置资源
func (b *AuditLogBuilder) Resource(resource string) *AuditLogBuilder {
	b.log.Resource = resource
	return b
}

// Action 设置操作
func (b *AuditLogBuilder) Action(action string) *AuditLogBuilder {
	b.log.Action = action
	return b
}

// Result 设置结果
func (b *AuditLogBuilder) Result(result string) *AuditLogBuilder {
	b.log.Result = result
	return b
}

// ResultSuccess 设置成功结果
func (b *AuditLogBuilder) ResultSuccess() *AuditLogBuilder {
	return b.Result("success")
}

// ResultFailure 设置失败结果
func (b *AuditLogBuilder) ResultFailure() *AuditLogBuilder {
	return b.Result("failure")
}

// OldValues 设置旧值
func (b *AuditLogBuilder) OldValues(values datatypes.JSON) *AuditLogBuilder {
	b.log.OldValues = values
	return b
}

// OldValuesString 设置旧值（字符串）
func (b *AuditLogBuilder) OldValuesString(values string) *AuditLogBuilder {
	b.log.OldValues = datatypes.JSON(values)
	return b
}

// NewValues 设置新值
func (b *AuditLogBuilder) NewValues(values datatypes.JSON) *AuditLogBuilder {
	b.log.NewValues = values
	return b
}

// NewValuesString 设置新值（字符串）
func (b *AuditLogBuilder) NewValuesString(values string) *AuditLogBuilder {
	b.log.NewValues = datatypes.JSON(values)
	return b
}

// IPAddress 设置 IP 地址
func (b *AuditLogBuilder) IPAddress(ip string) *AuditLogBuilder {
	b.log.IPAddress = ip
	return b
}

// UserAgent 设置 User-Agent
func (b *AuditLogBuilder) UserAgent(ua string) *AuditLogBuilder {
	b.log.UserAgent = ua
	return b
}

// TraceID 设置追踪 ID
func (b *AuditLogBuilder) TraceID(traceID string) *AuditLogBuilder {
	b.log.TraceID = traceID
	return b
}

// CreatedAt 设置创建时间
func (b *AuditLogBuilder) CreatedAt(t time.Time) *AuditLogBuilder {
	b.log.CreatedAt = t
	return b
}

// Build 构建审计日志
func (b *AuditLogBuilder) Build() *model.AuditLog {
	return b.log
}

// --- 预定义事件类型常量 ---

const (
	// 事件类型
	EventTypeAuth     = "auth"
	EventTypeUser     = "user"
	EventTypeTenant   = "tenant"
	EventTypeSession  = "session"
	EventTypeRole     = "role"
	EventTypePerm     = "permission"
	EventTypeData     = "data"
	EventTypeSystem   = "system"
	EventTypeSecurity = "security"
)

// --- 常用操作常量 ---

const (
	ActionCreate  = "create"
	ActionUpdate  = "update"
	ActionDelete  = "delete"
	ActionRead    = "read"
	ActionLogin   = "login"
	ActionLogout  = "logout"
	ActionExport  = "export"
	ActionImport  = "import"
	ActionGrant   = "grant"
	ActionRevoke  = "revoke"
	ActionEnable  = "enable"
	ActionDisable = "disable"
	ActionApprove = "approve"
	ActionReject  = "reject"
)

// --- 便捷构建方法 ---

// BuildLoginLog 构建登录日志
func BuildLoginLog(tenantID, operatorID, operatorName, ip, userAgent string, success bool) *model.AuditLog {
	builder := NewAuditLogBuilder().
		Tenant(tenantID).
		Operator(operatorID, operatorName).
		EventType(EventTypeAuth).
		Resource("session").
		Action(ActionLogin).
		IPAddress(ip).
		UserAgent(userAgent)

	if success {
		builder.ResultSuccess()
	} else {
		builder.ResultFailure()
	}

	return builder.Build()
}

// BuildLogoutLog 构建登出日志
func BuildLogoutLog(tenantID, operatorID, operatorName string) *model.AuditLog {
	return NewAuditLogBuilder().
		Tenant(tenantID).
		Operator(operatorID, operatorName).
		EventType(EventTypeAuth).
		Resource("session").
		Action(ActionLogout).
		ResultSuccess().
		Build()
}

// BuildUserCreateLog 构建用户创建日志
func BuildUserCreateLog(tenantID, operatorID, operatorName, targetUserID string, newValues datatypes.JSON) *model.AuditLog {
	return NewAuditLogBuilder().
		Tenant(tenantID).
		Operator(operatorID, operatorName).
		Target(targetUserID, "user").
		EventType(EventTypeUser).
		Resource("user").
		Action(ActionCreate).
		NewValues(newValues).
		ResultSuccess().
		Build()
}

// BuildUserUpdateLog 构建用户更新日志
func BuildUserUpdateLog(tenantID, operatorID, operatorName, targetUserID string, oldValues, newValues datatypes.JSON) *model.AuditLog {
	return NewAuditLogBuilder().
		Tenant(tenantID).
		Operator(operatorID, operatorName).
		Target(targetUserID, "user").
		EventType(EventTypeUser).
		Resource("user").
		Action(ActionUpdate).
		OldValues(oldValues).
		NewValues(newValues).
		ResultSuccess().
		Build()
}

// BuildUserDeleteLog 构建用户删除日志
func BuildUserDeleteLog(tenantID, operatorID, operatorName, targetUserID string, oldValues datatypes.JSON) *model.AuditLog {
	return NewAuditLogBuilder().
		Tenant(tenantID).
		Operator(operatorID, operatorName).
		Target(targetUserID, "user").
		EventType(EventTypeUser).
		Resource("user").
		Action(ActionDelete).
		OldValues(oldValues).
		ResultSuccess().
		Build()
}

// BuildSessionRevokeLog 构建会话撤销日志
func BuildSessionRevokeLog(tenantID, operatorID, operatorName, targetSessionID, reason string) *model.AuditLog {
	return NewAuditLogBuilder().
		Tenant(tenantID).
		Operator(operatorID, operatorName).
		Target(targetSessionID, "session").
		EventType(EventTypeSession).
		Resource("session").
		Action(ActionRevoke).
		NewValuesString(reason).
		ResultSuccess().
		Build()
}