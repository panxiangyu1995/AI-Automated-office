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

// roleRepository 角色仓储实现
type roleRepository struct {
	db *sql.DB
}

// NewRoleRepository 创建角色仓储
func NewRoleRepository(db *sql.DB) repository.RoleRepository {
	return &roleRepository{db: db}
}

// FindByID 根据 ID 查找角色
func (r *roleRepository) FindByID(ctx context.Context, tenantID, roleID string) (*model.Role, error) {
	query := `
		SELECT id, tenant_id, name, code, type, layer, description, is_system, created_at, updated_at
		FROM roles
		WHERE id = $1 AND tenant_id = $2
	`

	role := &model.Role{}
	var description sql.NullString

	err := r.db.QueryRowContext(ctx, query, roleID, tenantID).Scan(
		&role.ID, &role.TenantID, &role.Name, &role.Code, &role.Type, &role.Layer,
		&description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	role.Description = description.String
	return role, nil
}

// FindByCode 根据编码查找角色
func (r *roleRepository) FindByCode(ctx context.Context, tenantID, code string) (*model.Role, error) {
	query := `
		SELECT id, tenant_id, name, code, type, layer, description, is_system, created_at, updated_at
		FROM roles
		WHERE code = $1 AND tenant_id = $2
	`

	role := &model.Role{}
	var description sql.NullString

	err := r.db.QueryRowContext(ctx, query, code, tenantID).Scan(
		&role.ID, &role.TenantID, &role.Name, &role.Code, &role.Type, &role.Layer,
		&description, &role.IsSystem, &role.CreatedAt, &role.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	role.Description = description.String
	return role, nil
}

// FindWithFilters 分页筛选查询角色列表
func (r *roleRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.RoleFilter, page, pageSize int) (*repository.RoleListResult, error) {
	result := &repository.RoleListResult{
		Page:     page,
		PageSize: pageSize,
	}

	// 构建 WHERE 条件
	whereClause := "WHERE tenant_id = $1"
	args := []interface{}{tenantID}
	argIndex := 2

	if filter.Name != "" {
		whereClause += fmt.Sprintf(" AND name ILIKE $%d", argIndex)
		args = append(args, "%"+filter.Name+"%")
		argIndex++
	}
	if filter.Code != "" {
		whereClause += fmt.Sprintf(" AND code = $%d", argIndex)
		args = append(args, filter.Code)
		argIndex++
	}
	if filter.Type != "" {
		whereClause += fmt.Sprintf(" AND type = $%d", argIndex)
		args = append(args, filter.Type)
		argIndex++
	}
	if filter.Layer != "" {
		whereClause += fmt.Sprintf(" AND layer = $%d", argIndex)
		args = append(args, filter.Layer)
		argIndex++
	}

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM roles %s", whereClause)
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&result.Total)
	if err != nil {
		return nil, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 查询列表
	listQuery := fmt.Sprintf(`
		SELECT r.id, r.name, r.code, r.type, r.layer, r.description, r.is_system, r.created_at, r.updated_at,
		       (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count,
		       (SELECT COUNT(*) FROM user_roles WHERE role_id = r.id) as user_count
		FROM roles r
		%s
		ORDER BY r.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		item := &repository.RoleListItem{}
		var description sql.NullString
		var createdAt, updatedAt time.Time

		err := rows.Scan(
			&item.ID, &item.Name, &item.Code, &item.Type, &item.Layer,
			&description, &item.IsSystem, &createdAt, &updatedAt,
			&item.PermissionCount, &item.UserCount,
		)
		if err != nil {
			return nil, err
		}

		item.Description = description.String
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.UpdatedAt = updatedAt.Format(time.RFC3339)
		result.Items = append(result.Items, item)
	}

	return result, nil
}

// FindDetailByID 查找角色详情
func (r *roleRepository) FindDetailByID(ctx context.Context, tenantID, roleID string) (*repository.RoleDetail, error) {
	role, err := r.FindByID(ctx, tenantID, roleID)
	if err != nil {
		return nil, err
	}
	if role == nil {
		return nil, nil
	}

	userCount, _ := r.GetUserCount(ctx, roleID)

	detail := &repository.RoleDetail{
		RoleListItem: &repository.RoleListItem{
			ID:          role.ID,
			Name:        role.Name,
			Code:        role.Code,
			Type:        role.Type,
			Layer:       role.Layer,
			Description: role.Description,
			IsSystem:    role.IsSystem,
			UserCount:   userCount,
			CreatedAt:   role.CreatedAt.Format(time.RFC3339),
			UpdatedAt:   role.UpdatedAt.Format(time.RFC3339),
		},
		Permissions: []*repository.PermissionItem{},
	}

	// 加载权限
	permissions, err := r.getRolePermissions(ctx, roleID)
	if err != nil {
		return nil, err
	}
	detail.Permissions = permissions
	detail.PermissionCount = len(permissions)

	return detail, nil
}

// getRolePermissions 获取角色的权限列表
func (r *roleRepository) getRolePermissions(ctx context.Context, roleID string) ([]*repository.PermissionItem, error) {
	query := `
		SELECT p.id, p.code, p.name, p.resource, p.action, p.layer, p.description
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

	var items []*repository.PermissionItem
	for rows.Next() {
		item := &repository.PermissionItem{}
		var description sql.NullString

		err := rows.Scan(
			&item.ID, &item.Code, &item.Name, &item.Resource, &item.Action,
			&item.Layer, &description,
		)
		if err != nil {
			return nil, err
		}
		item.Description = description.String
		items = append(items, item)
	}

	return items, nil
}

// Create 创建角色
func (r *roleRepository) Create(ctx context.Context, role *model.Role) error {
	if role.ID == "" {
		role.ID = uuid.New().String()
	}

	now := time.Now()
	role.CreatedAt = now
	role.UpdatedAt = now

	query := `
		INSERT INTO roles (id, tenant_id, name, code, type, layer, description, is_system, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := r.db.ExecContext(ctx, query,
		role.ID, role.TenantID, role.Name, role.Code, role.Type, role.Layer,
		nullString(role.Description), role.IsSystem, role.CreatedAt, role.UpdatedAt,
	)

	return err
}

// Update 更新角色
func (r *roleRepository) Update(ctx context.Context, role *model.Role) error {
	role.UpdatedAt = time.Now()

	query := `
		UPDATE roles SET
			name = $1,
			description = $2,
			updated_at = $3
		WHERE id = $4 AND tenant_id = $5
	`

	result, err := r.db.ExecContext(ctx, query,
		role.Name, nullString(role.Description), role.UpdatedAt,
		role.ID, role.TenantID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("role not found")
	}

	return nil
}

// Delete 删除角色
func (r *roleRepository) Delete(ctx context.Context, tenantID, roleID string) error {
	// 先删除关联的权限
	_, err := r.db.ExecContext(ctx, "DELETE FROM role_permissions WHERE role_id = $1", roleID)
	if err != nil {
		return err
	}

	// 删除关联的用户角色
	_, err = r.db.ExecContext(ctx, "DELETE FROM user_roles WHERE role_id = $1", roleID)
	if err != nil {
		return err
	}

	// 删除角色
	result, err := r.db.ExecContext(ctx, "DELETE FROM roles WHERE id = $1 AND tenant_id = $2", roleID, tenantID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("role not found")
	}

	return nil
}

// ExistsByCode 检查编码是否存在
func (r *roleRepository) ExistsByCode(ctx context.Context, tenantID, code string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM roles WHERE code = $1 AND tenant_id = $2)`
	err := r.db.QueryRowContext(ctx, query, code, tenantID).Scan(&exists)
	return exists, err
}

// GetRolePermissionIDs 获取角色的权限 ID 列表
func (r *roleRepository) GetRolePermissionIDs(ctx context.Context, roleID string) ([]string, error) {
	query := `SELECT permission_id FROM role_permissions WHERE role_id = $1`
	rows, err := r.db.QueryContext(ctx, query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	return ids, nil
}

// BindPermissions 绑定角色权限
func (r *roleRepository) BindPermissions(ctx context.Context, tenantID, roleID string, permissionIDs []string) error {
	// 删除现有关联
	_, err := r.db.ExecContext(ctx, "DELETE FROM role_permissions WHERE role_id = $1", roleID)
	if err != nil {
		return err
	}

	// 插入新关联
	for _, permID := range permissionIDs {
		_, err := r.db.ExecContext(ctx,
			`INSERT INTO role_permissions (tenant_id, role_id, permission_id, created_at) VALUES ($1, $2, $3, $4)`,
			tenantID, roleID, permID, time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetUserCount 获取角色关联的用户数量
func (r *roleRepository) GetUserCount(ctx context.Context, roleID string) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM user_roles WHERE role_id = $1", roleID).Scan(&count)
	return count, err
}

// nullString 辅助函数
func nullString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
