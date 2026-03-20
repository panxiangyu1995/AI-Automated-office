package repository

import (
	"context"

	"cloud-server/internal/model"
)

// PermissionFilter 权限筛选条件
type PermissionFilter struct {
	Code     string                 // 编码模糊搜索
	Resource string                 // 资源筛选
	Action   model.PermissionAction // 操作类型
	Layer    model.PermissionLayer  // 权限层级
}

// PermissionListResult 权限列表结果
type PermissionListResult struct {
	Items    []*PermissionItem
	Total    int64
	Page     int
	PageSize int
}

// PermissionGroupedByLayer 按层级分组的权限
type PermissionGroupedByLayer struct {
	Base       []*PermissionItem `json:"base"`
	Department []*PermissionItem `json:"department"`
	Approval   []*PermissionItem `json:"approval"`
}

// PermissionRepository 权限仓储接口
type PermissionRepository interface {
	// FindByID 根据 ID 查找权限
	FindByID(ctx context.Context, permissionID string) (*model.Permission, error)

	// FindByCode 根据编码查找权限
	FindByCode(ctx context.Context, code string) (*model.Permission, error)

	// FindWithFilters 分页筛选查询权限列表
	FindWithFilters(ctx context.Context, tenantID string, filter *PermissionFilter, page, pageSize int) (*PermissionListResult, error)

	// FindAll 获取所有权限
	FindAll(ctx context.Context) ([]*model.Permission, error)

	// FindByRoleID 获取角色的所有权限
	FindByRoleID(ctx context.Context, roleID string) ([]*model.Permission, error)

	// FindByUserID 获取用户的所有权限（通过角色）
	FindByUserID(ctx context.Context, userID string) ([]*model.Permission, error)

	// FindGroupedByLayer 获取按层级分组的权限
	FindGroupedByLayer(ctx context.Context, tenantID string) (*PermissionGroupedByLayer, error)

	// Create 创建权限
	Create(ctx context.Context, permission *model.Permission) error

	// Update 更新权限
	Update(ctx context.Context, permission *model.Permission) error

	// Delete 删除权限
	Delete(ctx context.Context, permissionID string) error

	// ExistsByCode 检查编码是否存在
	ExistsByCode(ctx context.Context, tenantID *string, code string) (bool, error)

	// GetPermissionSet 获取用户的权限集合
	GetPermissionSet(ctx context.Context, userID string) (*model.PermissionSet, error)
}
