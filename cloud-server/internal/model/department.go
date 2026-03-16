package model

import (
	"time"

	"gorm.io/gorm"
)

type Department struct {
	ID        string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID  string         `gorm:"type:uuid;not null;index" json:"tenant_id"`
	ParentID  *string        `gorm:"type:uuid;index" json:"parent_id,omitempty"`
	Name      string         `gorm:"size:255;not null" json:"name"`
	Code      string         `gorm:"size:50" json:"code,omitempty"`
	ManagerID *string        `gorm:"type:uuid;index" json:"manager_id,omitempty"`
	Level     int            `gorm:"default:1" json:"level"`
	Path      string         `gorm:"size:500" json:"path,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
