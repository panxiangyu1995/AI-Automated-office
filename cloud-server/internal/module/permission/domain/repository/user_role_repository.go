package repository

import (
	"context"
)

// UserRoleFilter 用户角色筛选条件
type UserRoleFilter struct {
	UserID       string // 用户 ID
	RoleID       string // 角色 ID
	DepartmentID string // 部门 ID
}

// UserRoleRepository 用户角色仓储接口
type UserRoleRepository interface {
	// FindByUserID 获取用户的所有角色
	FindByUserID(ctx context.Context, userID string) ([]*UserRoleItem, error)

	// FindByRoleID 获取角色的所有用户 ID
	FindByRoleID(ctx context.Context, roleID string) ([]string, error)

	// AssignRole 为用户分配角色
	AssignRole(ctx context.Context, tenantID, userID, roleID string, departmentID *string, assignedBy string) error

	// RemoveRole 移除用户角色
	RemoveRole(ctx context.Context, userID, roleID string) error

	// UpdateUserRoles 更新用户的所有角色
	UpdateUserRoles(ctx context.Context, tenantID, userID string, roles []UserRoleAssignment, assignedBy string) error

	// GetUserRoleIDs 获取用户的角色 ID 列表
	GetUserRoleIDs(ctx context.Context, userID string) ([]string, error)

	// Exists 检查用户角色是否存在
	Exists(ctx context.Context, userID, roleID string) (bool, error)
}

// UserRoleAssignment 用户角色分配
type UserRoleAssignment struct {
	RoleID       string  `json:"role_id"`
	DepartmentID *string `json:"department_id,omitempty"`
}
