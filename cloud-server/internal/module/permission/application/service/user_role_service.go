package service

import (
	"context"
	"errors"

	"cloud-server/internal/module/permission/domain/repository"

	"go.uber.org/zap"
)

var (
	ErrUserRoleNotFound = errors.New("USER_ROLE_NOT_FOUND")
)

// UserRoleService 用户角色服务
type UserRoleService struct {
	userRoleRepo   repository.UserRoleRepository
	roleRepo       repository.RoleRepository
	calculator     *PermissionCalculator
	logger         *zap.Logger
}

// NewUserRoleService 创建用户角色服务
func NewUserRoleService(
	userRoleRepo repository.UserRoleRepository,
	roleRepo repository.RoleRepository,
	calculator *PermissionCalculator,
	logger *zap.Logger,
) *UserRoleService {
	return &UserRoleService{
		userRoleRepo: userRoleRepo,
		roleRepo:     roleRepo,
		calculator:   calculator,
		logger:       logger,
	}
}

// GetUserRolesRequest 获取用户角色请求
type GetUserRolesRequest struct {
	UserID string `json:"user_id"`
}

// GetUserRolesResponse 获取用户角色响应
type GetUserRolesResponse struct {
	Roles []*repository.UserRoleItem `json:"roles"`
}

// GetUserRoles 获取用户角色列表
func (s *UserRoleService) GetUserRoles(ctx context.Context, userID string) (*GetUserRolesResponse, error) {
	roles, err := s.userRoleRepo.FindByUserID(ctx, userID)
	if err != nil {
		s.logger.Error("failed to get user roles", zap.Error(err), zap.String("userID", userID))
		return nil, err
	}

	return &GetUserRolesResponse{Roles: roles}, nil
}

// UpdateUserRolesRequest 更新用户角色请求
type UpdateUserRolesRequest struct {
	Roles []repository.UserRoleAssignment `json:"roles"`
}

// UpdateUserRolesResponse 更新用户角色响应
type UpdateUserRolesResponse struct {
	UserID string `json:"user_id"`
	Count  int    `json:"count"`
}

// UpdateUserRoles 更新用户角色
func (s *UserRoleService) UpdateUserRoles(ctx context.Context, tenantID, userID, assignedBy string, req *UpdateUserRolesRequest) (*UpdateUserRolesResponse, error) {
	// 验证角色是否存在
	for _, role := range req.Roles {
		roleEntity, err := s.roleRepo.FindByID(ctx, tenantID, role.RoleID)
		if err != nil {
			s.logger.Error("failed to find role", zap.Error(err), zap.String("roleID", role.RoleID))
			return nil, err
		}
		if roleEntity == nil {
			return nil, ErrRoleNotFound
		}
	}

	// 更新用户角色
	if err := s.userRoleRepo.UpdateUserRoles(ctx, tenantID, userID, req.Roles, assignedBy); err != nil {
		s.logger.Error("failed to update user roles", zap.Error(err), zap.String("userID", userID))
		return nil, err
	}

	// 使缓存失效
	s.calculator.InvalidateCache(userID)

	s.logger.Info("user roles updated",
		zap.String("userID", userID),
		zap.Int("roleCount", len(req.Roles)),
		zap.String("assignedBy", assignedBy),
	)

	return &UpdateUserRolesResponse{
		UserID: userID,
		Count:  len(req.Roles),
	}, nil
}

// AssignRoleRequest 分配角色请求
type AssignRoleRequest struct {
	UserID       string  `json:"user_id"`
	RoleID       string  `json:"role_id"`
	DepartmentID *string `json:"department_id,omitempty"`
}

// AssignRole 为用户分配角色
func (s *UserRoleService) AssignRole(ctx context.Context, tenantID, assignedBy string, req *AssignRoleRequest) error {
	// 验证角色是否存在
	role, err := s.roleRepo.FindByID(ctx, tenantID, req.RoleID)
	if err != nil {
		return err
	}
	if role == nil {
		return ErrRoleNotFound
	}

	// 分配角色
	if err := s.userRoleRepo.AssignRole(ctx, tenantID, req.UserID, req.RoleID, req.DepartmentID, assignedBy); err != nil {
		s.logger.Error("failed to assign role",
			zap.Error(err),
			zap.String("userID", req.UserID),
			zap.String("roleID", req.RoleID),
		)
		return err
	}

	// 使缓存失效
	s.calculator.InvalidateCache(req.UserID)

	s.logger.Info("role assigned",
		zap.String("userID", req.UserID),
		zap.String("roleID", req.RoleID),
		zap.String("assignedBy", assignedBy),
	)

	return nil
}

// RemoveRoleRequest 移除角色请求
type RemoveRoleRequest struct {
	UserID string `json:"user_id"`
	RoleID string `json:"role_id"`
}

// RemoveRole 移除用户角色
func (s *UserRoleService) RemoveRole(ctx context.Context, req *RemoveRoleRequest) error {
	if err := s.userRoleRepo.RemoveRole(ctx, req.UserID, req.RoleID); err != nil {
		s.logger.Error("failed to remove role",
			zap.Error(err),
			zap.String("userID", req.UserID),
			zap.String("roleID", req.RoleID),
		)
		return err
	}

	// 使缓存失效
	s.calculator.InvalidateCache(req.UserID)

	s.logger.Info("role removed",
		zap.String("userID", req.UserID),
		zap.String("roleID", req.RoleID),
	)

	return nil
}
