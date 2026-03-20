package repository

import (
	"context"

	"cloud-server/internal/model"
)

// DepartmentTreeItem 部门树节点
type DepartmentTreeItem struct {
	ID        string                `json:"id"`
	Name      string                `json:"name"`
	Code      string                `json:"code,omitempty"`
	ParentID  *string               `json:"parent_id,omitempty"`
	Leader    *DepartmentLeaderRef  `json:"leader,omitempty"`
	SortOrder int                   `json:"sort_order"`
	Status    string                `json:"status"`
	Children  []*DepartmentTreeItem `json:"children,omitempty"`
}

// DepartmentLeaderRef 部门负责人引用
type DepartmentLeaderRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// DepartmentListItem 部门列表项
type DepartmentListItem struct {
	ID           string               `json:"id"`
	Name         string               `json:"name"`
	Code         string               `json:"code,omitempty"`
	ParentID     *string              `json:"parent_id,omitempty"`
	ParentName   string               `json:"parent_name,omitempty"`
	Leader       *DepartmentLeaderRef `json:"leader,omitempty"`
	SortOrder    int                  `json:"sort_order"`
	Status       string               `json:"status"`
	EmployeeCount int                 `json:"employee_count"`
	CreatedAt    string               `json:"created_at"`
}

// DepartmentDetail 部门详情
type DepartmentDetail struct {
	*DepartmentListItem
	UpdatedAt string `json:"updated_at,omitempty"`
	Path      string `json:"path,omitempty"`
}

// DepartmentFilter 部门筛选条件
type DepartmentFilter struct {
	Name   string // 名称模糊搜索
	Code   string // 编码精确匹配
	Status string // 状态筛选
}

// DepartmentListResult 部门列表结果
type DepartmentListResult struct {
	Items    []*DepartmentListItem
	Total    int64
	Page     int
	PageSize int
}

// CreateDepartmentRequest 创建部门请求
type CreateDepartmentRequest struct {
	Name      string  `json:"name"`
	Code      string  `json:"code,omitempty"`
	ParentID  *string `json:"parent_id,omitempty"`
	LeaderID  *string `json:"leader_id,omitempty"`
	SortOrder int     `json:"sort_order"`
}

// UpdateDepartmentRequest 更新部门请求
type UpdateDepartmentRequest struct {
	Name      string  `json:"name,omitempty"`
	Code      string  `json:"code,omitempty"`
	LeaderID  *string `json:"leader_id,omitempty"`
	SortOrder *int    `json:"sort_order,omitempty"`
	Status    string  `json:"status,omitempty"`
}

// MoveDepartmentRequest 移动部门请求
type MoveDepartmentRequest struct {
	NewParentID *string `json:"new_parent_id"`
}

// DepartmentRepository 部门仓储接口
type DepartmentRepository interface {
	// FindByID 根据 ID 查找部门
	FindByID(ctx context.Context, tenantID, departmentID string) (*model.Department, error)

	// FindByCode 根据编码查找部门
	FindByCode(ctx context.Context, tenantID, code string) (*model.Department, error)

	// FindTree 获取部门树
	FindTree(ctx context.Context, tenantID string) ([]*DepartmentTreeItem, error)

	// FindWithFilters 分页筛选查询部门列表
	FindWithFilters(ctx context.Context, tenantID string, filter *DepartmentFilter, page, pageSize int) (*DepartmentListResult, error)

	// FindDetailByID 查找部门详情
	FindDetailByID(ctx context.Context, tenantID, departmentID string) (*DepartmentDetail, error)

	// FindChildren 查找子部门
	FindChildren(ctx context.Context, departmentID string) ([]*model.Department, error)

	// FindAncestors 查找所有祖先部门（使用闭包表）
	FindAncestors(ctx context.Context, departmentID string) ([]*model.Department, error)

	// FindDescendants 查找所有后代部门（使用闭包表）
	FindDescendants(ctx context.Context, departmentID string) ([]*model.Department, error)

	// Create 创建部门
	Create(ctx context.Context, department *model.Department) error

	// Update 更新部门
	Update(ctx context.Context, department *model.Department) error

	// Delete 删除部门（软删除）
	Delete(ctx context.Context, tenantID, departmentID string) error

	// ExistsByCode 检查编码是否存在
	ExistsByCode(ctx context.Context, tenantID, code string, excludeID string) (bool, error)

	// HasChildren 检查是否有子部门
	HasChildren(ctx context.Context, departmentID string) (bool, error)

	// HasEmployees 检查是否有员工
	HasEmployees(ctx context.Context, departmentID string) (bool, error)

	// CountEmployees 统计员工数量
	CountEmployees(ctx context.Context, departmentID string) (int, error)

	// CheckCircularReference 检查循环引用
	CheckCircularReference(ctx context.Context, departmentID, newParentID string) (bool, error)

	// UpdatePath 更新部门路径
	UpdatePath(ctx context.Context, departmentID string, parentPath string) error
}
