package model

import (
	"time"

	"gorm.io/datatypes"
)

type Role struct {
	ID          string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID    string         `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	Code        string         `gorm:"size:50;not null" json:"code"`
	Description string         `gorm:"type:text" json:"description,omitempty"`
	IsSystem    bool           `gorm:"default:false" json:"is_system"`
	Permissions datatypes.JSON `gorm:"type:jsonb;default:'[]'" json:"permissions"`
	CreatedAt   time.Time      `json:"created_at"`
}

type UserRole struct {
	UserID    string    `gorm:"type:uuid;not null;primaryKey" json:"user_id"`
	RoleID    string    `gorm:"type:uuid;not null;primaryKey" json:"role_id"`
	CreatedAt time.Time `json:"created_at"`
}

type RolePermission struct {
	RoleID       string    `gorm:"type:uuid;not null;primaryKey" json:"role_id"`
	PermissionID string    `gorm:"type:uuid;not null;primaryKey" json:"permission_id"`
	CreatedAt    time.Time `json:"created_at"`
}
