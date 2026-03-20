package repository

import (
	"context"

	"cloud-server/internal/model"
)

// UserFilter 用户筛选条件
type UserFilter struct {
	Name         string // 姓名模糊搜索
	EmployeeCode string // 工号精确匹配
	DepartmentID string // 部门 ID
	Status       string // 用户状态
}

// UserListResult 用户列表结果
type UserListResult struct {
	Items    []*UserListItem
	Total    int64
	Page     int
	PageSize int
}

// UserListItem 用户列表项
type UserListItem struct {
	ID           string          `json:"id"`
	Username     string          `json:"username"`
	RealName     string          `json:"real_name"`
	EmployeeCode string          `json:"employee_code"`
	Email        string          `json:"email"`
	Phone        string          `json:"phone"`
	Status       string          `json:"status"`
	ManagerID    *string         `json:"manager_id,omitempty"`
	ManagerName  string          `json:"manager_name,omitempty"`
	Departments  []DepartmentRef `json:"departments"`
	Roles        []RoleRef       `json:"roles"`
	CreatedAt    string          `json:"created_at"`
}

// DepartmentRef 部门引用
type DepartmentRef struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	IsPrimary bool   `json:"is_primary"`
}

// RoleRef 角色引用
type RoleRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Code string `json:"code"`
}

// UserDetail 用户详情
type UserDetail struct {
	*UserListItem
	UpdatedAt   string `json:"updated_at,omitempty"`
	LastLoginAt string `json:"last_login_at,omitempty"`
}

// ManagerChainItem 上级链项
type ManagerChainItem struct {
	Level int          `json:"level"`
	User  *UserSummary `json:"user"`
}

// UserSummary 用户简要信息
type UserSummary struct {
	ID           string        `json:"id"`
	RealName     string        `json:"real_name"`
	EmployeeCode string        `json:"employee_code,omitempty"`
	Department   *DeptSummary  `json:"department,omitempty"`
}

// DeptSummary 部门简要信息
type DeptSummary struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// SubordinateItem 下属项
type SubordinateItem struct {
	ID           string       `json:"id"`
	RealName     string       `json:"real_name"`
	EmployeeCode string       `json:"employee_code"`
	Department   *DeptSummary `json:"department,omitempty"`
	Status       string       `json:"status"`
}

// UserRepository 用户管理仓储接口
type UserRepository interface {
	// FindByID 根据 ID 查找用户
	FindByID(ctx context.Context, tenantID, userID string) (*model.User, error)

	// FindByEmail 根据邮箱查找用户
	FindByEmail(ctx context.Context, tenantID, email string) (*model.User, error)

	// FindByEmployeeCode 根据工号查找用户
	FindByEmployeeCode(ctx context.Context, tenantID, employeeCode string) (*model.User, error)

	// FindByUsername 根据用户名查找用户
	FindByUsername(ctx context.Context, tenantID, username string) (*model.User, error)

	// FindWithFilters 分页筛选查询用户列表
	FindWithFilters(ctx context.Context, tenantID string, filter *UserFilter, page, pageSize int) (*UserListResult, error)

	// FindDetailByID 查找用户详情（包含部门和角色）
	FindDetailByID(ctx context.Context, tenantID, userID string) (*UserDetail, error)

	// Create 创建用户
	Create(ctx context.Context, user *model.User) error

	// Update 更新用户
	Update(ctx context.Context, user *model.User) error

	// UpdateStatus 更新用户状态
	UpdateStatus(ctx context.Context, tenantID, userID, status string) error

	// ExistsByUsername 检查用户名是否存在
	ExistsByUsername(ctx context.Context, tenantID, username string) (bool, error)

	// ExistsByEmployeeCode 检查工号是否存在
	ExistsByEmployeeCode(ctx context.Context, tenantID, employeeCode string) (bool, error)

	// BindDepartments 绑定用户部门
	BindDepartments(ctx context.Context, userID string, departmentIDs []string, primaryDepartmentID string) error

	// BindRoles 绑定用户角色
	BindRoles(ctx context.Context, userID string, roleIDs []string) error

	// GetUserDepartmentIDs 获取用户部门 ID 列表
	GetUserDepartmentIDs(ctx context.Context, userID string) ([]string, error)

	// GetUserRoleIDs 获取用户角色 ID 列表
	GetUserRoleIDs(ctx context.Context, userID string) ([]string, error)

	// UpdateManagerID 更新用户上级
	UpdateManagerID(ctx context.Context, tenantID, userID string, managerID *string) error

	// GetManagerChain 获取用户上级链
	GetManagerChain(ctx context.Context, tenantID, userID string, maxDepth int) ([]*ManagerChainItem, error)

	// GetSubordinates 获取用户直接下属列表
	GetSubordinates(ctx context.Context, tenantID, managerID string) ([]*SubordinateItem, error)

	// FindUserSummaries 根据用户 ID 列表获取用户简要信息
	FindUserSummaries(ctx context.Context, tenantID string, userIDs []string) ([]*UserSummary, error)

	// SearchUsersForManager 搜索可选上级的用户
	SearchUsersForManager(ctx context.Context, tenantID string, query string, excludeIDs []string, limit int) ([]*UserSummary, error)
}
