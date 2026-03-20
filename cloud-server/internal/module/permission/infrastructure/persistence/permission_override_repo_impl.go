package persistence

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/permission/domain/repository"

	"github.com/google/uuid"
)

// permissionOverrideRepository 权限覆盖仓储实现
type permissionOverrideRepository struct {
	db *sql.DB
}

// NewPermissionOverrideRepository 创建权限覆盖仓储
func NewPermissionOverrideRepository(db *sql.DB) repository.PermissionOverrideRepository {
	return &permissionOverrideRepository{db: db}
}

// FindByID 根据 ID 查找权限覆盖
func (r *permissionOverrideRepository) FindByID(ctx context.Context, overrideID string) (*model.PermissionOverride, error) {
	query := `
		SELECT id, tenant_id, user_id, resource, permission_id, override_type,
		       data_scope_type, data_scope_rule, field_restrictions,
		       effective_from, effective_until, created_by, created_at, updated_at
		FROM user_permission_overrides
		WHERE id = $1
	`

	override := &model.PermissionOverride{}
	var permissionID, createdBy sql.NullString
	var effectiveUntil sql.NullTime
	var dataScopeRule, fieldRestrictions []byte

	err := r.db.QueryRowContext(ctx, query, overrideID).Scan(
		&override.ID, &override.TenantID, &override.UserID, &override.Resource,
		&permissionID, &override.OverrideType, &override.DataScopeType,
		&dataScopeRule, &fieldRestrictions,
		&override.EffectiveFrom, &effectiveUntil, &createdBy,
		&override.CreatedAt, &override.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	if permissionID.Valid {
		override.PermissionID = &permissionID.String
	}
	if effectiveUntil.Valid {
		override.EffectiveUntil = &effectiveUntil.Time
	}
	if createdBy.Valid {
		override.CreatedBy = &createdBy.String
	}
	if len(dataScopeRule) > 0 {
		override.DataScopeRule = &model.DataScopeRule{}
		if err := json.Unmarshal(dataScopeRule, override.DataScopeRule); err != nil {
			return nil, fmt.Errorf("failed to unmarshal data_scope_rule: %w", err)
		}
	}
	if len(fieldRestrictions) > 0 {
		override.FieldRestrictions = make(model.FieldRestrictionsMap)
		if err := json.Unmarshal(fieldRestrictions, &override.FieldRestrictions); err != nil {
			return nil, fmt.Errorf("failed to unmarshal field_restrictions: %w", err)
		}
	}

	return override, nil
}

// FindByUserID 获取用户的所有权限覆盖
func (r *permissionOverrideRepository) FindByUserID(ctx context.Context, userID string) ([]*model.PermissionOverride, error) {
	query := `
		SELECT id, tenant_id, user_id, resource, permission_id, override_type,
		       data_scope_type, data_scope_rule, field_restrictions,
		       effective_from, effective_until, created_by, created_at, updated_at
		FROM user_permission_overrides
		WHERE user_id = $1
		ORDER BY resource, created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanOverrides(rows)
}

// FindByUserIDAndResource 获取用户指定资源的权限覆盖
func (r *permissionOverrideRepository) FindByUserIDAndResource(ctx context.Context, userID, resource string) ([]*model.PermissionOverride, error) {
	query := `
		SELECT id, tenant_id, user_id, resource, permission_id, override_type,
		       data_scope_type, data_scope_rule, field_restrictions,
		       effective_from, effective_until, created_by, created_at, updated_at
		FROM user_permission_overrides
		WHERE user_id = $1 AND resource = $2
		ORDER BY permission_id NULLS FIRST, created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, resource)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanOverrides(rows)
}

// FindEffectiveByUserID 获取用户当前有效的权限覆盖
func (r *permissionOverrideRepository) FindEffectiveByUserID(ctx context.Context, userID string) ([]*model.PermissionOverride, error) {
	now := time.Now()
	query := `
		SELECT id, tenant_id, user_id, resource, permission_id, override_type,
		       data_scope_type, data_scope_rule, field_restrictions,
		       effective_from, effective_until, created_by, created_at, updated_at
		FROM user_permission_overrides
		WHERE user_id = $1
		  AND effective_from <= $2
		  AND (effective_until IS NULL OR effective_until > $2)
		ORDER BY resource, created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, now)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanOverrides(rows)
}

// FindEffectiveByUserIDAndResource 获取用户指定资源的有效权限覆盖
func (r *permissionOverrideRepository) FindEffectiveByUserIDAndResource(ctx context.Context, userID, resource string) ([]*model.PermissionOverride, error) {
	now := time.Now()
	query := `
		SELECT id, tenant_id, user_id, resource, permission_id, override_type,
		       data_scope_type, data_scope_rule, field_restrictions,
		       effective_from, effective_until, created_by, created_at, updated_at
		FROM user_permission_overrides
		WHERE user_id = $1 AND resource = $2
		  AND effective_from <= $3
		  AND (effective_until IS NULL OR effective_until > $3)
		ORDER BY permission_id NULLS FIRST, created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, resource, now)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanOverrides(rows)
}

// FindWithFilters 分页筛选查询权限覆盖列表
func (r *permissionOverrideRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.PermissionOverrideFilter, page, pageSize int) (*repository.PermissionOverrideListResult, error) {
	result := &repository.PermissionOverrideListResult{
		Page:     page,
		PageSize: pageSize,
	}

	// 构建 WHERE 条件
	whereClause := "WHERE tenant_id = $1"
	args := []interface{}{tenantID}
	argIndex := 2

	if filter.UserID != "" {
		whereClause += fmt.Sprintf(" AND user_id = $%d", argIndex)
		args = append(args, filter.UserID)
		argIndex++
	}
	if filter.Resource != "" {
		whereClause += fmt.Sprintf(" AND resource = $%d", argIndex)
		args = append(args, filter.Resource)
		argIndex++
	}
	if filter.Type != nil {
		whereClause += fmt.Sprintf(" AND override_type = $%d", argIndex)
		args = append(args, *filter.Type)
		argIndex++
	}

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM user_permission_overrides %s", whereClause)
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&result.Total)
	if err != nil {
		return nil, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 查询列表
	listQuery := fmt.Sprintf(`
		SELECT id, tenant_id, user_id, resource, permission_id, override_type,
		       data_scope_type, data_scope_rule, field_restrictions,
		       effective_from, effective_until, created_by, created_at, updated_at
		FROM user_permission_overrides
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	overrides, err := r.scanOverrides(rows)
	if err != nil {
		return nil, err
	}

	// 转换为带详情的结构
	result.Items = make([]*model.PermissionOverrideWithDetails, len(overrides))
	for i, o := range overrides {
		result.Items[i] = &model.PermissionOverrideWithDetails{
			PermissionOverride: *o,
		}
	}

	return result, nil
}

// Create 创建权限覆盖
func (r *permissionOverrideRepository) Create(ctx context.Context, override *model.PermissionOverride) error {
	if override.ID == "" {
		override.ID = uuid.New().String()
	}

	override.CreatedAt = time.Now()
	override.UpdatedAt = time.Now()

	query := `
		INSERT INTO user_permission_overrides (
			id, tenant_id, user_id, resource, permission_id, override_type,
			data_scope_type, data_scope_rule, field_restrictions,
			effective_from, effective_until, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`

	var dataScopeRule, fieldRestrictions []byte
	var err error
	if override.DataScopeRule != nil {
		dataScopeRule, err = json.Marshal(override.DataScopeRule)
		if err != nil {
			return fmt.Errorf("failed to marshal data_scope_rule: %w", err)
		}
	}
	if override.FieldRestrictions != nil {
		fieldRestrictions, err = json.Marshal(override.FieldRestrictions)
		if err != nil {
			return fmt.Errorf("failed to marshal field_restrictions: %w", err)
		}
	}

	_, err = r.db.ExecContext(ctx, query,
		override.ID, override.TenantID, override.UserID, override.Resource,
		override.PermissionID, override.OverrideType, override.DataScopeType,
		dataScopeRule, fieldRestrictions,
		override.EffectiveFrom, override.EffectiveUntil, override.CreatedBy,
		override.CreatedAt, override.UpdatedAt,
	)

	return err
}

// Update 更新权限覆盖
func (r *permissionOverrideRepository) Update(ctx context.Context, override *model.PermissionOverride) error {
	override.UpdatedAt = time.Now()

	query := `
		UPDATE user_permission_overrides SET
			override_type = $1,
			data_scope_type = $2,
			data_scope_rule = $3,
			field_restrictions = $4,
			effective_from = $5,
			effective_until = $6,
			updated_at = $7
		WHERE id = $8
	`

	var dataScopeRule, fieldRestrictions []byte
	var err error
	if override.DataScopeRule != nil {
		dataScopeRule, err = json.Marshal(override.DataScopeRule)
		if err != nil {
			return fmt.Errorf("failed to marshal data_scope_rule: %w", err)
		}
	}
	if override.FieldRestrictions != nil {
		fieldRestrictions, err = json.Marshal(override.FieldRestrictions)
		if err != nil {
			return fmt.Errorf("failed to marshal field_restrictions: %w", err)
		}
	}

	result, err := r.db.ExecContext(ctx, query,
		override.OverrideType, override.DataScopeType,
		dataScopeRule, fieldRestrictions,
		override.EffectiveFrom, override.EffectiveUntil,
		override.UpdatedAt, override.ID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("permission override not found")
	}

	return nil
}

// Delete 删除权限覆盖
func (r *permissionOverrideRepository) Delete(ctx context.Context, overrideID string) error {
	result, err := r.db.ExecContext(ctx, "DELETE FROM user_permission_overrides WHERE id = $1", overrideID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("permission override not found")
	}

	return nil
}

// DeleteByUserID 删除用户的所有权限覆盖
func (r *permissionOverrideRepository) DeleteByUserID(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM user_permission_overrides WHERE user_id = $1", userID)
	return err
}

// BatchCreate 批量创建权限覆盖
func (r *permissionOverrideRepository) BatchCreate(ctx context.Context, overrides []*model.PermissionOverride) error {
	if len(overrides) == 0 {
		return nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, override := range overrides {
		if override.ID == "" {
			override.ID = uuid.New().String()
		}
		override.CreatedAt = time.Now()
		override.UpdatedAt = time.Now()

		query := `
			INSERT INTO user_permission_overrides (
				id, tenant_id, user_id, resource, permission_id, override_type,
				data_scope_type, data_scope_rule, field_restrictions,
				effective_from, effective_until, created_by, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		`

		var dataScopeRule, fieldRestrictions []byte
		if override.DataScopeRule != nil {
			dataScopeRule, _ = json.Marshal(override.DataScopeRule)
		}
		if override.FieldRestrictions != nil {
			fieldRestrictions, _ = json.Marshal(override.FieldRestrictions)
		}

		_, err := tx.ExecContext(ctx, query,
			override.ID, override.TenantID, override.UserID, override.Resource,
			override.PermissionID, override.OverrideType, override.DataScopeType,
			dataScopeRule, fieldRestrictions,
			override.EffectiveFrom, override.EffectiveUntil, override.CreatedBy,
			override.CreatedAt, override.UpdatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// BatchUpdate 批量更新用户权限覆盖（先删后建）
func (r *permissionOverrideRepository) BatchUpdate(ctx context.Context, tenantID, userID string, overrides []*model.PermissionOverride) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 删除用户的所有权限覆盖
	_, err = tx.ExecContext(ctx, "DELETE FROM user_permission_overrides WHERE tenant_id = $1 AND user_id = $2", tenantID, userID)
	if err != nil {
		return err
	}

	// 批量插入新的权限覆盖
	for _, override := range overrides {
		if override.ID == "" {
			override.ID = uuid.New().String()
		}
		override.TenantID = tenantID
		override.UserID = userID
		override.CreatedAt = time.Now()
		override.UpdatedAt = time.Now()

		query := `
			INSERT INTO user_permission_overrides (
				id, tenant_id, user_id, resource, permission_id, override_type,
				data_scope_type, data_scope_rule, field_restrictions,
				effective_from, effective_until, created_by, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		`

		var dataScopeRule, fieldRestrictions []byte
		if override.DataScopeRule != nil {
			dataScopeRule, _ = json.Marshal(override.DataScopeRule)
		}
		if override.FieldRestrictions != nil {
			fieldRestrictions, _ = json.Marshal(override.FieldRestrictions)
		}

		_, err := tx.ExecContext(ctx, query,
			override.ID, override.TenantID, override.UserID, override.Resource,
			override.PermissionID, override.OverrideType, override.DataScopeType,
			dataScopeRule, fieldRestrictions,
			override.EffectiveFrom, override.EffectiveUntil, override.CreatedBy,
			override.CreatedAt, override.UpdatedAt,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// ExistsByUserResource 检查用户对资源的覆盖是否存在
func (r *permissionOverrideRepository) ExistsByUserResource(ctx context.Context, userID, resource string, permissionID *string) (bool, error) {
	var exists bool
	var query string
	var args []interface{}

	if permissionID != nil {
		query = `SELECT EXISTS(SELECT 1 FROM user_permission_overrides WHERE user_id = $1 AND resource = $2 AND permission_id = $3)`
		args = []interface{}{userID, resource, *permissionID}
	} else {
		query = `SELECT EXISTS(SELECT 1 FROM user_permission_overrides WHERE user_id = $1 AND resource = $2 AND permission_id IS NULL)`
		args = []interface{}{userID, resource}
	}

	err := r.db.QueryRowContext(ctx, query, args...).Scan(&exists)
	return exists, err
}

// scanOverrides 扫描权限覆盖列表
func (r *permissionOverrideRepository) scanOverrides(rows *sql.Rows) ([]*model.PermissionOverride, error) {
	var overrides []*model.PermissionOverride

	for rows.Next() {
		override := &model.PermissionOverride{}
		var permissionID, createdBy sql.NullString
		var effectiveUntil sql.NullTime
		var dataScopeRule, fieldRestrictions []byte

		err := rows.Scan(
			&override.ID, &override.TenantID, &override.UserID, &override.Resource,
			&permissionID, &override.OverrideType, &override.DataScopeType,
			&dataScopeRule, &fieldRestrictions,
			&override.EffectiveFrom, &effectiveUntil, &createdBy,
			&override.CreatedAt, &override.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if permissionID.Valid {
			override.PermissionID = &permissionID.String
		}
		if effectiveUntil.Valid {
			override.EffectiveUntil = &effectiveUntil.Time
		}
		if createdBy.Valid {
			override.CreatedBy = &createdBy.String
		}
		if len(dataScopeRule) > 0 {
			override.DataScopeRule = &model.DataScopeRule{}
			if err := json.Unmarshal(dataScopeRule, override.DataScopeRule); err != nil {
				return nil, fmt.Errorf("failed to unmarshal data_scope_rule: %w", err)
			}
		}
		if len(fieldRestrictions) > 0 {
			override.FieldRestrictions = make(model.FieldRestrictionsMap)
			if err := json.Unmarshal(fieldRestrictions, &override.FieldRestrictions); err != nil {
				return nil, fmt.Errorf("failed to unmarshal field_restrictions: %w", err)
			}
		}

		overrides = append(overrides, override)
	}

	return overrides, nil
}
