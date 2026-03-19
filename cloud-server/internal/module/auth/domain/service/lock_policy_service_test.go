package service

import (
	"context"
	"testing"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/auth/domain/entity"
	"cloud-server/internal/module/auth/domain/repository"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockUserRepository is a mock implementation of UserRepository for testing
type MockUserRepository struct {
	UpdateLoginInfoFunc func(ctx context.Context, userID string, failedCount int, lockedUntil *string) error
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, tenantID, email string) (*model.User, error) {
	return nil, nil
}

func (m *MockUserRepository) FindByID(ctx context.Context, tenantID, userID string) (*model.User, error) {
	return nil, nil
}

func (m *MockUserRepository) Create(ctx context.Context, user *model.User) error {
	return nil
}

func (m *MockUserRepository) Update(ctx context.Context, user *model.User) error {
	return nil
}

func (m *MockUserRepository) UpdateLoginInfo(ctx context.Context, userID string, failedCount int, lockedUntil *string) error {
	if m.UpdateLoginInfoFunc != nil {
		return m.UpdateLoginInfoFunc(ctx, userID, failedCount, lockedUntil)
	}
	return nil
}

func (m *MockUserRepository) GetUserWithRole(ctx context.Context, tenantID, email string) (*repository.UserWithRole, error) {
	return nil, nil
}

// MockLoginAttemptRepository is a mock implementation for testing
type MockLoginAttemptRepository struct{}

func (m *MockLoginAttemptRepository) Create(ctx context.Context, attempt *entity.LoginAttempt) error {
	return nil
}

func (m *MockLoginAttemptRepository) GetRecentFailedCount(ctx context.Context, userID string, withinMinutes int) (int, error) {
	return 0, nil
}

func (m *MockLoginAttemptRepository) GetRecentAttemptsByEmail(ctx context.Context, tenantID, email string, limit int) ([]*entity.LoginAttempt, error) {
	return nil, nil
}

func (m *MockLoginAttemptRepository) DeleteOldAttempts(ctx context.Context, olderThanDays int) error {
	return nil
}

func TestLockPolicyService_IsLocked(t *testing.T) {
	tests := []struct {
		name        string
		lockedUntil *time.Time
		expected    bool
	}{
		{
			name:        "no lock",
			lockedUntil: nil,
			expected:    false,
		},
		{
			name:        "locked in future",
			lockedUntil: timePtr(time.Now().Add(10 * time.Minute)),
			expected:    true,
		},
		{
			name:        "lock expired",
			lockedUntil: timePtr(time.Now().Add(-10 * time.Minute)),
			expected:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, _, _ := sqlmock.New()
			defer db.Close()

			mockUserRepo := &MockUserRepository{}
			mockLoginAttemptRepo := &MockLoginAttemptRepository{}

			service := NewLockPolicyService(
				mockUserRepo,
				mockLoginAttemptRepo,
				db,
				DefaultLockPolicyConfig(),
			)

			user := &model.User{
				ID:          "test-user",
				LockedUntil: tt.lockedUntil,
			}

			result := service.IsLocked(user)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestLockPolicyService_GetRemainingLockTime(t *testing.T) {
	tests := []struct {
		name        string
		lockedUntil *time.Time
		expectZero  bool
	}{
		{
			name:        "no lock",
			lockedUntil: nil,
			expectZero:  true,
		},
		{
			name:        "locked in future",
			lockedUntil: timePtr(time.Now().Add(10 * time.Minute)),
			expectZero:  false,
		},
		{
			name:        "lock expired",
			lockedUntil: timePtr(time.Now().Add(-10 * time.Minute)),
			expectZero:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, _, _ := sqlmock.New()
			defer db.Close()

			mockUserRepo := &MockUserRepository{}
			mockLoginAttemptRepo := &MockLoginAttemptRepository{}

			service := NewLockPolicyService(
				mockUserRepo,
				mockLoginAttemptRepo,
				db,
				DefaultLockPolicyConfig(),
			)

			user := &model.User{
				ID:          "test-user",
				LockedUntil: tt.lockedUntil,
			}

			remaining := service.GetRemainingLockTime(user)
			if tt.expectZero {
				assert.Equal(t, time.Duration(0), remaining)
			} else {
				assert.Greater(t, remaining, time.Duration(0))
			}
		})
	}
}

func TestLockPolicyService_RecordFailedAttempt(t *testing.T) {
	config := DefaultLockPolicyConfig()
	config.MaxFailedAttempts = 3

	tests := []struct {
		name          string
		failedCount   int
		expectLocked  bool
		expectedCount int
	}{
		{
			name:          "first failure",
			failedCount:   0,
			expectLocked:  false,
			expectedCount: 1,
		},
		{
			name:          "second failure",
			failedCount:   1,
			expectLocked:  false,
			expectedCount: 2,
		},
		{
			name:          "third failure - should lock",
			failedCount:   2,
			expectLocked:  true,
			expectedCount: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db, _, _ := sqlmock.New()
			defer db.Close()

			var capturedFailedCount int
			var capturedLockedUntil *string

			mockUserRepo := &MockUserRepository{
				UpdateLoginInfoFunc: func(ctx context.Context, userID string, failedCount int, lockedUntil *string) error {
					capturedFailedCount = failedCount
					capturedLockedUntil = lockedUntil
					return nil
				},
			}
			mockLoginAttemptRepo := &MockLoginAttemptRepository{}

			service := NewLockPolicyService(
				mockUserRepo,
				mockLoginAttemptRepo,
				db,
				config,
			)

			user := &model.User{
				ID:               "test-user",
				FailedLoginCount: tt.failedCount,
			}

			count, locked, err := service.RecordFailedAttempt(context.Background(), user)

			require.NoError(t, err)
			assert.Equal(t, tt.expectedCount, count)
			assert.Equal(t, tt.expectLocked, locked)
			assert.Equal(t, tt.expectedCount, capturedFailedCount)

			if tt.expectLocked {
				assert.NotNil(t, capturedLockedUntil)
			} else {
				assert.Nil(t, capturedLockedUntil)
			}
		})
	}
}

func TestDefaultLockPolicyConfig(t *testing.T) {
	config := DefaultLockPolicyConfig()

	assert.Equal(t, 5, config.MaxFailedAttempts)
	assert.Equal(t, 15*time.Minute, config.LockoutDuration)
	assert.Equal(t, 15, config.AttemptWindowMinutes)
}

// Helper function
func timePtr(t time.Time) *time.Time {
	return &t
}
