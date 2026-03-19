package model

import (
	"time"

	"gorm.io/datatypes"
)

// AuditLog 审计日志
type AuditLog struct {
	ID           string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID     string         `gorm:"type:uuid;not null;index" json:"tenant_id"`
	OperatorID   string         `gorm:"type:uuid" json:"operator_id,omitempty"`
	OperatorName string         `gorm:"size:255" json:"operator_name,omitempty"`
	TargetID     string         `gorm:"size:255" json:"target_id,omitempty"`
	TargetType   string         `gorm:"size:100" json:"target_type,omitempty"`
	EventType    string         `gorm:"size:100;not null" json:"event_type"`
	Resource     string         `gorm:"size:100;not null" json:"resource"`
	Action       string         `gorm:"size:50;not null" json:"action"`
	Result       string         `gorm:"size:20;not null;default:success" json:"result"`
	OldValues    datatypes.JSON `gorm:"type:jsonb" json:"old_values,omitempty"`
	NewValues    datatypes.JSON `gorm:"type:jsonb" json:"new_values,omitempty"`
	IPAddress    string         `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent    string         `gorm:"type:text" json:"user_agent,omitempty"`
	TraceID      string         `gorm:"size:100" json:"trace_id,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
}

// TableName 表名
func (AuditLog) TableName() string {
	return "audit_logs"
}

// AuditEventType 审计事件类型
const (
	EventTypeUserCreated = "user.created"
	EventTypeUserUpdated = "user.updated"
	EventTypeUserStatusChanged = "user.status_changed"
	EventTypeUserDeleted = "user.deleted"
)

// AuditResource 审计资源
const (
	ResourceUser = "user"
	ResourceRole = "role"
	ResourceDepartment = "department"
)

// AuditAction 审计动作
const (
	ActionCreate = "create"
	ActionUpdate = "update"
	ActionDelete = "delete"
	ActionEnable = "enable"
	ActionDisable = "disable"
)

// AuditResult 审计结果
const (
	ResultSuccess = "success"
	ResultFailure = "failure"
)
