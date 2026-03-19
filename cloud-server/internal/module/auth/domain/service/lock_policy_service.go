package service

import (
	"context"
	"database/sql"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/auth/domain/repository"
)

// LockPolicyConfig holds the configuration for lock policy
type LockPolicyConfig struct {
	MaxFailedAttempts   int           // Maximum failed attempts before lockout
	LockoutDuration     time.Duration // Duration of account lockout
	AttemptWindowMinutes int          // Time window for counting failed attempts
}

// DefaultLockPolicyConfig returns the default lock policy configuration
func DefaultLockPolicyConfig() LockPolicyConfig {
	return LockPolicyConfig{
		MaxFailedAttempts:    5,
		LockoutDuration:      15 * time.Minute,
		AttemptWindowMinutes: 15,
	}
}

// LockPolicyService handles account lockout logic
type LockPolicyService struct {
	userRepo         repository.UserRepository
	loginAttemptRepo repository.LoginAttemptRepository
	config           LockPolicyConfig
	db               *sql.DB
}

// NewLockPolicyService creates a new lock policy service
func NewLockPolicyService(
	userRepo repository.UserRepository,
	loginAttemptRepo repository.LoginAttemptRepository,
	db *sql.DB,
	config LockPolicyConfig,
) *LockPolicyService {
	return &LockPolicyService{
		userRepo:         userRepo,
		loginAttemptRepo: loginAttemptRepo,
		config:           config,
		db:               db,
	}
}

// IsLocked checks if the user account is currently locked
func (s *LockPolicyService) IsLocked(user *model.User) bool {
	if user.LockedUntil == nil {
		return false
	}
	return time.Now().Before(*user.LockedUntil)
}

// GetRemainingLockTime returns the remaining lock time for a user
func (s *LockPolicyService) GetRemainingLockTime(user *model.User) time.Duration {
	if user.LockedUntil == nil {
		return 0
	}
	remaining := time.Until(*user.LockedUntil)
	if remaining < 0 {
		return 0
	}
	return remaining
}

// RecordFailedAttempt records a failed login attempt and updates the lock status
// Returns the new failed count and whether the account is now locked
func (s *LockPolicyService) RecordFailedAttempt(ctx context.Context, user *model.User) (int, bool, error) {
	newFailedCount := user.FailedLoginCount + 1
	var lockedUntil *time.Time

	isNowLocked := false

	// Check if we should lock the account
	if newFailedCount >= s.config.MaxFailedAttempts {
		lockTime := time.Now().Add(s.config.LockoutDuration)
		lockedUntil = &lockTime
		isNowLocked = true
	}

	// Update the user record
	var lockedUntilStr *string
	if lockedUntil != nil {
		str := lockedUntil.Format(time.RFC3339)
		lockedUntilStr = &str
	}

	err := s.userRepo.UpdateLoginInfo(ctx, user.ID, newFailedCount, lockedUntilStr)
	if err != nil {
		return 0, false, err
	}

	return newFailedCount, isNowLocked, nil
}

// ResetFailedAttempts resets the failed login attempts counter after successful login
func (s *LockPolicyService) ResetFailedAttempts(ctx context.Context, userID string) error {
	return s.userRepo.UpdateLoginInfo(ctx, userID, 0, nil)
}

// CheckAndClearExpiredLock checks if a user's lock has expired and clears it
func (s *LockPolicyService) CheckAndClearExpiredLock(ctx context.Context, user *model.User) (bool, error) {
	if user.LockedUntil == nil {
		return false, nil
	}

	// Lock has expired
	if time.Now().After(*user.LockedUntil) {
		err := s.userRepo.UpdateLoginInfo(ctx, user.ID, 0, nil)
		if err != nil {
			return false, err
		}
		user.LockedUntil = nil
		user.FailedLoginCount = 0
		return true, nil
	}

	return false, nil
}

// GetFailedAttemptsCount returns the number of recent failed attempts
func (s *LockPolicyService) GetFailedAttemptsCount(ctx context.Context, userID string) (int, error) {
	return s.loginAttemptRepo.GetRecentFailedCount(ctx, userID, s.config.AttemptWindowMinutes)
}
