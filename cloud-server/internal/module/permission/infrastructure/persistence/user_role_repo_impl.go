package persistence

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"cloud-server/internal/module/permission/domain/repository"

	"github.com/google/uuid"
)

// userRoleRepository 用户角色仓储实现
type userRoleRepository struct {
	db *sql.DB
}

// NewUserRoleRepository 创建用户角色仓储
func NewUserRoleRepository(db *sql.DB) repository.UserRoleRepository {
	return &userRoleRepository{db: db}
}

// FindByUserID 获取用户的所有角色
func (r *userRoleRepository) FindByUserID(ctx context.Context, userID string) ([]*repository.UserRoleItem, error) {
	query := `
		SELECT ur.id, ur.role_id, r.name, r.code, r.layer,
		       ur.department_id, d.name,
		       ur.assigned_by, u.name,
		       ur.assigned_at
		FROM user_roles ur
		JOIN roles r ON r.id = ur.role_id
		LEFT JOIN departments d ON d.id = ur.department_id
		LEFT JOIN users u ON u.id = ur.assigned_by
		WHERE ur.user_id = $1
		ORDER BY r.layer, r.name
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*repository.UserRoleItem
	for rows.Next() {
		item := &repository.UserRoleItem{
			Role:       &repository.RoleRef{},
			Department: &repository.DepartmentRef{},
			AssignedBy: &repository.UserRef{},
		}
		var deptID, deptName, assignedByID, assignedByName sql.NullString
		var assignedAt sql.NullTime

		err := rows.Scan(
			&item.ID,
			&item.Role.ID, &item.Role.Name, &item.Role.Code, &item.Role.Layer,
			&deptID, &deptName,
			&assignedByID, &assignedByName,
			&assignedAt,
		)
		if err != nil {
			return nil, err
		}

		if deptID.Valid {
			item.Department.ID = deptID.String
			item.Department.Name = deptName.String
		} else {
			item.Department = nil
		}

		if assignedByID.Valid {
			item.AssignedBy.ID = assignedByID.String
			item.AssignedBy.Name = assignedByName.String
		} else {
			item.AssignedBy = nil
		}

		if assignedAt.Valid {
			item.AssignedAt = assignedAt.Time.Format(time.RFC3339)
		}

		items = append(items, item)
	}

	return items, nil
}

// FindByRoleID 获取角色的所有用户 ID
func (r *userRoleRepository) FindByRoleID(ctx context.Context, roleID string) ([]string, error) {
	query := `SELECT user_id FROM user_roles WHERE role_id = $1`
	rows, err := r.db.QueryContext(ctx, query, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		userIDs = append(userIDs, id)
	}

	return userIDs, nil
}

// AssignRole 为用户分配角色
func (r *userRoleRepository) AssignRole(ctx context.Context, tenantID, userID, roleID string, departmentID *string, assignedBy string) error {
	// 检查是否已存在
	var exists bool
	err := r.db.QueryRowContext(ctx,
		"SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2)",
		userID, roleID,
	).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return nil // 已存在，不重复插入
	}

	query := `
		INSERT INTO user_roles (id, tenant_id, user_id, role_id, department_id, assigned_by, assigned_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	var deptID interface{}
	if departmentID != nil {
		deptID = *departmentID
	}

	now := time.Now()
	_, err = r.db.ExecContext(ctx, query,
		uuid.New().String(), tenantID, userID, roleID, deptID, assignedBy, now, now,
	)

	return err
}

// RemoveRole 移除用户角色
func (r *userRoleRepository) RemoveRole(ctx context.Context, userID, roleID string) error {
	result, err := r.db.ExecContext(ctx,
		"DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2",
		userID, roleID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user role not found")
	}

	return nil
}

// UpdateUserRoles 更新用户的所有角色
func (r *userRoleRepository) UpdateUserRoles(ctx context.Context, tenantID, userID string, roles []repository.UserRoleAssignment, assignedBy string) error {
	// 获取租户 ID
	var userTenantID string
	err := r.db.QueryRowContext(ctx, "SELECT tenant_id FROM users WHERE id = $1", userID).Scan(&userTenantID)
	if err != nil {
		return err
	}

	// 删除现有关联
	_, err = r.db.ExecContext(ctx, "DELETE FROM user_roles WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// 插入新关联
	for _, role := range roles {
		err := r.AssignRole(ctx, userTenantID, userID, role.RoleID, role.DepartmentID, assignedBy)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetUserRoleIDs 获取用户的角色 ID 列表
func (r *userRoleRepository) GetUserRoleIDs(ctx context.Context, userID string) ([]string, error) {
	query := `SELECT role_id FROM user_roles WHERE user_id = $1`
	rows, err := r.db.QueryContext(ctx, query, userID)
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

// Exists 检查用户角色是否存在
func (r *userRoleRepository) Exists(ctx context.Context, userID, roleID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2)`
	err := r.db.QueryRowContext(ctx, query, userID, roleID).Scan(&exists)
	return exists, err
}
