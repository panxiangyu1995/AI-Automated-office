package service

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	"github.com/ai-office/api/pkg/rbac"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type PermissionService struct {
	permRepo     repository.PermissionRepository
	roleRepo     repository.RoleRepository
	empPermRepo  repository.EmployeePermissionABACRepository
	customRuleRepo repository.CustomRuleRepository
	facade       *rbac.PermissionFacade
}

func NewPermissionService(
	permRepo repository.PermissionRepository,
	roleRepo repository.RoleRepository,
	empPermRepo repository.EmployeePermissionABACRepository,
	customRuleRepo repository.CustomRuleRepository,
	facade *rbac.PermissionFacade,
) *PermissionService {
	return &PermissionService{
		permRepo:       permRepo,
		roleRepo:       roleRepo,
		empPermRepo:    empPermRepo,
		customRuleRepo: customRuleRepo,
		facade:         facade,
	}
}

func (s *PermissionService) ListPermissions() ([]model.Permission, *apperrors.AppError) {
	perms, err := s.permRepo.ListPermissions()
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询权限列表失败")
	}
	return perms, nil
}

func (s *PermissionService) ListRoles(enterpriseID uuid.UUID) ([]model.Role, *apperrors.AppError) {
	roles, err := s.roleRepo.ListRoles(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询角色列表失败")
	}
	return roles, nil
}

func (s *PermissionService) CreateRole(role *model.Role) *apperrors.AppError {
	if err := s.roleRepo.CreateRole(role); err != nil {
		return apperrors.ErrInternal.WithDetail("创建角色失败")
	}
	return nil
}

func (s *PermissionService) GetRolePermissions(roleID uuid.UUID) ([]model.Permission, *apperrors.AppError) {
	perms, err := s.roleRepo.GetRolePermissions(roleID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询角色权限失败")
	}
	return perms, nil
}

func (s *PermissionService) SetRolePermissions(roleID uuid.UUID, permissionIDs []uuid.UUID) *apperrors.AppError {
	if err := s.roleRepo.SetRolePermissions(roleID, permissionIDs); err != nil {
		return apperrors.ErrInternal.WithDetail("设置角色权限失败")
	}
	return nil
}

func (s *PermissionService) GetEmployeePermissions(employeeID uuid.UUID) ([]model.EmployeePermissionABAC, *apperrors.AppError) {
	perms, err := s.empPermRepo.FindByEmployeeID(employeeID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询员工权限失败")
	}
	return perms, nil
}

func (s *PermissionService) GetEffectivePermissions(employeeID uuid.UUID, role string, enterpriseID uuid.UUID) (*EffectivePermissionsResponse, *apperrors.AppError) {
	rolePerms := rbac.GetPermissions(rbac.Role(role))

	empPerms, err := s.empPermRepo.FindByEmployeeID(employeeID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询员工自定义权限失败")
	}

	return &EffectivePermissionsResponse{
		RolePermissions:       rolePerms,
		CustomPermissions:     empPerms,
		TotalPermissionCount:  len(rolePerms) + len(empPerms),
	}, nil
}

type EffectivePermissionsResponse struct {
	RolePermissions      []rbac.Permission               `json:"role_permissions"`
	CustomPermissions    []model.EmployeePermissionABAC  `json:"custom_permissions"`
	TotalPermissionCount int                             `json:"total_permission_count"`
}

func (s *PermissionService) CheckPermission(ctx *model.PermissionContext) (*model.Decision, *apperrors.AppError) {
	if s.facade == nil {
		return &model.Decision{Allowed: false, Reason: "permission facade not initialized"}, nil
	}

	decision, err := s.facade.Evaluate(ctx)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("权限检查失败")
	}
	return decision, nil
}

func (s *PermissionService) ListCustomRules(enterpriseID uuid.UUID) ([]model.CustomRule, *apperrors.AppError) {
	rules, err := s.customRuleRepo.ListByEnterprise(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询自定义规则失败")
	}
	return rules, nil
}

func (s *PermissionService) CreateCustomRule(rule *model.CustomRule) *apperrors.AppError {
	if err := s.customRuleRepo.Create(rule); err != nil {
		return apperrors.ErrInternal.WithDetail("创建自定义规则失败")
	}
	return nil
}
