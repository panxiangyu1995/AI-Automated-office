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

// positionRepository 岗位仓储实现
type positionRepository struct {
	db *sql.DB
}

// NewPositionRepository 创建岗位仓储
func NewPositionRepository(db *sql.DB) repository.PositionRepository {
	return &positionRepository{db: db}
}

// FindByID 根据 ID 查找岗位
func (r *positionRepository) FindByID(ctx context.Context, tenantID, positionID string) (*model.Position, error) {
	pos := &model.Position{}
	var departmentID, description sql.NullString
	var level sql.NullInt64
	var deletedAt sql.NullTime

	query := `
		SELECT id, tenant_id, department_id, name, code, description, level, sort_order, status,
		       created_at, updated_at, deleted_at
		FROM positions
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, positionID, tenantID).Scan(
		&pos.ID, &pos.TenantID, &departmentID, &pos.Name, &pos.Code, &description,
		&level, &pos.SortOrder, &pos.Status,
		&pos.CreatedAt, &pos.UpdatedAt, &deletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if departmentID.Valid {
		pos.DepartmentID = &departmentID.String
	}
	pos.Description = description.String
	if level.Valid {
		l := int(level.Int64)
		pos.Level = &l
	}

	return pos, nil
}

// FindByCode 根据编码查找岗位
func (r *positionRepository) FindByCode(ctx context.Context, tenantID, code string) (*model.Position, error) {
	pos := &model.Position{}
	var departmentID, description sql.NullString
	var level sql.NullInt64
	var deletedAt sql.NullTime

	query := `
		SELECT id, tenant_id, department_id, name, code, description, level, sort_order, status,
		       created_at, updated_at, deleted_at
		FROM positions
		WHERE code = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, code, tenantID).Scan(
		&pos.ID, &pos.TenantID, &departmentID, &pos.Name, &pos.Code, &description,
		&level, &pos.SortOrder, &pos.Status,
		&pos.CreatedAt, &pos.UpdatedAt, &deletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if departmentID.Valid {
		pos.DepartmentID = &departmentID.String
	}
	pos.Description = description.String
	if level.Valid {
		l := int(level.Int64)
		pos.Level = &l
	}

	return pos, nil
}

// FindWithFilters 分页筛选查询岗位列表
func (r *positionRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.PositionFilter, page, pageSize int) (*repository.PositionListResult, error) {
	result := &repository.PositionListResult{
		Page:     page,
		PageSize: pageSize,
	}

	// 构建 WHERE 条件
	whereClause := "WHERE p.tenant_id = $1 AND p.deleted_at IS NULL"
	args := []interface{}{tenantID}
	argIndex := 2

	if filter.Name != "" {
		whereClause += fmt.Sprintf(" AND p.name ILIKE $%d", argIndex)
		args = append(args, "%"+filter.Name+"%")
		argIndex++
	}
	if filter.Code != "" {
		whereClause += fmt.Sprintf(" AND p.code = $%d", argIndex)
		args = append(args, filter.Code)
		argIndex++
	}
	if filter.DepartmentID != "" {
		whereClause += fmt.Sprintf(" AND p.department_id = $%d", argIndex)
		args = append(args, filter.DepartmentID)
		argIndex++
	}
	if filter.Status != "" {
		whereClause += fmt.Sprintf(" AND p.status = $%d", argIndex)
		args = append(args, filter.Status)
		argIndex++
	}

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM positions p %s", whereClause)
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&result.Total)
	if err != nil {
		return nil, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 查询列表
	listQuery := fmt.Sprintf(`
		SELECT p.id, p.name, p.code, p.department_id, COALESCE(d.name, '') as department_name,
		       p.description, p.level, p.sort_order, p.status, p.created_at,
		       (SELECT COUNT(*) FROM user_positions up WHERE up.position_id = p.id) as employee_count
		FROM positions p
		LEFT JOIN departments d ON d.id = p.department_id AND d.deleted_at IS NULL
		%s
		ORDER BY p.sort_order, p.created_at
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		item := &repository.PositionListItem{}
		var departmentID, departmentName, description, code sql.NullString
		var level sql.NullInt64
		var createdAt time.Time

		err := rows.Scan(
			&item.ID, &item.Name, &code, &departmentID, &departmentName,
			&description, &level, &item.SortOrder, &item.Status, &createdAt,
			&item.EmployeeCount,
		)
		if err != nil {
			return nil, err
		}

		item.Code = code.String
		if departmentID.Valid {
			item.DepartmentID = &departmentID.String
			if departmentName.String != "" {
				item.Department = &repository.PositionDepartmentRef{
					ID:   departmentID.String,
					Name: departmentName.String,
				}
			}
		}
		item.Description = description.String
		if level.Valid {
			l := int(level.Int64)
			item.Level = &l
		}
		item.CreatedAt = createdAt.Format(time.RFC3339)

		result.Items = append(result.Items, item)
	}

	return result, nil
}

// FindDetailByID 查找岗位详情
func (r *positionRepository) FindDetailByID(ctx context.Context, tenantID, positionID string) (*repository.PositionDetail, error) {
	pos, err := r.FindByID(ctx, tenantID, positionID)
	if err != nil {
		return nil, err
	}
	if pos == nil {
		return nil, nil
	}

	detail := &repository.PositionDetail{
		PositionListItem: &repository.PositionListItem{
			ID:        pos.ID,
			Name:      pos.Name,
			Code:      pos.Code,
			DepartmentID: pos.DepartmentID,
			Description: pos.Description,
			Level:      pos.Level,
			SortOrder: pos.SortOrder,
			Status:    pos.Status,
			CreatedAt: pos.CreatedAt.Format(time.RFC3339),
		},
		UpdatedAt: pos.UpdatedAt.Format(time.RFC3339),
	}

	// 获取部门信息
	if pos.DepartmentID != nil {
		var deptName string
		err := r.db.QueryRowContext(ctx,
			`SELECT name FROM departments WHERE id = $1 AND deleted_at IS NULL`,
			*pos.DepartmentID,
		).Scan(&deptName)
		if err == nil {
			detail.Department = &repository.PositionDepartmentRef{
				ID:   *pos.DepartmentID,
				Name: deptName,
			}
		}
	}

	// 统计员工数量
	detail.EmployeeCount, _ = r.CountEmployees(ctx, positionID)

	return detail, nil
}

// FindByDepartmentID 查找部门下的岗位
func (r *positionRepository) FindByDepartmentID(ctx context.Context, departmentID string) ([]*model.Position, error) {
	query := `
		SELECT id, tenant_id, department_id, name, code, description, level, sort_order, status,
		       created_at, updated_at
		FROM positions
		WHERE department_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order, created_at
	`

	rows, err := r.db.QueryContext(ctx, query, departmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var positions []*model.Position
	for rows.Next() {
		pos := &model.Position{}
		var departmentID, description sql.NullString
		var level sql.NullInt64

		err := rows.Scan(
			&pos.ID, &pos.TenantID, &departmentID, &pos.Name, &pos.Code, &description,
			&level, &pos.SortOrder, &pos.Status,
			&pos.CreatedAt, &pos.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if departmentID.Valid {
			pos.DepartmentID = &departmentID.String
		}
		pos.Description = description.String
		if level.Valid {
			l := int(level.Int64)
			pos.Level = &l
		}

		positions = append(positions, pos)
	}

	return positions, nil
}

// Create 创建岗位
func (r *positionRepository) Create(ctx context.Context, position *model.Position) error {
	if position.ID == "" {
		position.ID = uuid.New().String()
	}

	now := time.Now()
	position.CreatedAt = now
	position.UpdatedAt = now

	query := `
		INSERT INTO positions (id, tenant_id, department_id, name, code, description, level, sort_order, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := r.db.ExecContext(ctx, query,
		position.ID, position.TenantID, nullStringPtr(position.DepartmentID),
		position.Name, position.Code, position.Description,
		nullIntPtr(position.Level), position.SortOrder, position.Status,
		position.CreatedAt, position.UpdatedAt,
	)

	return err
}

// Update 更新岗位
func (r *positionRepository) Update(ctx context.Context, position *model.Position) error {
	position.UpdatedAt = time.Now()

	query := `
		UPDATE positions SET
			name = $1,
			code = $2,
			department_id = $3,
			description = $4,
			level = $5,
			sort_order = $6,
			status = $7,
			updated_at = $8
		WHERE id = $9 AND tenant_id = $10 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query,
		position.Name, position.Code, nullStringPtr(position.DepartmentID),
		position.Description, nullIntPtr(position.Level),
		position.SortOrder, position.Status, position.UpdatedAt,
		position.ID, position.TenantID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("position not found")
	}

	return nil
}

// Delete 删除岗位（软删除）
func (r *positionRepository) Delete(ctx context.Context, tenantID, positionID string) error {
	query := `
		UPDATE positions SET deleted_at = $1, updated_at = $1
		WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, time.Now(), positionID, tenantID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("position not found")
	}

	return nil
}

// ExistsByCode 检查编码是否存在
func (r *positionRepository) ExistsByCode(ctx context.Context, tenantID, code string, excludeID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM positions WHERE code = $1 AND tenant_id = $2 AND id != $3 AND deleted_at IS NULL)`
	err := r.db.QueryRowContext(ctx, query, code, tenantID, excludeID).Scan(&exists)
	return exists, err
}

// HasEmployees 检查是否有员工
func (r *positionRepository) HasEmployees(ctx context.Context, positionID string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM user_positions WHERE position_id = $1`
	err := r.db.QueryRowContext(ctx, query, positionID).Scan(&count)
	return count > 0, err
}

// CountEmployees 统计员工数量
func (r *positionRepository) CountEmployees(ctx context.Context, positionID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM user_positions WHERE position_id = $1`
	err := r.db.QueryRowContext(ctx, query, positionID).Scan(&count)
	return count, err
}

// nullStringPtr 辅助函数 - 处理字符串指针
func nullStringPtr(s *string) interface{} {
	if s == nil || *s == "" {
		return nil
	}
	return *s
}

// nullIntPtr 辅助函数 - 处理整数指针
func nullIntPtr(i *int) interface{} {
	if i == nil {
		return nil
	}
	return *i
}
