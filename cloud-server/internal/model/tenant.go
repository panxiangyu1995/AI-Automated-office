package model

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Tenant struct {
	ID           string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name         string         `gorm:"size:255;not null" json:"name"`
	Slug         string         `gorm:"size:100;not null;uniqueIndex" json:"slug"`
	Plan         string         `gorm:"size:50;default:free" json:"plan"`
	MaxUsers     int            `gorm:"default:10" json:"max_users"`
	MaxStorageGB int            `gorm:"default:10" json:"max_storage_gb"`
	Status       string         `gorm:"size:20;default:active" json:"status"`
	Settings     datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"settings"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}
