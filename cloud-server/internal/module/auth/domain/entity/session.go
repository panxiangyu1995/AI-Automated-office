package entity

import "time"

// Session represents an authenticated login lifecycle.
type Session struct {
	ID              string     `gorm:"type:uuid;primaryKey" json:"id"`
	UserID          string     `gorm:"type:uuid;not null;index" json:"user_id"`
	TenantID        string     `gorm:"type:uuid;not null;index" json:"tenant_id"`
	AccessTokenJTI  string     `gorm:"size:128;not null;index" json:"access_token_jti"`
	RefreshTokenJTI string     `gorm:"size:128;not null;index" json:"refresh_token_jti"`
	ExpiresAt       time.Time  `gorm:"not null;index" json:"expires_at"`
	RevokedAt       *time.Time `gorm:"index" json:"revoked_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (s *Session) IsRevoked() bool {
	return s.RevokedAt != nil
}

