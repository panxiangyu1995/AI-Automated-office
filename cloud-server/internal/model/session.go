package model

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// SessionStatus represents the current state of a session
type SessionStatus string

const (
	SessionStatusActive     SessionStatus = "active"
	SessionStatusExpired    SessionStatus = "expired"
	SessionStatusRevoked    SessionStatus = "revoked"
	SessionStatusIdleTimeout SessionStatus = "idle_timeout"
)

// Session represents an authenticated login lifecycle.
type Session struct {
	ID               string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID           string         `gorm:"type:uuid;not null;index" json:"user_id"`
	TenantID         string         `gorm:"type:uuid;not null;index" json:"tenant_id"`
	TokenHash        string         `gorm:"size:255;not null;index" json:"token_hash"`
	RefreshTokenHash string         `gorm:"size:255" json:"refresh_token_hash,omitempty"`
	DeviceInfo       datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"device_info"`
	IPAddress        string         `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent        string         `gorm:"type:text" json:"user_agent,omitempty"`
	Status           SessionStatus  `gorm:"size:20;default:'active';index" json:"status"`
	RevokedAt        *time.Time     `gorm:"index" json:"revoked_at,omitempty"`
	RevokedReason    string         `gorm:"size:100" json:"revoked_reason,omitempty"`
	ExpiresAt        time.Time      `json:"expires_at"`
	CreatedAt        time.Time      `json:"created_at"`
	LastActivityAt   time.Time      `json:"last_activity_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// IsRevoked returns true if the session has been revoked
func (s *Session) IsRevoked() bool {
	return s.Status == SessionStatusRevoked || s.RevokedAt != nil
}

// IsExpired returns true if the session has expired
func (s *Session) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// IsIdleTimedOut checks if the session has been idle for too long
func (s *Session) IsIdleTimedOut(idleTimeout time.Duration) bool {
	if s.Status != SessionStatusActive {
		return false
	}
	return time.Since(s.LastActivityAt) > idleTimeout
}

// IsActive returns true if the session is active and not expired
func (s *Session) IsActive() bool {
	return s.Status == SessionStatusActive && !s.IsExpired()
}

// CanRefresh returns true if the session can be refreshed
func (s *Session) CanRefresh() bool {
	return s.Status == SessionStatusActive && !s.IsRevoked()
}
