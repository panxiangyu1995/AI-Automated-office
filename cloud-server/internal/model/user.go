package model

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type User struct {
	ID               string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID         string         `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Email            string         `gorm:"size:255;not null" json:"email"`
	PasswordHash     string         `gorm:"size:255;not null" json:"password_hash"`
	Name             string         `gorm:"size:255;not null" json:"name"`
	AvatarURL        string         `gorm:"type:text" json:"avatar_url,omitempty"`
	EmployeeID       string         `gorm:"size:50" json:"employee_id,omitempty"`
	Phone            string         `gorm:"size:50" json:"phone,omitempty"`
	ManagerID        *string        `gorm:"type:uuid;index" json:"manager_id,omitempty"`
	Status           string         `gorm:"size:20;default:active" json:"status"`
	EmailVerified    bool           `gorm:"default:false" json:"email_verified"`
	LastLoginAt      *time.Time     `json:"last_login_at,omitempty"`
	FailedLoginCount int            `gorm:"default:0" json:"failed_login_count"`
	LockedUntil      *time.Time     `json:"locked_until,omitempty"`
	Preferences      datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"preferences"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
