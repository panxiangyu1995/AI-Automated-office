package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"go.uber.org/zap"
)

var (
	ErrRoleNotFound          = errors.New("ROLE_NOT_FOUND")
	ErrRoleCodeDuplicate     = errors.New("ROLE_CODE_DUPLICATE")
	ErrSystemRoleImmutable   = errors.New("SYSTEM_ROLE_IMMUTABLE")
	ErrValidation            = errors.New("VALIDATION_ERROR")
)

// RoleService 角色服务
type RoleService struct {
	roleRepo       repository.RoleRepository
	permissionRepo repository.PermissionRepository
	db             *sql.DB
	logger         *zap.Logger
}

// NewRoleService 创建角色服务
func NewRoleService(
	roleRepo repository.RoleRepository,
	permissionRepo repository.PermissionRepository,
	db *sql.DB,
	logger *zap.Logger,
) *RoleService {
	return &RoleService{
		roleRepo:       roleRepo,
		permissionRepo: permissionRepo,
		db:             db,
		logger:         logger,
	}
}

// ListRolesRequest 角色列表请求
type ListRolesRequest struct {
	Page     int
	PageSize int
	Name     string
	Code     string
	Type     model.RoleType
	Layer    model.PermissionLayer
}

// ListRolesResponse 角色列表响应
type ListRolesResponse struct {
	Items    []*repository.RoleListItem `json:"items"`
	Total    int64                      `json:"total"`
	Page     int                        `json:"page"`
	PageSize int                        `json:"page_size"`
}

// ListRoles 获取角色列表
func (s *RoleService) ListRoles(ctx context.Context, tenantID string, req *ListRolesRequest) (*ListRolesResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 20
	}
	if req.PageSize > 100 {
		req.PageSize = 100
	}

	filter := &repository.RoleFilter{
		Name:  req.Name,
		Code:  req.Code,
		Type:  req.Type,
		Layer: req.Layer,
	}

	result, err := s.roleRepo.FindWithFilters(ctx, tenantID, filter, req.Page, req.PageSize)
	if err != nil {
		s.logger.Error("failed to list roles", zap.Error(err))
		return nil, err
	}

	return &ListRolesResponse{
		Items:    result.Items,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

// GetRoleDetail 获取角色详情
func (s *RoleService) GetRoleDetail(ctx context.Context, tenantID, roleID string) (*repository.RoleDetail, error) {
	detail, err := s.roleRepo.FindDetailByID(ctx, tenantID, roleID)
	if err != nil {
		s.logger.Error("failed to get role detail", zap.Error(err), zap.String("roleID", roleID))
		return nil, err
	}
	if detail == nil {
		return nil, ErrRoleNotFound
	}
	return detail, nil
}

// CreateRoleRequest 创建角色请求
type CreateRoleRequest struct {
	Name          string                `json:"name"`
	Code          string                `json:"code"`
	Type          model.RoleType        `json:"type"`
	Layer         model.PermissionLayer `json:"layer"`
	Description   string                `json:"description"`
	PermissionIDs []string              `json:"permission_ids"`
}

// CreateRoleResponse 创建角色响应
type CreateRoleResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Code        string `json:"code"`
	Description string `json:"description"`
}

// CreateRole 创建角色
func (s *RoleService) CreateRole(ctx context.Context, tenantID string, req *CreateRoleRequest) (*CreateRoleResponse, error) {
	// 校验必填字段
	if req.Name == "" {
		return nil, fmt.Errorf("%w: name is required", ErrValidation)
	}
	if req.Code == "" {
		return nil, fmt.Errorf("%w: code is required", ErrValidation)
	}

	// 设置默认值
	if req.Type == "" {
		req.Type = model.RoleTypeCustom
	}
	if req.Layer == "" {
		req.Layer = model.LayerBase
	}

	// 检查编码唯一性
	exists, err := s.roleRepo.ExistsByCode(ctx, tenantID, req.Code)
	if err != nil {
		s.logger.Error("failed to check role code", zap.Error(err))
		return nil, err
	}
	if exists {
		return nil, ErrRoleCodeDuplicate
	}

	// 创建角色
	role := &model.Role{
		TenantID:    tenantID,
		Name:        req.Name,
		Code:        req.Code,
		Type:        req.Type,
		Layer:       req.Layer,
		Description: req.Description,
		IsSystem:    false,
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return nil, err
	}
	defer tx.Rollback()

	if err := s.roleRepo.Create(ctx, role); err != nil {
		s.logger.Error("failed to create role", zap.Error(err))
		return nil, err
	}

	// 绑定权限
	if len(req.PermissionIDs) > 0 {
		if err := s.roleRepo.BindPermissions(ctx, tenantID, role.ID, req.PermissionIDs); err != nil {
			s.logger.Error("failed to bind permissions", zap.Error(err))
			return nil, err
		}
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return nil, err
	}

	s.logger.Info("role created",
		zap.String("roleID", role.ID),
		zap.String("code", req.Code),
		zap.String("tenantID", tenantID),
	)

	return &CreateRoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		Code:        role.Code,
		Description: role.Description,
	}, nil
}

// UpdateRoleRequest 更新角色请求
type UpdateRoleRequest struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permission_ids"`
}

// UpdateRole 更新角色
func (s *RoleService) UpdateRole(ctx context.Context, tenantID, roleID string, req *UpdateRoleRequest) error {
	role, err := s.roleRepo.FindByID(ctx, tenantID, roleID)
	if err != nil {
		s.logger.Error("failed to find role", zap.Error(err), zap.String("roleID", roleID))
		return err
	}
	if role == nil {
		return ErrRoleNotFound
	}

	// 系统角色不可修改
	if role.IsSystem {
		return ErrSystemRoleImmutable
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		s.logger.Error("failed to begin transaction", zap.Error(err))
		return err
	}
	defer tx.Rollback()

	// 更新基本信息
	if req.Name != "" {
		role.Name = req.Name
	}
	role.Description = req.Description

	if err := s.roleRepo.Update(ctx, role); err != nil {
		s.logger.Error("failed to update role", zap.Error(err))
		return nil
	}

	// 更新权限
	if req.PermissionIDs != nil {
		if err := s.roleRepo.BindPermissions(ctx, tenantID, roleID, req.PermissionIDs); err != nil {
			s.logger.Error("failed to bind permissions", zap.Error(err))
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit transaction", zap.Error(err))
		return err
	}

	s.logger.Info("role updated",
		zap.String("roleID", roleID),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// DeleteRole 删除角色
func (s *RoleService) DeleteRole(ctx context.Context, tenantID, roleID string) error {
	role, err := s.roleRepo.FindByID(ctx, tenantID, roleID)
	if err != nil {
		s.logger.Error("failed to find role", zap.Error(err), zap.String("roleID", roleID))
		return err
	}
	if role == nil {
		return ErrRoleNotFound
	}

	// 系统角色不可删除
	if role.IsSystem {
		return ErrSystemRoleImmutable
	}

	// 检查是否有用户关联
	userCount, err := s.roleRepo.GetUserCount(ctx, roleID)
	if err != nil {
		s.logger.Error("failed to get user count", zap.Error(err))
		return err
	}
	if userCount > 0 {
		return fmt.Errorf("%w: role has %d users", ErrValidation, userCount)
	}

	if err := s.roleRepo.Delete(ctx, tenantID, roleID); err != nil {
		s.logger.Error("failed to delete role", zap.Error(err))
		return err
	}

	s.logger.Info("role deleted",
		zap.String("roleID", roleID),
		zap.String("tenantID", tenantID),
	)

	return nil
}

// GetRolePermissions 获取角色权限
func (s *RoleService) GetRolePermissions(ctx context.Context, tenantID, roleID string) ([]*repository.PermissionItem, error) {
	detail, err := s.roleRepo.FindDetailByID(ctx, tenantID, roleID)
	if err != nil {
		return nil, err
	}
	if detail == nil {
		return nil, ErrRoleNotFound
	}
	return detail.Permissions, nil
}

// UpdateRolePermissionsRequest 更新角色权限请求
type UpdateRolePermissionsRequest struct {
	PermissionIDs []string `json:"permission_ids"`
}

// UpdateRolePermissions 更新角色权限
func (s *RoleService) UpdateRolePermissions(ctx context.Context, tenantID, roleID string, req *UpdateRolePermissionsRequest) error {
	role, err := s.roleRepo.FindByID(ctx, tenantID, roleID)
	if err != nil {
		return err
	}
	if role == nil {
		return ErrRoleNotFound
	}

	// 系统角色不可修改权限
	if role.IsSystem {
		return ErrSystemRoleImmutable
	}

	if err := s.roleRepo.BindPermissions(ctx, tenantID, roleID, req.PermissionIDs); err != nil {
		s.logger.Error("failed to update role permissions", zap.Error(err))
		return err
	}

	s.logger.Info("role permissions updated",
		zap.String("roleID", roleID),
		zap.Int("permissionCount", len(req.PermissionIDs)),
	)

	return nil
}
