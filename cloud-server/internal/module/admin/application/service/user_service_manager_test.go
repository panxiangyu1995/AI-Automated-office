package service

import (
	"context"
	"errors"
	"testing"

	"cloud-server/internal/model"
	"cloud-server/internal/module/admin/domain/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// MockUserRepository is a mock implementation of UserRepository for testing
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) FindByID(ctx context.Context, tenantID, userID string) (*model.User, error) {
	args := m.Called(ctx, tenantID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(ctx context.Context, tenantID, email string) (*model.User, error) {
	args := m.Called(ctx, tenantID, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmployeeCode(ctx context.Context, tenantID, employeeCode string) (*model.User, error) {
	args := m.Called(ctx, tenantID, employeeCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) FindByUsername(ctx context.Context, tenantID, username string) (*model.User, error) {
	args := m.Called(ctx, tenantID, username)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.UserFilter, page, pageSize int) (*repository.UserListResult, error) {
	args := m.Called(ctx, tenantID, filter, page, pageSize)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.UserListResult), args.Error(1)
}

func (m *MockUserRepository) FindDetailByID(ctx context.Context, tenantID, userID string) (*repository.UserDetail, error) {
	args := m.Called(ctx, tenantID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.UserDetail), args.Error(1)
}

func (m *MockUserRepository) Create(ctx context.Context, user *model.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) Update(ctx context.Context, user *model.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateStatus(ctx context.Context, tenantID, userID, status string) error {
	args := m.Called(ctx, tenantID, userID, status)
	return args.Error(0)
}

func (m *MockUserRepository) ExistsByUsername(ctx context.Context, tenantID, username string) (bool, error) {
	args := m.Called(ctx, tenantID, username)
	return args.Bool(0), args.Error(1)
}

func (m *MockUserRepository) ExistsByEmployeeCode(ctx context.Context, tenantID, employeeCode string) (bool, error) {
	args := m.Called(ctx, tenantID, employeeCode)
	return args.Bool(0), args.Error(1)
}

func (m *MockUserRepository) BindDepartments(ctx context.Context, userID string, departmentIDs []string, primaryDepartmentID string) error {
	args := m.Called(ctx, userID, departmentIDs, primaryDepartmentID)
	return args.Error(0)
}

func (m *MockUserRepository) BindRoles(ctx context.Context, userID string, roleIDs []string) error {
	args := m.Called(ctx, userID, roleIDs)
	return args.Error(0)
}

func (m *MockUserRepository) GetUserDepartmentIDs(ctx context.Context, userID string) ([]string, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockUserRepository) GetUserRoleIDs(ctx context.Context, userID string) ([]string, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockUserRepository) UpdateManagerID(ctx context.Context, tenantID, userID string, managerID *string) error {
	args := m.Called(ctx, tenantID, userID, managerID)
	return args.Error(0)
}

func (m *MockUserRepository) GetManagerChain(ctx context.Context, tenantID, userID string, maxDepth int) ([]*repository.ManagerChainItem, error) {
	args := m.Called(ctx, tenantID, userID, maxDepth)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.ManagerChainItem), args.Error(1)
}

func (m *MockUserRepository) GetSubordinates(ctx context.Context, tenantID, managerID string) ([]*repository.SubordinateItem, error) {
	args := m.Called(ctx, tenantID, managerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.SubordinateItem), args.Error(1)
}

func (m *MockUserRepository) FindUserSummaries(ctx context.Context, tenantID string, userIDs []string) ([]*repository.UserSummary, error) {
	args := m.Called(ctx, tenantID, userIDs)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.UserSummary), args.Error(1)
}

func (m *MockUserRepository) SearchUsersForManager(ctx context.Context, tenantID string, query string, excludeIDs []string, limit int) ([]*repository.UserSummary, error) {
	args := m.Called(ctx, tenantID, query, excludeIDs, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*repository.UserSummary), args.Error(1)
}

// TestUpdateManager_SetSelfAsManager tests that user cannot set themselves as manager
func TestUpdateManager_SetSelfAsManager(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"
	managerID := "user-123" // Same as userID

	// Mock FindByID to return the user
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(&model.User{
		ID:       userID,
		TenantID: tenantID,
		Name:     "Test User",
	}, nil)

	err := userService.UpdateManager(context.Background(), tenantID, userID, &UpdateManagerRequest{
		ManagerID: &managerID,
	})

	assert.ErrorIs(t, err, ErrManagerCannotBeSelf)
	mockRepo.AssertExpectations(t)
}

// TestUpdateManager_UserNotFound tests error when user not found
func TestUpdateManager_UserNotFound(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"

	// Mock FindByID to return nil (user not found)
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(nil, nil)

	err := userService.UpdateManager(context.Background(), tenantID, userID, &UpdateManagerRequest{
		ManagerID: nil,
	})

	assert.ErrorIs(t, err, ErrUserNotFound)
	mockRepo.AssertExpectations(t)
}

// TestUpdateManager_CircularChainDetection tests circular chain detection
func TestUpdateManager_CircularChainDetection(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"
	managerID := "manager-456"

	// Mock FindByID to return the user
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(&model.User{
		ID:       userID,
		TenantID: tenantID,
		Name:     "Test User",
	}, nil)

	// Mock FindByID for manager
	mockRepo.On("FindByID", mock.Anything, tenantID, managerID).Return(&model.User{
		ID:       managerID,
		TenantID: tenantID,
		Name:     "Manager User",
	}, nil)

	// Mock GetSubordinates to return manager as subordinate (creating circular)
	// This means manager-456 is a subordinate of user-123, so setting manager-456 as manager creates a cycle
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, userID).Return([]*repository.SubordinateItem{
		{ID: managerID, RealName: "Manager User"},
	}, nil)

	// Note: GetManagerChain is NOT called because circular is detected first

	err := userService.UpdateManager(context.Background(), tenantID, userID, &UpdateManagerRequest{
		ManagerID: &managerID,
	})

	assert.ErrorIs(t, err, ErrCircularManagerChain)
	mockRepo.AssertExpectations(t)
}

// TestUpdateManager_Success tests successful manager update
func TestUpdateManager_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"
	managerID := "manager-456"

	// Mock FindByID to return the user
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(&model.User{
		ID:       userID,
		TenantID: tenantID,
		Name:     "Test User",
	}, nil)

	// Mock FindByID for manager
	mockRepo.On("FindByID", mock.Anything, tenantID, managerID).Return(&model.User{
		ID:       managerID,
		TenantID: tenantID,
		Name:     "Manager User",
	}, nil)

	// Mock GetSubordinates - no subordinates
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, userID).Return([]*repository.SubordinateItem{}, nil)

	// Mock GetManagerChain - empty chain
	mockRepo.On("GetManagerChain", mock.Anything, tenantID, managerID, 20).Return([]*repository.ManagerChainItem{}, nil)

	// Mock UpdateManagerID
	mockRepo.On("UpdateManagerID", mock.Anything, tenantID, userID, &managerID).Return(nil)

	err := userService.UpdateManager(context.Background(), tenantID, userID, &UpdateManagerRequest{
		ManagerID: &managerID,
	})

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// TestUpdateManager_ClearManager tests clearing manager (set to null)
func TestUpdateManager_ClearManager(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"

	// Mock FindByID to return the user
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(&model.User{
		ID:       userID,
		TenantID: tenantID,
		Name:     "Test User",
	}, nil)

	// Mock UpdateManagerID with nil
	mockRepo.On("UpdateManagerID", mock.Anything, tenantID, userID, (*string)(nil)).Return(nil)

	err := userService.UpdateManager(context.Background(), tenantID, userID, &UpdateManagerRequest{
		ManagerID: nil,
	})

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// TestGetManagerChain_Success tests getting manager chain
func TestGetManagerChain_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"

	// Mock FindByID
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(&model.User{
		ID:       userID,
		TenantID: tenantID,
		Name:     "Test User",
	}, nil)

	// Mock GetManagerChain
	expectedChain := []*repository.ManagerChainItem{
		{Level: 1, User: &repository.UserSummary{ID: "manager-1", RealName: "Manager One"}},
		{Level: 2, User: &repository.UserSummary{ID: "manager-2", RealName: "Manager Two"}},
	}
	mockRepo.On("GetManagerChain", mock.Anything, tenantID, userID, 20).Return(expectedChain, nil)

	result, err := userService.GetManagerChain(context.Background(), tenantID, userID)

	assert.NoError(t, err)
	assert.Len(t, result.Chain, 2)
	assert.Equal(t, 1, result.Chain[0].Level)
	assert.Equal(t, "Manager One", result.Chain[0].User.RealName)
	mockRepo.AssertExpectations(t)
}

// TestGetSubordinates_Success tests getting subordinates
func TestGetSubordinates_Success(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"

	// Mock FindByID
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(&model.User{
		ID:       userID,
		TenantID: tenantID,
		Name:     "Test User",
	}, nil)

	// Mock GetSubordinates
	expectedSubordinates := []*repository.SubordinateItem{
		{ID: "sub-1", RealName: "Subordinate One", Status: "active"},
		{ID: "sub-2", RealName: "Subordinate Two", Status: "active"},
	}
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, userID).Return(expectedSubordinates, nil)

	result, err := userService.GetSubordinates(context.Background(), tenantID, userID)

	assert.NoError(t, err)
	assert.Len(t, result.Items, 2)
	assert.Equal(t, "Subordinate One", result.Items[0].RealName)
	mockRepo.AssertExpectations(t)
}

// TestSearchUsersForManager_ExcludeSelf tests that user is excluded from search
func TestSearchUsersForManager_ExcludeSelf(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"
	query := "test"

	// Mock GetSubordinates - no subordinates
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, userID).Return([]*repository.SubordinateItem{}, nil)

	// Mock SearchUsersForManager - should be called with excludeIDs containing userID
	expectedResults := []*repository.UserSummary{
		{ID: "user-456", RealName: "Test User 2"},
	}
	mockRepo.On("SearchUsersForManager", mock.Anything, tenantID, query, []string{userID}, 10).Return(expectedResults, nil)

	result, err := userService.SearchUsersForManager(context.Background(), tenantID, userID, query, 10)

	assert.NoError(t, err)
	assert.Len(t, result.Items, 1)
	mockRepo.AssertExpectations(t)
}

// TestCheckCircularChain_DetectsCircular tests the circular chain detection algorithm
func TestCheckCircularChain_DetectsCircular(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	tenantID := "tenant-123"
	userID := "user-123"
	newManagerID := "user-456"

	// Create a circular reference: user-123 -> user-456 -> user-789 -> user-123
	// user-456 is a subordinate of user-123, so setting user-456 as manager creates a cycle

	// First call: GetSubordinates for user-123 returns user-456
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, "user-123").Return([]*repository.SubordinateItem{
		{ID: "user-456", RealName: "User 456"},
	}, nil).Once()

	isCircular, err := userService.checkCircularChain(context.Background(), tenantID, userID, newManagerID)

	assert.NoError(t, err)
	assert.True(t, isCircular)
	mockRepo.AssertExpectations(t)
}

// TestCheckCircularChain_NoCircular tests when no circular reference exists
func TestCheckCircularChain_NoCircular(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	tenantID := "tenant-123"
	userID := "user-123"
	newManagerID := "user-999" // This user is not a subordinate

	// GetSubordinates returns different users, not user-999
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, "user-123").Return([]*repository.SubordinateItem{
		{ID: "user-456", RealName: "User 456"},
		{ID: "user-789", RealName: "User 789"},
	}, nil).Once()

	// GetSubordinates for subordinates returns empty
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, "user-456").Return([]*repository.SubordinateItem{}, nil).Once()
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, "user-789").Return([]*repository.SubordinateItem{}, nil).Once()

	isCircular, err := userService.checkCircularChain(context.Background(), tenantID, userID, newManagerID)

	assert.NoError(t, err)
	assert.False(t, isCircular)
	mockRepo.AssertExpectations(t)
}

// TestUpdateManager_ManagerChainTooDeep tests the manager chain depth limit
func TestUpdateManager_ManagerChainTooDeep(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"
	managerID := "manager-456"

	// Mock FindByID for user
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(&model.User{
		ID:       userID,
		TenantID: tenantID,
		Name:     "Test User",
	}, nil)

	// Mock FindByID for manager
	mockRepo.On("FindByID", mock.Anything, tenantID, managerID).Return(&model.User{
		ID:       managerID,
		TenantID: tenantID,
		Name:     "Manager User",
	}, nil)

	// Mock GetSubordinates - no subordinates
	mockRepo.On("GetSubordinates", mock.Anything, tenantID, userID).Return([]*repository.SubordinateItem{}, nil)

	// Mock GetManagerChain - return 20 levels (at max)
	chain := make([]*repository.ManagerChainItem, 20)
	for i := 0; i < 20; i++ {
		chain[i] = &repository.ManagerChainItem{
			Level: i + 1,
			User:  &repository.UserSummary{ID: "manager-" + string(rune('a'+i)), RealName: "Manager"},
		}
	}
	mockRepo.On("GetManagerChain", mock.Anything, tenantID, managerID, 20).Return(chain, nil)

	err := userService.UpdateManager(context.Background(), tenantID, userID, &UpdateManagerRequest{
		ManagerID: &managerID,
	})

	assert.ErrorIs(t, err, ErrManagerChainTooDeep)
	mockRepo.AssertExpectations(t)
}

// TestUpdateManager_RepositoryError tests repository error handling
func TestUpdateManager_RepositoryError(t *testing.T) {
	mockRepo := new(MockUserRepository)
	logger := zap.NewNop()

	userService := &UserService{
		userRepo: mockRepo,
		logger:   logger,
	}

	userID := "user-123"
	tenantID := "tenant-123"

	// Mock FindByID to return error
	mockRepo.On("FindByID", mock.Anything, tenantID, userID).Return(nil, errors.New("database error"))

	err := userService.UpdateManager(context.Background(), tenantID, userID, &UpdateManagerRequest{
		ManagerID: nil,
	})

	assert.Error(t, err)
	assert.NotEqual(t, ErrUserNotFound, err)
	mockRepo.AssertExpectations(t)
}
