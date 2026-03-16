package model

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Session struct {
	ID               string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID           string         `gorm:"type:uuid;not null;index" json:"user_id"`
	TenantID         string         `gorm:"type:uuid;not null;index" json:"tenant_id"`
	TokenHash        string         `gorm:"size:255;not null;index" json:"token_hash"`
	RefreshTokenHash string         `gorm:"size:255" json:"refresh_token_hash,omitempty"`
	DeviceInfo       datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"device_info"`
	IPAddress        string         `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent        string         `gorm:"type:text" json:"user_agent,omitempty"`
	ExpiresAt        time.Time      `json:"expires_at"`
	CreatedAt        time.Time      `json:"created_at"`
	LastActivityAt   time.Time      `json:"last_activity_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
