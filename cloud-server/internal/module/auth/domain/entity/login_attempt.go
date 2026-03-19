package entity

import (
	"time"
)

// LoginAttempt represents a login attempt record
type LoginAttempt struct {
	ID            string     `json:"id"`
	UserID        *string    `json:"user_id,omitempty"`
	TenantID      string     `json:"tenant_id"`
	Email         string     `json:"email"`
	IPAddress     string     `json:"ip_address,omitempty"`
	UserAgent     string     `json:"user_agent,omitempty"`
	Success       bool       `json:"success"`
	FailureReason string     `json:"failure_reason,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}

// Failure reasons
const (
	FailureReasonInvalidPassword = "invalid_password"
	FailureReasonUserNotFound    = "user_not_found"
	FailureReasonAccountLocked   = "account_locked"
	FailureReasonAccountDisabled = "account_disabled"
	FailureReasonTooManyAttempts = "too_many_attempts"
)

// NewSuccessfulAttempt creates a successful login attempt record
func NewSuccessfulAttempt(userID, tenantID, email, ipAddress, userAgent string) *LoginAttempt {
	now := time.Now()
	return &LoginAttempt{
		UserID:    &userID,
		TenantID:  tenantID,
		Email:     email,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Success:   true,
		CreatedAt: now,
	}
}

// NewFailedAttempt creates a failed login attempt record
func NewFailedAttempt(tenantID, email, ipAddress, userAgent, reason string) *LoginAttempt {
	now := time.Now()
	return &LoginAttempt{
		TenantID:      tenantID,
		Email:         email,
		IPAddress:     ipAddress,
		UserAgent:     userAgent,
		Success:       false,
		FailureReason: reason,
		CreatedAt:     now,
	}
}

// NewFailedAttemptWithUser creates a failed login attempt record with user ID
func NewFailedAttemptWithUser(userID, tenantID, email, ipAddress, userAgent, reason string) *LoginAttempt {
	now := time.Now()
	return &LoginAttempt{
		UserID:        &userID,
		TenantID:      tenantID,
		Email:         email,
		IPAddress:     ipAddress,
		UserAgent:     userAgent,
		Success:       false,
		FailureReason: reason,
		CreatedAt:     now,
	}
}
