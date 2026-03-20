package service

import (
	"context"
	"testing"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockPermissionOverrideRepository is a mock for PermissionOverrideRepository
type MockPermissionOverrideRepository struct {
	mock.Mock
}

func (m *MockPermissionOverrideRepository) FindByID(ctx context.Context, id string) (*model.PermissionOverride, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PermissionOverride), args.Error(1)
}

func (m *MockPermissionOverrideRepository) FindByUserID(ctx context.Context, userID string) ([]*model.PermissionOverride, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.PermissionOverride), args.Error(1)
}

func (m *MockPermissionOverrideRepository) FindByUserIDAndResource(ctx context.Context, userID, resource string) ([]*model.PermissionOverride, error) {
	args := m.Called(ctx, userID, resource)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.PermissionOverride), args.Error(1)
}

func (m *MockPermissionOverrideRepository) FindEffectiveByUserID(ctx context.Context, userID string) ([]*model.PermissionOverride, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.PermissionOverride), args.Error(1)
}

func (m *MockPermissionOverrideRepository) FindEffectiveByUserIDAndResource(ctx context.Context, userID, resource string) ([]*model.PermissionOverride, error) {
	args := m.Called(ctx, userID, resource)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.PermissionOverride), args.Error(1)
}

func (m *MockPermissionOverrideRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.PermissionOverrideFilter, page, pageSize int) (*repository.PermissionOverrideListResult, error) {
	args := m.Called(ctx, tenantID, filter, page, pageSize)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.PermissionOverrideListResult), args.Error(1)
}

func (m *MockPermissionOverrideRepository) Create(ctx context.Context, override *model.PermissionOverride) error {
	args := m.Called(ctx, override)
	return args.Error(0)
}

func (m *MockPermissionOverrideRepository) Update(ctx context.Context, override *model.PermissionOverride) error {
	args := m.Called(ctx, override)
	return args.Error(0)
}

func (m *MockPermissionOverrideRepository) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockPermissionOverrideRepository) DeleteByUserID(ctx context.Context, userID string) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockPermissionOverrideRepository) BatchCreate(ctx context.Context, overrides []*model.PermissionOverride) error {
	args := m.Called(ctx, overrides)
	return args.Error(0)
}

func (m *MockPermissionOverrideRepository) BatchUpdate(ctx context.Context, tenantID, userID string, overrides []*model.PermissionOverride) error {
	args := m.Called(ctx, tenantID, userID, overrides)
	return args.Error(0)
}

func (m *MockPermissionOverrideRepository) ExistsByUserResource(ctx context.Context, userID, resource string, permissionID *string) (bool, error) {
	args := m.Called(ctx, userID, resource, permissionID)
	return args.Bool(0), args.Error(1)
}

// Test ApplyOverrides - 权限覆盖计算测试
func TestApplyOverrides_GrantPermission(t *testing.T) {
	service := &PermissionOverrideService{}
	
	basePermissions := map[string]bool{
		"read":   true,
		"write":  false,
		"delete": false,
	}
	
	permID := "write_perm"
	overrides := []*model.PermissionOverride{
		{
			ID:           "1",
			UserID:       "user1",
			Resource:     "test.resource",
			OverrideType: model.OverrideTypeGrant,
			PermissionID: &permID,
		},
	}
	
	result := service.ApplyOverrides(basePermissions, overrides)
	
	// After grant override, write should be true
	assert.True(t, result[permID])
	assert.True(t, result["read"])
}

func TestApplyOverrides_DenyPermission(t *testing.T) {
	service := &PermissionOverrideService{}
	
	basePermissions := map[string]bool{
		"read":   true,
		"write":  true,
		"delete": false,
	}
	
	permID := "write_perm"
	overrides := []*model.PermissionOverride{
		{
			ID:           "1",
			UserID:       "user1",
			Resource:     "test.resource",
			OverrideType: model.OverrideTypeDeny,
			PermissionID: &permID,
		},
	}
	
	result := service.ApplyOverrides(basePermissions, overrides)
	
	// After deny override, write should be false even if it was true
	assert.False(t, result[permID])
	assert.True(t, result["read"])
}

func TestApplyOverrides_DenyOverridesGrant(t *testing.T) {
	service := &PermissionOverrideService{}
	
	basePermissions := map[string]bool{
		"read": true,
	}
	
	permID := "write_perm"
	overrides := []*model.PermissionOverride{
		{
			ID:           "1",
			UserID:       "user1",
			Resource:     "test.resource",
			OverrideType: model.OverrideTypeGrant,
			PermissionID: &permID,
		},
		{
			ID:           "2",
			UserID:       "user1",
			Resource:     "test.resource",
			OverrideType: model.OverrideTypeDeny,
			PermissionID: &permID,
		},
	}
	
	result := service.ApplyOverrides(basePermissions, overrides)
	
	// Last override wins
	assert.False(t, result[permID])
}

// Test GetDataScope - 数据范围获取测试
func TestGetDataScope_DefaultAll(t *testing.T) {
	mockRepo := new(MockPermissionOverrideRepository)
	service := NewPermissionOverrideService(mockRepo, nil)
	
	ctx := context.Background()
	mockRepo.On("FindEffectiveByUserIDAndResource", ctx, "user1", "test.resource").Return([]*model.PermissionOverride{}, nil)
	
	scope, err := service.GetDataScope(ctx, "user1", "test.resource")
	
	assert.NoError(t, err)
	assert.Equal(t, model.DataScopeAll, scope.Type)
}

func TestGetDataScope_DepartmentScope(t *testing.T) {
	mockRepo := new(MockPermissionOverrideRepository)
	service := NewPermissionOverrideService(mockRepo, nil)
	
	ctx := context.Background()
	mockRepo.On("FindEffectiveByUserIDAndResource", ctx, "user1", "test.resource").Return([]*model.PermissionOverride{
		{
			ID:            "1",
			UserID:        "user1",
			Resource:      "test.resource",
			OverrideType:  model.OverrideTypeGrant,
			DataScopeType: model.DataScopeDepartment,
		},
	}, nil)
	
	scope, err := service.GetDataScope(ctx, "user1", "test.resource")
	
	assert.NoError(t, err)
	assert.Equal(t, model.DataScopeDepartment, scope.Type)
}

func TestGetDataScope_CustomRule(t *testing.T) {
	mockRepo := new(MockPermissionOverrideRepository)
	service := NewPermissionOverrideService(mockRepo, nil)
	
	ctx := context.Background()
	customRule := &model.DataScopeRule{
		Conditions: []model.DataScopeCondition{
			{Field: "status", Operator: "eq", Value: "active"},
		},
	}
	
	mockRepo.On("FindEffectiveByUserIDAndResource", ctx, "user1", "test.resource").Return([]*model.PermissionOverride{
		{
			ID:            "1",
			UserID:        "user1",
			Resource:      "test.resource",
			OverrideType:  model.OverrideTypeGrant,
			DataScopeType: model.DataScopeCustom,
			DataScopeRule: customRule,
		},
	}, nil)
	
	scope, err := service.GetDataScope(ctx, "user1", "test.resource")
	
	assert.NoError(t, err)
	assert.Equal(t, model.DataScopeCustom, scope.Type)
	assert.NotNil(t, scope.Rule)
	assert.Len(t, scope.Rule.Conditions, 1)
}

// Test GetPermissionResult - 完整权限结果测试
func TestGetPermissionResult(t *testing.T) {
	mockRepo := new(MockPermissionOverrideRepository)
	service := NewPermissionOverrideService(mockRepo, nil)
	
	ctx := context.Background()
	
	fieldRestrictions := model.FieldRestrictionsMap{
		"salary": {Mode: model.FieldModeHidden},
		"phone":  {Mode: model.FieldModeMasked, MaskRule: model.MaskRulePhone},
	}
	
	mockRepo.On("FindEffectiveByUserIDAndResource", ctx, "user1", "hr.employee").Return([]*model.PermissionOverride{
		{
			ID:                "1",
			UserID:            "user1",
			Resource:          "hr.employee",
			OverrideType:      model.OverrideTypeGrant,
			DataScopeType:     model.DataScopeDepartmentTree,
			FieldRestrictions: fieldRestrictions,
		},
	}, nil)
	
	basePermissions := map[string]bool{
		"hr.employee.read":  true,
		"hr.employee.write": false,
	}
	
	result, err := service.GetPermissionResult(ctx, "user1", "hr.employee", basePermissions)
	
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, model.DataScopeDepartmentTree, result.DataScope.Type)
	assert.Contains(t, result.FieldRestrictions, "salary")
	assert.Equal(t, model.FieldModeHidden, result.FieldRestrictions["salary"].Mode)
}

// Test GetFieldRestrictions - 字段限制测试
func TestGetFieldRestrictions(t *testing.T) {
	mockRepo := new(MockPermissionOverrideRepository)
	service := NewPermissionOverrideService(mockRepo, nil)
	
	ctx := context.Background()
	
	fieldRestrictions := model.FieldRestrictionsMap{
		"salary": {Mode: model.FieldModeHidden},
		"phone":  {Mode: model.FieldModeMasked, MaskRule: model.MaskRulePhone},
	}
	
	mockRepo.On("FindEffectiveByUserIDAndResource", ctx, "user1", "hr.employee").Return([]*model.PermissionOverride{
		{
			ID:                "1",
			UserID:            "user1",
			Resource:          "hr.employee",
			OverrideType:      model.OverrideTypeGrant,
			FieldRestrictions: fieldRestrictions,
		},
	}, nil)
	
	restrictions, err := service.GetFieldRestrictions(ctx, "user1", "hr.employee")
	
	assert.NoError(t, err)
	assert.Len(t, restrictions, 2)
	assert.Equal(t, model.FieldModeHidden, restrictions["salary"].Mode)
	assert.Equal(t, model.FieldModeMasked, restrictions["phone"].Mode)
}

// Benchmark tests
func BenchmarkApplyOverrides(b *testing.B) {
	service := &PermissionOverrideService{}
	
	basePermissions := map[string]bool{
		"read":   true,
		"write":  false,
		"delete": false,
	}
	
	permID := "write_perm"
	overrides := []*model.PermissionOverride{
		{
			ID:           "1",
			UserID:       "user1",
			Resource:     "test.resource",
			OverrideType: model.OverrideTypeGrant,
			PermissionID: &permID,
		},
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.ApplyOverrides(basePermissions, overrides)
	}
}