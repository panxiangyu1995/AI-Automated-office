package model

import "github.com/google/uuid"

type AuditLog struct {
	TenantModel
	UserID       uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Action       string    `gorm:"type:varchar(50);not null;index" json:"action"`
	ResourceType string    `gorm:"type:varchar(50);not null;index" json:"resource_type"`
	ResourceID   string    `gorm:"type:varchar(100)" json:"resource_id,omitempty"`
	Details      string    `gorm:"type:text" json:"details,omitempty"`
	IPAddress    string    `gorm:"type:varchar(45)" json:"ip_address,omitempty"`
	UserAgent    string    `gorm:"type:varchar(500)" json:"user_agent,omitempty"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}

type AuditLogQuery struct {
	EnterpriseID string
	UserID       string
	Action       string
	ResourceType string
	StartTime    string
	EndTime      string
	Page         int
	PageSize     int
}
