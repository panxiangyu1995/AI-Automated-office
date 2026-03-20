package service

import (
	"context"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"go.uber.org/zap"
)

// PermissionService 权限服务
type PermissionService struct {
	permissionRepo repository.PermissionRepository
	logger         *zap.Logger
}

// NewPermissionService 创建权限服务
func NewPermissionService(
	permissionRepo repository.PermissionRepository,
	logger *zap.Logger,
) *PermissionService {
	return &PermissionService{
		permissionRepo: permissionRepo,
		logger:         logger,
	}
}

// ListPermissionsRequest 权限列表请求
type ListPermissionsRequest struct {
	Page     int
	PageSize int
	Code     string
	Resource string
	Action   model.PermissionAction
	Layer    model.PermissionLayer
}

// ListPermissionsResponse 权限列表响应
type ListPermissionsResponse struct {
	Items    []*repository.PermissionItem `json:"items"`
	Total    int64                        `json:"total"`
	Page     int                          `json:"page"`
	PageSize int                          `json:"page_size"`
}

// ListPermissions 获取权限列表
func (s *PermissionService) ListPermissions(ctx context.Context, tenantID string, req *ListPermissionsRequest) (*ListPermissionsResponse, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 50
	}
	if req.PageSize > 200 {
		req.PageSize = 200
	}

	filter := &repository.PermissionFilter{
		Code:     req.Code,
		Resource: req.Resource,
		Action:   req.Action,
		Layer:    req.Layer,
	}

	result, err := s.permissionRepo.FindWithFilters(ctx, tenantID, filter, req.Page, req.PageSize)
	if err != nil {
		s.logger.Error("failed to list permissions", zap.Error(err))
		return nil, err
	}

	return &ListPermissionsResponse{
		Items:    result.Items,
		Total:    result.Total,
		Page:     result.Page,
		PageSize: result.PageSize,
	}, nil
}

// GetPermissionsGroupedByLayer 获取按层级分组的权限
func (s *PermissionService) GetPermissionsGroupedByLayer(ctx context.Context, tenantID string) (*repository.PermissionGroupedByLayer, error) {
	result, err := s.permissionRepo.FindGroupedByLayer(ctx, tenantID)
	if err != nil {
		s.logger.Error("failed to get permissions grouped by layer", zap.Error(err))
		return nil, err
	}
	return result, nil
}

// GetUserPermissions 获取用户的所有权限
func (s *PermissionService) GetUserPermissions(ctx context.Context, userID string) ([]*repository.PermissionItem, error) {
	permissions, err := s.permissionRepo.FindByUserID(ctx, userID)
	if err != nil {
		s.logger.Error("failed to get user permissions", zap.Error(err), zap.String("userID", userID))
		return nil, err
	}

	items := make([]*repository.PermissionItem, 0, len(permissions))
	for _, p := range permissions {
		items = append(items, &repository.PermissionItem{
			ID:          p.ID,
			Code:        p.Code,
			Name:        p.Name,
			Resource:    p.Resource,
			Action:      p.Action,
			Layer:       p.Layer,
			Description: p.Description,
		})
	}

	return items, nil
}

// CheckPermissionRequest 检查权限请求
type CheckPermissionRequest struct {
	UserID         string   `json:"user_id"`
	PermissionCode string   `json:"permission_code"`
}

// CheckPermissionResponse 检查权限响应
type CheckPermissionResponse struct {
	HasPermission bool `json:"has_permission"`
}

// CheckPermission 检查用户是否拥有指定权限
func (s *PermissionService) CheckPermission(ctx context.Context, req *CheckPermissionRequest) (*CheckPermissionResponse, error) {
	permissionSet, err := s.permissionRepo.GetPermissionSet(ctx, req.UserID)
	if err != nil {
		s.logger.Error("failed to get permission set", zap.Error(err), zap.String("userID", req.UserID))
		return nil, err
	}

	return &CheckPermissionResponse{
		HasPermission: permissionSet.Contains(req.PermissionCode),
	}, nil
}

// CheckPermissionsRequest 批量检查权限请求
type CheckPermissionsRequest struct {
	UserID          string   `json:"user_id"`
	PermissionCodes []string `json:"permission_codes"`
}

// CheckPermissionsResponse 批量检查权限响应
type CheckPermissionsResponse struct {
	Results map[string]bool `json:"results"`
}

// CheckPermissions 批量检查用户权限
func (s *PermissionService) CheckPermissions(ctx context.Context, req *CheckPermissionsRequest) (*CheckPermissionsResponse, error) {
	permissionSet, err := s.permissionRepo.GetPermissionSet(ctx, req.UserID)
	if err != nil {
		s.logger.Error("failed to get permission set", zap.Error(err), zap.String("userID", req.UserID))
		return nil, err
	}

	results := make(map[string]bool)
	for _, code := range req.PermissionCodes {
		results[code] = permissionSet.Contains(code)
	}

	return &CheckPermissionsResponse{Results: results}, nil
}
