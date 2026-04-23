package persistence

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/admin/domain/repository"

	"github.com/google/uuid"
)

// departmentRepository 部门仓储实现
type departmentRepository struct {
	db *sql.DB
}

// NewDepartmentRepository 创建部门仓储
func NewDepartmentRepository(db *sql.DB) repository.DepartmentRepository {
	return &departmentRepository{db: db}
}

// nullStringToPtr 辅助函数 - 将 sql.NullString 转换为 *string
func nullStringToPtr(ns sql.NullString) *string {
	if !ns.Valid || ns.String == "" {
		return nil
	}
	return &ns.String
}

// FindByID 根据 ID 查找部门
func (r *departmentRepository) FindByID(ctx context.Context, tenantID, departmentID string) (*model.Department, error) {
	dept := &model.Department{}
	var parentID, managerID, path sql.NullString
	var deletedAt sql.NullTime

	query := `
		SELECT id, tenant_id, parent_id, name, code, manager_id, level, path, sort_order, status,
		       created_at, updated_at, deleted_at
		FROM departments
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, departmentID, tenantID).Scan(
		&dept.ID, &dept.TenantID, &parentID, &dept.Name, &dept.Code, &managerID,
		&dept.Level, &path, &dept.SortOrder, &dept.Status,
		&dept.CreatedAt, &dept.UpdatedAt, &deletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	dept.ParentID = nullStringToPtr(parentID)
	dept.LeaderID = nullStringToPtr(managerID)
	dept.Path = path.String

	return dept, nil
}

// FindByCode 根据编码查找部门
func (r *departmentRepository) FindByCode(ctx context.Context, tenantID, code string) (*model.Department, error) {
	dept := &model.Department{}
	var parentID, managerID, path sql.NullString
	var deletedAt sql.NullTime

	query := `
		SELECT id, tenant_id, parent_id, name, code, manager_id, level, path, sort_order, status,
		       created_at, updated_at, deleted_at
		FROM departments
		WHERE code = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, code, tenantID).Scan(
		&dept.ID, &dept.TenantID, &parentID, &dept.Name, &dept.Code, &managerID,
		&dept.Level, &path, &dept.SortOrder, &dept.Status,
		&dept.CreatedAt, &dept.UpdatedAt, &deletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	dept.ParentID = nullStringToPtr(parentID)
	dept.LeaderID = nullStringToPtr(managerID)
	dept.Path = path.String

	return dept, nil
}

// FindTree 获取部门树
func (r *departmentRepository) FindTree(ctx context.Context, tenantID string) ([]*repository.DepartmentTreeItem, error) {
	// 查询所有部门
	query := `
		SELECT d.id, d.parent_id, d.name, d.code, d.manager_id, d.sort_order, d.status,
		       COALESCE(u.name, '') as leader_name
		FROM departments d
		LEFT JOIN users u ON u.id = d.manager_id AND u.deleted_at IS NULL
		WHERE d.tenant_id = $1 AND d.deleted_at IS NULL
		ORDER BY d.sort_order, d.created_at
	`

	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// 构建部门映射
	deptMap := make(map[string]*repository.DepartmentTreeItem)
	var rootItems []*repository.DepartmentTreeItem
	var allItems []*repository.DepartmentTreeItem

	for rows.Next() {
		item := &repository.DepartmentTreeItem{Children: []*repository.DepartmentTreeItem{}}
		var parentID, managerID, leaderName, code sql.NullString

		err := rows.Scan(&item.ID, &parentID, &item.Name, &code, &managerID, &item.SortOrder, &item.Status, &leaderName)
		if err != nil {
			return nil, err
		}

		item.Code = code.String
		item.ParentID = nullStringToPtr(parentID)
		if managerID.Valid && leaderName.String != "" {
			item.Leader = &repository.DepartmentLeaderRef{
				ID:   managerID.String,
				Name: leaderName.String,
			}
		}

		deptMap[item.ID] = item
		allItems = append(allItems, item)
	}

	// 构建树结构
	for _, item := range allItems {
		if item.ParentID == nil {
			rootItems = append(rootItems, item)
		} else {
			if parent, ok := deptMap[*item.ParentID]; ok {
				parent.Children = append(parent.Children, item)
			}
		}
	}

	return rootItems, nil
}

// FindWithFilters 分页筛选查询部门列表
func (r *departmentRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.DepartmentFilter, page, pageSize int) (*repository.DepartmentListResult, error) {
	result := &repository.DepartmentListResult{
		Page:     page,
		PageSize: pageSize,
	}

	// 构建 WHERE 条件
	whereClause := "WHERE d.tenant_id = $1 AND d.deleted_at IS NULL"
	args := []interface{}{tenantID}
	argIndex := 2

	if filter.Name != "" {
		whereClause += fmt.Sprintf(" AND d.name ILIKE $%d", argIndex)
		args = append(args, "%"+filter.Name+"%")
		argIndex++
	}
	if filter.Code != "" {
		whereClause += fmt.Sprintf(" AND d.code = $%d", argIndex)
		args = append(args, filter.Code)
		argIndex++
	}
	if filter.Status != "" {
		whereClause += fmt.Sprintf(" AND d.status = $%d", argIndex)
		args = append(args, filter.Status)
		argIndex++
	}

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM departments d %s", whereClause)
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&result.Total)
	if err != nil {
		return nil, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 查询列表
	listQuery := fmt.Sprintf(`
		SELECT d.id, d.name, d.code, d.parent_id, COALESCE(pd.name, '') as parent_name,
		       d.manager_id, COALESCE(u.name, '') as leader_name, d.sort_order, d.status, d.created_at,
		       (SELECT COUNT(*) FROM user_departments ud WHERE ud.department_id = d.id) as employee_count
		FROM departments d
		LEFT JOIN departments pd ON pd.id = d.parent_id
		LEFT JOIN users u ON u.id = d.manager_id AND u.deleted_at IS NULL
		%s
		ORDER BY d.sort_order, d.created_at
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		item := &repository.DepartmentListItem{}
		var parentID, parentName, managerID, leaderName, code sql.NullString
		var createdAt time.Time

		err := rows.Scan(
			&item.ID, &item.Name, &code, &parentID, &parentName,
			&managerID, &leaderName, &item.SortOrder, &item.Status, &createdAt,
			&item.EmployeeCount,
		)
		if err != nil {
			return nil, err
		}

		item.Code = code.String
		item.ParentID = nullStringToPtr(parentID)
		item.ParentName = parentName.String
		if managerID.Valid && leaderName.String != "" {
			item.Leader = &repository.DepartmentLeaderRef{
				ID:   managerID.String,
				Name: leaderName.String,
			}
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)

		result.Items = append(result.Items, item)
	}

	return result, nil
}

// FindDetailByID 查找部门详情
func (r *departmentRepository) FindDetailByID(ctx context.Context, tenantID, departmentID string) (*repository.DepartmentDetail, error) {
	dept, err := r.FindByID(ctx, tenantID, departmentID)
	if err != nil {
		return nil, err
	}
	if dept == nil {
		return nil, nil
	}

	detail := &repository.DepartmentDetail{
		DepartmentListItem: &repository.DepartmentListItem{
			ID:        dept.ID,
			Name:      dept.Name,
			Code:      dept.Code,
			ParentID:  dept.ParentID,
			SortOrder: dept.SortOrder,
			Status:    dept.Status,
			CreatedAt: dept.CreatedAt.Format(time.RFC3339),
		},
		UpdatedAt: dept.UpdatedAt.Format(time.RFC3339),
		Path:      dept.Path,
	}

	// 获取父部门名称
	if dept.ParentID != nil {
		var parentName string
		err := r.db.QueryRowContext(ctx,
			`SELECT name FROM departments WHERE id = $1 AND deleted_at IS NULL`,
			*dept.ParentID,
		).Scan(&parentName)
		if err == nil {
			detail.ParentName = parentName
		}
	}

	// 获取负责人信息
	if dept.LeaderID != nil {
		var leaderName string
		err := r.db.QueryRowContext(ctx,
			`SELECT name FROM users WHERE id = $1 AND deleted_at IS NULL`,
			*dept.LeaderID,
		).Scan(&leaderName)
		if err == nil {
			detail.Leader = &repository.DepartmentLeaderRef{
				ID:   *dept.LeaderID,
				Name: leaderName,
			}
		}
	}

	// 统计员工数量
	detail.EmployeeCount, _ = r.CountEmployees(ctx, departmentID)

	return detail, nil
}

// FindChildren 查找子部门
func (r *departmentRepository) FindChildren(ctx context.Context, departmentID string) ([]*model.Department, error) {
	query := `
		SELECT id, tenant_id, parent_id, name, code, manager_id, level, path, sort_order, status,
		       created_at, updated_at
		FROM departments
		WHERE parent_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order, created_at
	`

	rows, err := r.db.QueryContext(ctx, query, departmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []*model.Department
	for rows.Next() {
		dept := &model.Department{}
		var parentID, managerID, path sql.NullString

		err := rows.Scan(
			&dept.ID, &dept.TenantID, &parentID, &dept.Name, &dept.Code, &managerID,
			&dept.Level, &path, &dept.SortOrder, &dept.Status,
			&dept.CreatedAt, &dept.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		dept.ParentID = nullStringToPtr(parentID)
		dept.LeaderID = nullStringToPtr(managerID)
		dept.Path = path.String

		departments = append(departments, dept)
	}

	return departments, nil
}

// FindAncestors 查找所有祖先部门（使用闭包表）
func (r *departmentRepository) FindAncestors(ctx context.Context, departmentID string) ([]*model.Department, error) {
	query := `
		SELECT d.id, d.tenant_id, d.parent_id, d.name, d.code, d.manager_id, d.level, d.path,
		       d.sort_order, d.status, d.created_at, d.updated_at
		FROM departments d
		JOIN department_closure dc ON dc.ancestor_id = d.id
		WHERE dc.descendant_id = $1 AND dc.depth > 0 AND d.deleted_at IS NULL
		ORDER BY dc.depth DESC
	`

	rows, err := r.db.QueryContext(ctx, query, departmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []*model.Department
	for rows.Next() {
		dept := &model.Department{}
		var parentID, managerID, path sql.NullString

		err := rows.Scan(
			&dept.ID, &dept.TenantID, &parentID, &dept.Name, &dept.Code, &managerID,
			&dept.Level, &path, &dept.SortOrder, &dept.Status,
			&dept.CreatedAt, &dept.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		dept.ParentID = nullStringToPtr(parentID)
		dept.LeaderID = nullStringToPtr(managerID)
		dept.Path = path.String

		departments = append(departments, dept)
	}

	return departments, nil
}

// FindDescendants 查找所有后代部门（使用闭包表）
func (r *departmentRepository) FindDescendants(ctx context.Context, departmentID string) ([]*model.Department, error) {
	query := `
		SELECT d.id, d.tenant_id, d.parent_id, d.name, d.code, d.manager_id, d.level, d.path,
		       d.sort_order, d.status, d.created_at, d.updated_at
		FROM departments d
		JOIN department_closure dc ON dc.descendant_id = d.id
		WHERE dc.ancestor_id = $1 AND dc.depth > 0 AND d.deleted_at IS NULL
		ORDER BY dc.depth
	`

	rows, err := r.db.QueryContext(ctx, query, departmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var departments []*model.Department
	for rows.Next() {
		dept := &model.Department{}
		var parentID, managerID, path sql.NullString

		err := rows.Scan(
			&dept.ID, &dept.TenantID, &parentID, &dept.Name, &dept.Code, &managerID,
			&dept.Level, &path, &dept.SortOrder, &dept.Status,
			&dept.CreatedAt, &dept.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		dept.ParentID = nullStringToPtr(parentID)
		dept.LeaderID = nullStringToPtr(managerID)
		dept.Path = path.String

		departments = append(departments, dept)
	}

	return departments, nil
}

// Create 创建部门
func (r *departmentRepository) Create(ctx context.Context, department *model.Department) error {
	if department.ID == "" {
		department.ID = uuid.New().String()
	}

	now := time.Now()
	department.CreatedAt = now
	department.UpdatedAt = now

	// 计算层级和路径
	if department.ParentID != nil {
		var parentLevel int
		var parentPath string
		err := r.db.QueryRowContext(ctx,
			`SELECT level, COALESCE(path, '') FROM departments WHERE id = $1 AND deleted_at IS NULL`,
			*department.ParentID,
		).Scan(&parentLevel, &parentPath)
		if err == nil {
			department.Level = parentLevel + 1
			if parentPath != "" {
				department.Path = parentPath + "/" + department.ID
			} else {
				department.Path = *department.ParentID + "/" + department.ID
			}
		}
	} else {
		department.Level = 1
		department.Path = department.ID
	}

	query := `
		INSERT INTO departments (id, tenant_id, parent_id, name, code, manager_id, level, path, sort_order, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err := r.db.ExecContext(ctx, query,
		department.ID, department.TenantID, ptrToNullString(department.ParentID),
		department.Name, department.Code, ptrToNullString(department.LeaderID),
		department.Level, department.Path, department.SortOrder, department.Status,
		department.CreatedAt, department.UpdatedAt,
	)

	return err
}

// Update 更新部门
func (r *departmentRepository) Update(ctx context.Context, department *model.Department) error {
	department.UpdatedAt = time.Now()

	query := `
		UPDATE departments SET
			name = $1,
			code = $2,
			manager_id = $3,
			sort_order = $4,
			status = $5,
			updated_at = $6
		WHERE id = $7 AND tenant_id = $8 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query,
		department.Name, department.Code, ptrToNullString(department.LeaderID),
		department.SortOrder, department.Status, department.UpdatedAt,
		department.ID, department.TenantID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("department not found")
	}

	return nil
}

// Delete 删除部门（软删除）
func (r *departmentRepository) Delete(ctx context.Context, tenantID, departmentID string) error {
	query := `
		UPDATE departments SET deleted_at = $1, updated_at = $1
		WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, time.Now(), departmentID, tenantID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("department not found")
	}

	// 删除闭包表中的记录
	_, _ = r.db.ExecContext(ctx,
		`DELETE FROM department_closure WHERE descendant_id = $1 OR ancestor_id = $1`,
		departmentID,
	)

	return nil
}

// ExistsByCode 检查编码是否存在
func (r *departmentRepository) ExistsByCode(ctx context.Context, tenantID, code string, excludeID string) (bool, error) {
	var exists bool
	var err error

	// 根据 excludeID 是否为空选择不同的查询
	if excludeID == "" {
		query := `SELECT EXISTS(SELECT 1 FROM departments WHERE code = $1 AND tenant_id = $2 AND deleted_at IS NULL)`
		err = r.db.QueryRowContext(ctx, query, code, tenantID).Scan(&exists)
	} else {
		query := `SELECT EXISTS(SELECT 1 FROM departments WHERE code = $1 AND tenant_id = $2 AND id != $3 AND deleted_at IS NULL)`
		err = r.db.QueryRowContext(ctx, query, code, tenantID, excludeID).Scan(&exists)
	}

	return exists, err
}

// HasChildren 检查是否有子部门
func (r *departmentRepository) HasChildren(ctx context.Context, departmentID string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM departments WHERE parent_id = $1 AND deleted_at IS NULL`
	err := r.db.QueryRowContext(ctx, query, departmentID).Scan(&count)
	return count > 0, err
}

// HasEmployees 检查是否有员工
func (r *departmentRepository) HasEmployees(ctx context.Context, departmentID string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM user_departments WHERE department_id = $1`
	err := r.db.QueryRowContext(ctx, query, departmentID).Scan(&count)
	return count > 0, err
}

// CountEmployees 统计员工数量
func (r *departmentRepository) CountEmployees(ctx context.Context, departmentID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM user_departments WHERE department_id = $1`
	err := r.db.QueryRowContext(ctx, query, departmentID).Scan(&count)
	return count, err
}

// CheckCircularReference 检查循环引用
func (r *departmentRepository) CheckCircularReference(ctx context.Context, departmentID, newParentID string) (bool, error) {
	// 使用闭包表检查：如果 newParentID 是 departmentID 的后代，则会形成循环
	var count int
	query := `
		SELECT COUNT(*) FROM department_closure
		WHERE ancestor_id = $1 AND descendant_id = $2
	`
	err := r.db.QueryRowContext(ctx, query, departmentID, newParentID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// UpdatePath 更新部门路径
func (r *departmentRepository) UpdatePath(ctx context.Context, departmentID string, parentPath string) error {
	newPath := parentPath + "/" + departmentID
	query := `UPDATE departments SET path = $1, updated_at = $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, newPath, time.Now(), departmentID)
	return err
}

// ptrToNullString 辅助函数 - 将 *string 转换为 interface{} 用于数据库插入
func ptrToNullString(s *string) interface{} {
	if s == nil || *s == "" {
		return nil
	}
	return *s
}