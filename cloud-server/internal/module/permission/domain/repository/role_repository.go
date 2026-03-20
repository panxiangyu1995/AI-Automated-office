package repository

import (
	"context"

	"cloud-server/internal/model"
)

// RoleFilter 角色筛选条件
type RoleFilter struct {
	Name   string         // 名称模糊搜索
	Code   string         // 编码精确匹配
	Type   model.RoleType // 角色类型
	Layer  model.PermissionLayer // 权限层级
}

// RoleListResult 角色列表结果
type RoleListResult struct {
	Items    []*RoleListItem
	Total    int64
	Page     int
	PageSize int
}

// RoleListItem 角色列表项
type RoleListItem struct {
	ID              string                  `json:"id"`
	Name            string                  `json:"name"`
	Code            string                  `json:"code"`
	Type            model.RoleType          `json:"type"`
	Layer           model.PermissionLayer   `json:"layer"`
	Description     string                  `json:"description"`
	IsSystem        bool                    `json:"is_system"`
	PermissionCount int                     `json:"permission_count"`
	UserCount       int                     `json:"user_count"`
	CreatedAt       string                  `json:"created_at"`
	UpdatedAt       string                  `json:"updated_at"`
}

// RoleDetail 角色详情
type RoleDetail struct {
	*RoleListItem
	Permissions []*PermissionItem `json:"permissions"`
}

// PermissionItem 权限项
type PermissionItem struct {
	ID          string                 `json:"id"`
	Code        string                 `json:"code"`
	Name        string                 `json:"name"`
	Resource    string                 `json:"resource"`
	Action      model.PermissionAction `json:"action"`
	Layer       model.PermissionLayer  `json:"layer"`
	Description string                 `json:"description"`
}

// UserRoleItem 用户角色项
type UserRoleItem struct {
	ID           string                `json:"id"`
	Role         *RoleRef              `json:"role"`
	Department   *DepartmentRef        `json:"department,omitempty"`
	AssignedBy   *UserRef              `json:"assigned_by,omitempty"`
	AssignedAt   string                `json:"assigned_at"`
}

// RoleRef 角色引用
type RoleRef struct {
	ID    string                `json:"id"`
	Name  string                `json:"name"`
	Code  string                `json:"code"`
	Layer model.PermissionLayer `json:"layer"`
}

// DepartmentRef 部门引用
type DepartmentRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// UserRef 用户引用
type UserRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// RoleRepository 角色仓储接口
type RoleRepository interface {
	// FindByID 根据 ID 查找角色
	FindByID(ctx context.Context, tenantID, roleID string) (*model.Role, error)

	// FindByCode 根据编码查找角色
	FindByCode(ctx context.Context, tenantID, code string) (*model.Role, error)

	// FindWithFilters 分页筛选查询角色列表
	FindWithFilters(ctx context.Context, tenantID string, filter *RoleFilter, page, pageSize int) (*RoleListResult, error)

	// FindDetailByID 查找角色详情（包含权限）
	FindDetailByID(ctx context.Context, tenantID, roleID string) (*RoleDetail, error)

	// Create 创建角色
	Create(ctx context.Context, role *model.Role) error

	// Update 更新角色
	Update(ctx context.Context, role *model.Role) error

	// Delete 删除角色
	Delete(ctx context.Context, tenantID, roleID string) error

	// ExistsByCode 检查编码是否存在
	ExistsByCode(ctx context.Context, tenantID, code string) (bool, error)

	// GetRolePermissionIDs 获取角色的权限 ID 列表
	GetRolePermissionIDs(ctx context.Context, roleID string) ([]string, error)

	// BindPermissions 绑定角色权限
	BindPermissions(ctx context.Context, tenantID, roleID string, permissionIDs []string) error

	// GetUserCount 获取角色关联的用户数量
	GetUserCount(ctx context.Context, roleID string) (int, error)
}
