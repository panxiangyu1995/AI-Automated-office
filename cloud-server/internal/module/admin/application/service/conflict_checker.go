package service

import (
	"context"
	"fmt"

	"cloud-server/internal/module/admin/domain/entity"
	"cloud-server/internal/module/admin/domain/repository"

	"github.com/google/uuid"
)

// ConflictChecker 冲突检测器
type ConflictChecker struct {
	userRepo       repository.UserRepository
	departmentRepo repository.DepartmentRepository
	positionRepo   repository.PositionRepository
}

// NewConflictChecker 创建冲突检测器
func NewConflictChecker(
	userRepo repository.UserRepository,
	departmentRepo repository.DepartmentRepository,
	positionRepo repository.PositionRepository,
) *ConflictChecker {
	return &ConflictChecker{
		userRepo:       userRepo,
		departmentRepo: departmentRepo,
		positionRepo:   positionRepo,
	}
}

// ConflictResult 冲突检测结果
type ConflictResult struct {
	HasConflict    bool
	ConflictType   entity.ConflictType
	ConflictDesc   string
	ConflictDetail map[string]interface{}
}

// CheckRow 检测单行数据的冲突
func (c *ConflictChecker) CheckRow(ctx context.Context, tenantID uuid.UUID, data *entity.ImportRowData, rowNumber int) *ConflictResult {
	tenantIDStr := tenantID.String()

	// 1. 检查用户名重复
	if conflict := c.checkDuplicateUsername(ctx, tenantIDStr, data.Username); conflict != nil {
		conflict.ConflictDesc = fmt.Sprintf("行 %d: 用户名 '%s' 已存在", rowNumber, data.Username)
		return conflict
	}

	// 2. 检查工号重复
	if data.EmployeeCode != "" {
		if conflict := c.checkDuplicateEmployeeCode(ctx, tenantIDStr, data.EmployeeCode); conflict != nil {
			conflict.ConflictDesc = fmt.Sprintf("行 %d: 工号 '%s' 已存在", rowNumber, data.EmployeeCode)
			return conflict
		}
	}

	// 3. 检查部门是否存在
	if data.DepartmentCode != "" {
		if conflict := c.checkDepartmentExistsByCode(ctx, tenantIDStr, data.DepartmentCode); conflict != nil {
			conflict.ConflictDesc = fmt.Sprintf("行 %d: 部门编码 '%s' 不存在", rowNumber, data.DepartmentCode)
			return conflict
		}
	} else if data.DepartmentName != "" {
		if conflict := c.checkDepartmentExistsByName(ctx, tenantIDStr, data.DepartmentName); conflict != nil {
			conflict.ConflictDesc = fmt.Sprintf("行 %d: 部门 '%s' 不存在", rowNumber, data.DepartmentName)
			return conflict
		}
	}

	// 4. 检查岗位是否存在
	if data.PositionCode != "" {
		if conflict := c.checkPositionExists(ctx, tenantIDStr, data.PositionCode); conflict != nil {
			conflict.ConflictDesc = fmt.Sprintf("行 %d: 岗位编码 '%s' 不存在", rowNumber, data.PositionCode)
			return conflict
		}
	}

	// 5. 检查上级是否存在
	if data.ManagerUsername != "" {
		if conflict := c.checkManagerExists(ctx, tenantIDStr, data.ManagerUsername); conflict != nil {
			conflict.ConflictDesc = fmt.Sprintf("行 %d: 上级用户名 '%s' 不存在", rowNumber, data.ManagerUsername)
			return conflict
		}
	}

	return &ConflictResult{HasConflict: false}
}

// CheckBatch 检测批量数据的内部冲突
func (c *ConflictChecker) CheckBatch(rows []*entity.ImportRowData) map[int]*ConflictResult {
	results := make(map[int]*ConflictResult)

	// 用于跟踪已出现的用户名和工号
	usernameSet := make(map[string]int) // username -> row index
	employeeCodeSet := make(map[string]int)

	for i, row := range rows {
		// 检查用户名在批次内是否重复
		if prevIdx, exists := usernameSet[row.Username]; exists {
			results[i] = &ConflictResult{
				HasConflict:   true,
				ConflictType:  entity.ConflictDuplicateUsername,
				ConflictDesc:  fmt.Sprintf("用户名 '%s' 在批次内第 %d 行已出现", row.Username, prevIdx+1),
				ConflictDetail: map[string]interface{}{
					"duplicate_of_row": prevIdx + 1,
				},
			}
			continue
		}
		usernameSet[row.Username] = i

		// 检查工号在批次内是否重复
		if row.EmployeeCode != "" {
			if prevIdx, exists := employeeCodeSet[row.EmployeeCode]; exists {
				results[i] = &ConflictResult{
					HasConflict:   true,
					ConflictType:  entity.ConflictDuplicateEmployeeCode,
					ConflictDesc:  fmt.Sprintf("工号 '%s' 在批次内第 %d 行已出现", row.EmployeeCode, prevIdx+1),
					ConflictDetail: map[string]interface{}{
						"duplicate_of_row": prevIdx + 1,
					},
				}
				continue
			}
			employeeCodeSet[row.EmployeeCode] = i
		}
	}

	return results
}

func (c *ConflictChecker) checkDuplicateUsername(ctx context.Context, tenantID, username string) *ConflictResult {
	exists, err := c.userRepo.ExistsByUsername(ctx, tenantID, username)
	if err != nil {
		return nil // 查询错误时不阻塞导入
	}
	if exists {
		return &ConflictResult{
			HasConflict:  true,
			ConflictType: entity.ConflictDuplicateUsername,
			ConflictDetail: map[string]interface{}{
				"username": username,
			},
		}
	}
	return nil
}

func (c *ConflictChecker) checkDuplicateEmployeeCode(ctx context.Context, tenantID, employeeCode string) *ConflictResult {
	exists, err := c.userRepo.ExistsByEmployeeCode(ctx, tenantID, employeeCode)
	if err != nil {
		return nil
	}
	if exists {
		return &ConflictResult{
			HasConflict:  true,
			ConflictType: entity.ConflictDuplicateEmployeeCode,
			ConflictDetail: map[string]interface{}{
				"employee_code": employeeCode,
			},
		}
	}
	return nil
}

func (c *ConflictChecker) checkDepartmentExistsByCode(ctx context.Context, tenantID, code string) *ConflictResult {
	// ExistsByCode 需要 4 个参数：ctx, tenantID, code, excludeID
	exists, err := c.departmentRepo.ExistsByCode(ctx, tenantID, code, "")
	if err != nil {
		return nil
	}
	if !exists {
		return &ConflictResult{
			HasConflict:  true,
			ConflictType: entity.ConflictDepartmentNotFound,
			ConflictDetail: map[string]interface{}{
				"department_code": code,
			},
		}
	}
	return nil
}

func (c *ConflictChecker) checkDepartmentExistsByName(ctx context.Context, tenantID, name string) *ConflictResult {
	// 通过 FindTree 获取部门树，然后查找名称匹配的部门
	tree, err := c.departmentRepo.FindTree(ctx, tenantID)
	if err != nil {
		return nil
	}
	
	if !findDepartmentInTree(tree, name) {
		return &ConflictResult{
			HasConflict:  true,
			ConflictType: entity.ConflictDepartmentNotFound,
			ConflictDetail: map[string]interface{}{
				"department_name": name,
			},
		}
	}
	return nil
}

// findDepartmentInTree 递归查找部门树中是否存在指定名称的部门
func findDepartmentInTree(items []*repository.DepartmentTreeItem, name string) bool {
	for _, item := range items {
		if item.Name == name {
			return true
		}
		if findDepartmentInTree(item.Children, name) {
			return true
		}
	}
	return false
}

func (c *ConflictChecker) checkPositionExists(ctx context.Context, tenantID, code string) *ConflictResult {
	// ExistsByCode 需要 4 个参数：ctx, tenantID, code, excludeID
	exists, err := c.positionRepo.ExistsByCode(ctx, tenantID, code, "")
	if err != nil {
		return nil
	}
	if !exists {
		return &ConflictResult{
			HasConflict:  true,
			ConflictType: entity.ConflictPositionNotFound,
			ConflictDetail: map[string]interface{}{
				"position_code": code,
			},
		}
	}
	return nil
}

func (c *ConflictChecker) checkManagerExists(ctx context.Context, tenantID, username string) *ConflictResult {
	exists, err := c.userRepo.ExistsByUsername(ctx, tenantID, username)
	if err != nil {
		return nil
	}
	if !exists {
		return &ConflictResult{
			HasConflict:  true,
			ConflictType: entity.ConflictManagerNotFound,
			ConflictDetail: map[string]interface{}{
				"manager_username": username,
			},
		}
	}
	return nil
}