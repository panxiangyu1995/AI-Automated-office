package repository

import (
	"context"

	"cloud-server/internal/module/auth/domain/entity"
)

// LoginAttemptRepository defines the interface for login attempt persistence
type LoginAttemptRepository interface {
	// Create records a new login attempt
	Create(ctx context.Context, attempt *entity.LoginAttempt) error

	// GetRecentFailedCount returns the number of failed attempts for a user within a time window
	GetRecentFailedCount(ctx context.Context, userID string, withinMinutes int) (int, error)

	// GetRecentAttemptsByEmail returns recent login attempts for an email address
	GetRecentAttemptsByEmail(ctx context.Context, tenantID, email string, limit int) ([]*entity.LoginAttempt, error)

	// DeleteOldAttempts removes login attempts older than the specified days
	DeleteOldAttempts(ctx context.Context, olderThanDays int) error
}
