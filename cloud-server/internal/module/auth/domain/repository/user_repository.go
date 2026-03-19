package repository

import (
	"context"

	"cloud-server/internal/model"
)

// UserRepository 用户仓储接口
type UserRepository interface {
	// FindByEmail 根据邮箱查找用户
	FindByEmail(ctx context.Context, tenantID, email string) (*model.User, error)
	
	// FindByID 根据 ID 查找用户
	FindByID(ctx context.Context, tenantID, userID string) (*model.User, error)
	
	// Create 创建用户
	Create(ctx context.Context, user *model.User) error
	
	// Update 更新用户
	Update(ctx context.Context, user *model.User) error
	
	// UpdateLoginInfo 更新登录信息（最后登录时间、失败次数等）
	UpdateLoginInfo(ctx context.Context, userID string, failedCount int, lockedUntil *string) error
	
	// GetUserWithRole 获取用户及其角色
	GetUserWithRole(ctx context.Context, tenantID, email string) (*UserWithRole, error)
}

// UserWithRole 用户及角色信息
type UserWithRole struct {
	User         *model.User
	RoleCode     string
	RoleName     string
	DepartmentID string
}
