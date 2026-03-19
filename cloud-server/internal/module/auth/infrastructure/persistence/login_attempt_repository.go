package persistence

import (
	"context"
	"database/sql"
	"time"

	"cloud-server/internal/module/auth/domain/entity"
	"cloud-server/internal/module/auth/domain/repository"

	"github.com/google/uuid"
)

// LoginAttemptRepositoryImpl implements LoginAttemptRepository
type LoginAttemptRepositoryImpl struct {
	db *sql.DB
}

// NewLoginAttemptRepository creates a new login attempt repository
func NewLoginAttemptRepository(db *sql.DB) repository.LoginAttemptRepository {
	return &LoginAttemptRepositoryImpl{db: db}
}

// Create records a new login attempt
func (r *LoginAttemptRepositoryImpl) Create(ctx context.Context, attempt *entity.LoginAttempt) error {
	if attempt.ID == "" {
		attempt.ID = uuid.New().String()
	}

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO login_attempts (id, user_id, tenant_id, email, ip_address, user_agent, success, failure_reason, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, attempt.ID, attempt.UserID, attempt.TenantID, attempt.Email,
		attempt.IPAddress, attempt.UserAgent, attempt.Success,
		attempt.FailureReason, attempt.CreatedAt)

	return err
}

// GetRecentFailedCount returns the number of failed attempts for a user within a time window
func (r *LoginAttemptRepositoryImpl) GetRecentFailedCount(ctx context.Context, userID string, withinMinutes int) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM login_attempts
		WHERE user_id = $1
		  AND success = FALSE
		  AND created_at > NOW() - INTERVAL '1 minute' * $2
	`, userID, withinMinutes).Scan(&count)

	if err != nil {
		return 0, err
	}

	return count, nil
}

// GetRecentAttemptsByEmail returns recent login attempts for an email address
func (r *LoginAttemptRepositoryImpl) GetRecentAttemptsByEmail(ctx context.Context, tenantID, email string, limit int) ([]*entity.LoginAttempt, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, user_id, tenant_id, email, ip_address, user_agent, success, failure_reason, created_at
		FROM login_attempts
		WHERE tenant_id = $1 AND email = $2
		ORDER BY created_at DESC
		LIMIT $3
	`, tenantID, email, limit)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attempts []*entity.LoginAttempt
	for rows.Next() {
		attempt := &entity.LoginAttempt{}
		var userID sql.NullString
		var ipAddress, userAgent, failureReason sql.NullString

		err := rows.Scan(
			&attempt.ID, &userID, &attempt.TenantID, &attempt.Email,
			&ipAddress, &userAgent, &attempt.Success, &failureReason,
			&attempt.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if userID.Valid {
			attempt.UserID = &userID.String
		}
		if ipAddress.Valid {
			attempt.IPAddress = ipAddress.String
		}
		if userAgent.Valid {
			attempt.UserAgent = userAgent.String
		}
		if failureReason.Valid {
			attempt.FailureReason = failureReason.String
		}

		attempts = append(attempts, attempt)
	}

	return attempts, nil
}

// DeleteOldAttempts removes login attempts older than the specified days
func (r *LoginAttemptRepositoryImpl) DeleteOldAttempts(ctx context.Context, olderThanDays int) error {
	cutoff := time.Now().AddDate(0, 0, -olderThanDays)
	_, err := r.db.ExecContext(ctx, `
		DELETE FROM login_attempts
		WHERE created_at < $1
	`, cutoff)

	return err
}
