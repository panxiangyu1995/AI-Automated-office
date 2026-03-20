package persistence

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"github.com/google/uuid"
)

// permissionRepository 权限仓储实现
type permissionRepository struct {
	db *sql.DB
}

// NewPermissionRepository 创建权限仓储
func NewPermissionRepository(db *sql.DB) repository.PermissionRepository {
	return &permissionRepository{db: db}
}

// FindByID 根据 ID 查找权限
func (r *permissionRepository) FindByID(ctx context.Context, permissionID string) (*model.Permission, error) {
	query := `
		SELECT id, tenant_id, code, name, resource, action, layer, description, created_at
		FROM permissions
		WHERE id = $1
	`

	perm := &model.Permission{}
	var tenantID sql.NullString
	var description sql.NullString

	err := r.db.QueryRowContext(ctx, query, permissionID).Scan(
		&perm.ID, &tenantID, &perm.Code, &perm.Name, &perm.Resource,
		&perm.Action, &perm.Layer, &description, &perm.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if tenantID.Valid {
		perm.TenantID = &tenantID.String
	}
	perm.Description = description.String
	return perm, nil
}

// FindByCode 根据编码查找权限
func (r *permissionRepository) FindByCode(ctx context.Context, code string) (*model.Permission, error) {
	query := `
		SELECT id, tenant_id, code, name, resource, action, layer, description, created_at
		FROM permissions
		WHERE code = $1
	`

	perm := &model.Permission{}
	var tenantID sql.NullString
	var description sql.NullString

	err := r.db.QueryRowContext(ctx, query, code).Scan(
		&perm.ID, &tenantID, &perm.Code, &perm.Name, &perm.Resource,
		&perm.Action, &perm.Layer, &description, &perm.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if tenantID.Valid {
		perm.TenantID = &tenantID.String
	}
	perm.Description = description.String
	return perm, nil
}

// FindWithFilters 分页筛选查询权限列表
func (r *permissionRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.PermissionFilter, page, pageSize int) (*repository.PermissionListResult, error) {
	result := &repository.PermissionListResult{
		Page:     page,
		PageSize: pageSize,
	}

	// 构建 WHERE 条件
	whereClause := "WHERE tenant_id IS NULL OR tenant_id = $1"
	args := []interface{}{tenantID}
	argIndex := 2

	if filter.Code != "" {
		whereClause += fmt.Sprintf(" AND code ILIKE $%d", argIndex)
		args = append(args, "%"+filter.Code+"%")
		argIndex++
	}
	if filter.Resource != "" {
		whereClause += fmt.Sprintf(" AND resource = $%d", argIndex)
		args = append(args, filter.Resource)
		argIndex++
	}
	if filter.Action != "" {
		whereClause += fmt.Sprintf(" AND action = $%d", argIndex)
		args = append(args, filter.Action)
		argIndex++
	}
	if filter.Layer != "" {
		whereClause += fmt.Sprintf(" AND layer = $%d", argIndex)
		args = append(args, filter.Layer)
		argIndex++
	}

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM permissions %s", whereClause)
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&result.Total)
	if err != nil {
		return nil, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 查询列表
	listQuery := fmt.Sprintf(`
		SELECT id, tenant_id, code, name, resource, action, layer, description, created_at
		FROM permissions
		%s
		ORDER BY layer, resource, action
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		item := &repository.PermissionItem{}
		var tenantID sql.NullString
		var description sql.NullString
		var createdAt time.Time

		err := rows.Scan(
			&item.ID, &tenantID, &item.Code, &item.Name, &item.Resource,
			&item.Action, &item.Layer, &description, &createdAt,
		)
		if err != nil {
			return nil, err
		}
		item.Description = description.String
		result.Items = append(result.Items, item)
	}

	return result, nil
}

// FindAll 获取所有权限
func (r *permissionRepository) FindAll(ctx context.Context) ([]*model.Permission, error) {
	query := `
		SELECT id, tenant_id, code, name, resource, action, layer, description, created_at
		FROM permissions
		ORDER BY layer, resource, action
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var permissions []*model.Permission
	for rows.Next() {
		perm := &model.Permission{}
		var tenantID sql.NullString
		var description sql.NullString

		err := rows.Scan(
			&perm.ID, &tenantID, &perm.Code, &perm.Name, &perm.Resource,
			&perm.Action, &perm.Layer, &description, &perm.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if tenantID.Valid {
			perm.TenantID = &tenantID.String
		}
		perm.Description = description.String
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// FindByRoleID 获取角色的所有权限
func (r *permissionRepository) FindByRoleID(ctx context.Context, roleID string) ([]*model.Permission, error) {
	query := `
		SELECT p.id, p.tenant_id, p.code, p.name, p.resource, p.action, p.layer, p.description, p.created_at
		FROM permissions p
		JOIN role_permissions rp ON rp.permission_id = p.id
		WHERE rp.role_id = $1
		ORDER BY p.layer, p.resource, p.action
	`

	rows, err := r.db.QueryContext(ctx, query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanPermissions(rows)
}

// FindByUserID 获取用户的所有权限
func (r *permissionRepository) FindByUserID(ctx context.Context, userID string) ([]*model.Permission, error) {
	query := `
		SELECT DISTINCT p.id, p.tenant_id, p.code, p.name, p.resource, p.action, p.layer, p.description, p.created_at
		FROM permissions p
		JOIN role_permissions rp ON rp.permission_id = p.id
		JOIN user_roles ur ON ur.role_id = rp.role_id
		WHERE ur.user_id = $1
		ORDER BY p.layer, p.resource, p.action
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanPermissions(rows)
}

// scanPermissions 扫描权限列表
func (r *permissionRepository) scanPermissions(rows *sql.Rows) ([]*model.Permission, error) {
	var permissions []*model.Permission
	for rows.Next() {
		perm := &model.Permission{}
		var tenantID sql.NullString
		var description sql.NullString

		err := rows.Scan(
			&perm.ID, &tenantID, &perm.Code, &perm.Name, &perm.Resource,
			&perm.Action, &perm.Layer, &description, &perm.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		if tenantID.Valid {
			perm.TenantID = &tenantID.String
		}
		perm.Description = description.String
		permissions = append(permissions, perm)
	}

	return permissions, nil
}

// FindGroupedByLayer 获取按层级分组的权限
func (r *permissionRepository) FindGroupedByLayer(ctx context.Context, tenantID string) (*repository.PermissionGroupedByLayer, error) {
	query := `
		SELECT id, tenant_id, code, name, resource, action, layer, description, created_at
		FROM permissions
		WHERE tenant_id IS NULL OR tenant_id = $1
		ORDER BY layer, resource, action
	`

	rows, err := r.db.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := &repository.PermissionGroupedByLayer{
		Base:       []*repository.PermissionItem{},
		Department: []*repository.PermissionItem{},
		Approval:   []*repository.PermissionItem{},
	}

	for rows.Next() {
		item := &repository.PermissionItem{}
		var tenantID sql.NullString
		var layer string
		var description sql.NullString
		var createdAt time.Time

		err := rows.Scan(
			&item.ID, &tenantID, &item.Code, &item.Name, &item.Resource,
			&item.Action, &layer, &description, &createdAt,
		)
		if err != nil {
			return nil, err
		}
		item.Description = description.String

		switch model.PermissionLayer(layer) {
		case model.LayerBase:
			result.Base = append(result.Base, item)
		case model.LayerDepartment:
			result.Department = append(result.Department, item)
		case model.LayerApproval:
			result.Approval = append(result.Approval, item)
		}
	}

	return result, nil
}

// Create 创建权限
func (r *permissionRepository) Create(ctx context.Context, permission *model.Permission) error {
	if permission.ID == "" {
		permission.ID = uuid.New().String()
	}

	permission.CreatedAt = time.Now()

	query := `
		INSERT INTO permissions (id, tenant_id, code, name, resource, action, layer, description, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	var tenantID interface{}
	if permission.TenantID != nil {
		tenantID = *permission.TenantID
	}

	_, err := r.db.ExecContext(ctx, query,
		permission.ID, tenantID, permission.Code, permission.Name, permission.Resource,
		permission.Action, permission.Layer, nullString(permission.Description), permission.CreatedAt,
	)

	return err
}

// Update 更新权限
func (r *permissionRepository) Update(ctx context.Context, permission *model.Permission) error {
	query := `
		UPDATE permissions SET
			name = $1,
			description = $2
		WHERE id = $3
	`

	result, err := r.db.ExecContext(ctx, query,
		permission.Name, nullString(permission.Description), permission.ID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("permission not found")
	}

	return nil
}

// Delete 删除权限
func (r *permissionRepository) Delete(ctx context.Context, permissionID string) error {
	// 先删除关联的角色权限
	_, err := r.db.ExecContext(ctx, "DELETE FROM role_permissions WHERE permission_id = $1", permissionID)
	if err != nil {
		return err
	}

	// 删除权限
	result, err := r.db.ExecContext(ctx, "DELETE FROM permissions WHERE id = $1", permissionID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("permission not found")
	}

	return nil
}

// ExistsByCode 检查编码是否存在
func (r *permissionRepository) ExistsByCode(ctx context.Context, tenantID *string, code string) (bool, error) {
	var exists bool
	var query string
	var args []interface{}

	if tenantID != nil {
		query = `SELECT EXISTS(SELECT 1 FROM permissions WHERE code = $1 AND tenant_id = $2)`
		args = []interface{}{code, *tenantID}
	} else {
		query = `SELECT EXISTS(SELECT 1 FROM permissions WHERE code = $1 AND tenant_id IS NULL)`
		args = []interface{}{code}
	}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&exists)
	return exists, err
}

// GetPermissionSet 获取用户的权限集合
func (r *permissionRepository) GetPermissionSet(ctx context.Context, userID string) (*model.PermissionSet, error) {
	permissions, err := r.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	permissionSet := model.NewPermissionSet()
	for _, perm := range permissions {
		permissionSet.Add(perm)
	}

	return permissionSet, nil
}
