package repository

import (
	"context"

	"cloud-server/internal/model"
)

// PositionListItem 岗位列表项
type PositionListItem struct {
	ID             string                      `json:"id"`
	Name           string                      `json:"name"`
	Code           string                      `json:"code,omitempty"`
	DepartmentID   *string                     `json:"department_id,omitempty"`
	Department     *PositionDepartmentRef      `json:"department,omitempty"`
	Description    string                      `json:"description,omitempty"`
	Level          *int                        `json:"level,omitempty"`
	SortOrder      int                         `json:"sort_order"`
	Status         string                      `json:"status"`
	EmployeeCount  int                         `json:"employee_count"`
	CreatedAt      string                      `json:"created_at"`
}

// PositionDepartmentRef 岗位部门引用
type PositionDepartmentRef struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// PositionDetail 岗位详情
type PositionDetail struct {
	*PositionListItem
	UpdatedAt string `json:"updated_at,omitempty"`
}

// PositionFilter 岗位筛选条件
type PositionFilter struct {
	Name         string // 名称模糊搜索
	Code         string // 编码精确匹配
	DepartmentID string // 部门 ID 筛选
	Status       string // 状态筛选
}

// PositionListResult 岗位列表结果
type PositionListResult struct {
	Items    []*PositionListItem
	Total    int64
	Page     int
	PageSize int
}

// PositionRepository 岗位仓储接口
type PositionRepository interface {
	// FindByID 根据 ID 查找岗位
	FindByID(ctx context.Context, tenantID, positionID string) (*model.Position, error)

	// FindByCode 根据编码查找岗位
	FindByCode(ctx context.Context, tenantID, code string) (*model.Position, error)

	// FindWithFilters 分页筛选查询岗位列表
	FindWithFilters(ctx context.Context, tenantID string, filter *PositionFilter, page, pageSize int) (*PositionListResult, error)

	// FindDetailByID 查找岗位详情
	FindDetailByID(ctx context.Context, tenantID, positionID string) (*PositionDetail, error)

	// FindByDepartmentID 查找部门下的岗位
	FindByDepartmentID(ctx context.Context, departmentID string) ([]*model.Position, error)

	// Create 创建岗位
	Create(ctx context.Context, position *model.Position) error

	// Update 更新岗位
	Update(ctx context.Context, position *model.Position) error

	// Delete 删除岗位（软删除）
	Delete(ctx context.Context, tenantID, positionID string) error

	// ExistsByCode 检查编码是否存在
	ExistsByCode(ctx context.Context, tenantID, code string, excludeID string) (bool, error)

	// HasEmployees 检查是否有员工
	HasEmployees(ctx context.Context, positionID string) (bool, error)

	// CountEmployees 统计员工数量
	CountEmployees(ctx context.Context, positionID string) (int, error)
}
