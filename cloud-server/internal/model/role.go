package model

import (
	"time"
)

// RoleType 角色类型
type RoleType string

const (
	RoleTypeSystem     RoleType = "system"     // 系统角色
	RoleTypeDepartment RoleType = "department" // 部门角色
	RoleTypeCustom     RoleType = "custom"     // 自定义角色
)

// PermissionLayer 权限层级
type PermissionLayer string

const (
	LayerBase       PermissionLayer = "base"       // 基础权限
	LayerDepartment PermissionLayer = "department" // 部门权限
	LayerApproval   PermissionLayer = "approval"   // 审批权限
)

// PermissionAction 权限操作类型
type PermissionAction string

const (
	PermActionRead   PermissionAction = "read"   // 读取
	PermActionWrite  PermissionAction = "write"  // 写入
	PermActionDelete PermissionAction = "delete" // 删除
	PermActionAdmin  PermissionAction = "admin"  // 管理
)

// Role 角色模型
type Role struct {
	ID          string           `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID    string           `gorm:"type:uuid;not null;index" json:"tenant_id"`
	Name        string           `gorm:"size:100;not null" json:"name"`
	Code        string           `gorm:"size:50;not null" json:"code"`
	Type        RoleType         `gorm:"size:20;not null;default:'custom'" json:"type"`
	Layer       PermissionLayer  `gorm:"size:20;not null;default:'base'" json:"layer"`
	Description string           `gorm:"type:text" json:"description,omitempty"`
	IsSystem    bool             `gorm:"default:false" json:"is_system"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
}

// TableName 指定表名
func (Role) TableName() string {
	return "roles"
}

// UserRole 用户角色关联
type UserRole struct {
	ID           string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID     string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	UserID       string    `gorm:"type:uuid;not null;index" json:"user_id"`
	RoleID       string    `gorm:"type:uuid;not null;index" json:"role_id"`
	DepartmentID *string   `gorm:"type:uuid;index" json:"department_id,omitempty"`
	AssignedBy   *string   `gorm:"type:uuid" json:"assigned_by,omitempty"`
	AssignedAt   time.Time `json:"assigned_at"`
	CreatedAt    time.Time `json:"created_at"`
}

// TableName 指定表名
func (UserRole) TableName() string {
	return "user_roles"
}

// RolePermission 角色权限关联
type RolePermission struct {
	ID           string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TenantID     string    `gorm:"type:uuid;not null;index" json:"tenant_id"`
	RoleID       string    `gorm:"type:uuid;not null;index" json:"role_id"`
	PermissionID string    `gorm:"type:uuid;not null;index" json:"permission_id"`
	CreatedAt    time.Time `json:"created_at"`
}

// TableName 指定表名
func (RolePermission) TableName() string {
	return "role_permissions"
}