package entity

import "time"

// User represents an authenticated account in a tenant.
type User struct {
	ID           string     `gorm:"type:uuid;primaryKey" json:"id"`
	Username     string     `gorm:"size:50;not null;index:idx_auth_user_tenant_username,unique" json:"username"`
	PasswordHash string     `gorm:"size:255;not null" json:"password_hash"`
	Email        string     `gorm:"size:255;not null" json:"email"`
	Status       string     `gorm:"size:20;not null;default:active" json:"status"`
	TenantID     string     `gorm:"type:uuid;not null;index:idx_auth_user_tenant_username,unique" json:"tenant_id"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (u *User) IsActive() bool {
	return u.Status == "active"
}
