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

// userRepository 用户仓储实现
type userRepository struct {
	db *sql.DB
}

// NewUserRepository 创建用户仓储
func NewUserRepository(db *sql.DB) repository.UserRepository {
	return &userRepository{db: db}
}

// FindByID 根据 ID 查找用户
func (r *userRepository) FindByID(ctx context.Context, tenantID, userID string) (*model.User, error) {
	user := &model.User{}
	var lastLoginAt, lockedUntil sql.NullTime
	var avatarURL, employeeID, phone, managerID sql.NullString
	var deletedAt sql.NullTime

	query := `
		SELECT id, tenant_id, email, password_hash, name, avatar_url, employee_id, phone,
		       manager_id, status, email_verified, last_login_at, failed_login_count, locked_until,
		       preferences, created_at, updated_at, deleted_at
		FROM users
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, userID, tenantID).Scan(
		&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.Name,
		&avatarURL, &employeeID, &phone, &managerID, &user.Status, &user.EmailVerified,
		&lastLoginAt, &user.FailedLoginCount, &lockedUntil,
		&user.Preferences, &user.CreatedAt, &user.UpdatedAt, &deletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	user.AvatarURL = avatarURL.String
	user.EmployeeID = employeeID.String
	user.Phone = phone.String
	if managerID.Valid {
		user.ManagerID = &managerID.String
	}
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	if lockedUntil.Valid {
		user.LockedUntil = &lockedUntil.Time
	}

	return user, nil
}

// FindByEmail 根据邮箱查找用户
func (r *userRepository) FindByEmail(ctx context.Context, tenantID, email string) (*model.User, error) {
	user := &model.User{}
	var lastLoginAt, lockedUntil sql.NullTime
	var avatarURL, employeeID, phone sql.NullString
	var deletedAt sql.NullTime

	query := `
		SELECT id, tenant_id, email, password_hash, name, avatar_url, employee_id, phone,
		       status, email_verified, last_login_at, failed_login_count, locked_until,
		       preferences, created_at, updated_at, deleted_at
		FROM users
		WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, email, tenantID).Scan(
		&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.Name,
		&avatarURL, &employeeID, &phone, &user.Status, &user.EmailVerified,
		&lastLoginAt, &user.FailedLoginCount, &lockedUntil,
		&user.Preferences, &user.CreatedAt, &user.UpdatedAt, &deletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	user.AvatarURL = avatarURL.String
	user.EmployeeID = employeeID.String
	user.Phone = phone.String
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	if lockedUntil.Valid {
		user.LockedUntil = &lockedUntil.Time
	}

	return user, nil
}

// FindByEmployeeCode 根据工号查找用户
func (r *userRepository) FindByEmployeeCode(ctx context.Context, tenantID, employeeCode string) (*model.User, error) {
	user := &model.User{}
	var lastLoginAt, lockedUntil sql.NullTime
	var avatarURL, employeeID, phone sql.NullString
	var deletedAt sql.NullTime

	query := `
		SELECT id, tenant_id, email, password_hash, name, avatar_url, employee_id, phone,
		       status, email_verified, last_login_at, failed_login_count, locked_until,
		       preferences, created_at, updated_at, deleted_at
		FROM users
		WHERE employee_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, employeeCode, tenantID).Scan(
		&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.Name,
		&avatarURL, &employeeID, &phone, &user.Status, &user.EmailVerified,
		&lastLoginAt, &user.FailedLoginCount, &lockedUntil,
		&user.Preferences, &user.CreatedAt, &user.UpdatedAt, &deletedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	user.AvatarURL = avatarURL.String
	user.EmployeeID = employeeID.String
	user.Phone = phone.String
	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}
	if lockedUntil.Valid {
		user.LockedUntil = &lockedUntil.Time
	}

	return user, nil
}

// FindByUsername 根据用户名查找用户（使用 email 作为用户名）
func (r *userRepository) FindByUsername(ctx context.Context, tenantID, username string) (*model.User, error) {
	return r.FindByEmail(ctx, tenantID, username)
}

// FindWithFilters 分页筛选查询用户列表
func (r *userRepository) FindWithFilters(ctx context.Context, tenantID string, filter *repository.UserFilter, page, pageSize int) (*repository.UserListResult, error) {
	result := &repository.UserListResult{
		Page:     page,
		PageSize: pageSize,
	}

	// 构建 WHERE 条件
	whereClause := "WHERE u.tenant_id = $1 AND u.deleted_at IS NULL"
	args := []interface{}{tenantID}
	argIndex := 2

	if filter.Name != "" {
		whereClause += fmt.Sprintf(" AND u.name ILIKE $%d", argIndex)
		args = append(args, "%"+filter.Name+"%")
		argIndex++
	}
	if filter.EmployeeCode != "" {
		whereClause += fmt.Sprintf(" AND u.employee_id = $%d", argIndex)
		args = append(args, filter.EmployeeCode)
		argIndex++
	}
	if filter.DepartmentID != "" {
		whereClause += fmt.Sprintf(" AND EXISTS (SELECT 1 FROM user_departments ud WHERE ud.user_id = u.id AND ud.department_id = $%d)", argIndex)
		args = append(args, filter.DepartmentID)
		argIndex++
	}
	if filter.Status != "" {
		whereClause += fmt.Sprintf(" AND u.status = $%d", argIndex)
		args = append(args, filter.Status)
		argIndex++
	}

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users u %s", whereClause)
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&result.Total)
	if err != nil {
		return nil, err
	}

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 查询列表
	listQuery := fmt.Sprintf(`
		SELECT u.id, u.email, u.name, u.employee_id, u.phone, u.status, u.created_at
		FROM users u
		%s
		ORDER BY u.created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIndex, argIndex+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.QueryContext(ctx, listQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	userIDs := []string{}
	userMap := make(map[string]*repository.UserListItem)

	for rows.Next() {
		item := &repository.UserListItem{}
		var employeeID, phone sql.NullString
		var createdAt time.Time

		err := rows.Scan(&item.ID, &item.Username, &item.RealName, &employeeID, &phone, &item.Status, &createdAt)
		if err != nil {
			return nil, err
		}

		item.EmployeeCode = employeeID.String
		item.Phone = phone.String
		item.Email = item.Username
		item.CreatedAt = createdAt.Format(time.RFC3339)
		item.Departments = []repository.DepartmentRef{}
		item.Roles = []repository.RoleRef{}

		userIDs = append(userIDs, item.ID)
		userMap[item.ID] = item
	}

	// 查询部门和角色
	if len(userIDs) > 0 {
		if err := r.loadDepartments(ctx, userIDs, userMap); err != nil {
			return nil, err
		}
		if err := r.loadRoles(ctx, userIDs, userMap); err != nil {
			return nil, err
		}
	}

	// 构建结果列表
	for _, id := range userIDs {
		result.Items = append(result.Items, userMap[id])
	}

	return result, nil
}

// loadDepartments 加载用户部门信息
func (r *userRepository) loadDepartments(ctx context.Context, userIDs []string, userMap map[string]*repository.UserListItem) error {
	query := `
		SELECT ud.user_id, d.id, d.name, COALESCE(ud.is_primary, false)
		FROM user_departments ud
		JOIN departments d ON d.id = ud.department_id
		WHERE ud.user_id = ANY($1)
	`

	rows, err := r.db.QueryContext(ctx, query, userIDs)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID, deptID, deptName string
		var isPrimary bool

		err := rows.Scan(&userID, &deptID, &deptName, &isPrimary)
		if err != nil {
			return err
		}

		if user, ok := userMap[userID]; ok {
			user.Departments = append(user.Departments, repository.DepartmentRef{
				ID:        deptID,
				Name:      deptName,
				IsPrimary: isPrimary,
			})
		}
	}

	return nil
}

// loadRoles 加载用户角色信息
func (r *userRepository) loadRoles(ctx context.Context, userIDs []string, userMap map[string]*repository.UserListItem) error {
	query := `
		SELECT ur.user_id, r.id, r.name, r.code
		FROM user_roles ur
		JOIN roles r ON r.id = ur.role_id
		WHERE ur.user_id = ANY($1)
	`

	rows, err := r.db.QueryContext(ctx, query, userIDs)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var userID, roleID, roleName, roleCode string

		err := rows.Scan(&userID, &roleID, &roleName, &roleCode)
		if err != nil {
			return err
		}

		if user, ok := userMap[userID]; ok {
			user.Roles = append(user.Roles, repository.RoleRef{
				ID:   roleID,
				Name: roleName,
				Code: roleCode,
			})
		}
	}

	return nil
}

// FindDetailByID 查找用户详情
func (r *userRepository) FindDetailByID(ctx context.Context, tenantID, userID string) (*repository.UserDetail, error) {
	user, err := r.FindByID(ctx, tenantID, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}

	detail := &repository.UserDetail{
		UserListItem: &repository.UserListItem{
			ID:           user.ID,
			Username:     user.Email,
			RealName:     user.Name,
			EmployeeCode: user.EmployeeID,
			Email:        user.Email,
			Phone:        user.Phone,
			Status:       user.Status,
			CreatedAt:    user.CreatedAt.Format(time.RFC3339),
			Departments:  []repository.DepartmentRef{},
			Roles:        []repository.RoleRef{},
		},
		UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
	}

	if user.LastLoginAt != nil {
		detail.LastLoginAt = user.LastLoginAt.Format(time.RFC3339)
	}

	// 加载部门
	deptQuery := `
		SELECT d.id, d.name, COALESCE(ud.is_primary, false)
		FROM user_departments ud
		JOIN departments d ON d.id = ud.department_id
		WHERE ud.user_id = $1
	`
	deptRows, err := r.db.QueryContext(ctx, deptQuery, userID)
	if err != nil {
		return nil, err
	}
	defer deptRows.Close()

	for deptRows.Next() {
		var deptID, deptName string
		var isPrimary bool
		if err := deptRows.Scan(&deptID, &deptName, &isPrimary); err != nil {
			return nil, err
		}
		detail.Departments = append(detail.Departments, repository.DepartmentRef{
			ID:        deptID,
			Name:      deptName,
			IsPrimary: isPrimary,
		})
	}

	// 加载角色
	roleQuery := `
		SELECT r.id, r.name, r.code
		FROM user_roles ur
		JOIN roles r ON r.id = ur.role_id
		WHERE ur.user_id = $1
	`
	roleRows, err := r.db.QueryContext(ctx, roleQuery, userID)
	if err != nil {
		return nil, err
	}
	defer roleRows.Close()

	for roleRows.Next() {
		var roleID, roleName, roleCode string
		if err := roleRows.Scan(&roleID, &roleName, &roleCode); err != nil {
			return nil, err
		}
		detail.Roles = append(detail.Roles, repository.RoleRef{
			ID:   roleID,
			Name: roleName,
			Code: roleCode,
		})
	}

	return detail, nil
}

// Create 创建用户
func (r *userRepository) Create(ctx context.Context, user *model.User) error {
	if user.ID == "" {
		user.ID = uuid.New().String()
	}

	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	query := `
		INSERT INTO users (id, tenant_id, email, password_hash, name, avatar_url, employee_id, phone,
		                   status, email_verified, preferences, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err := r.db.ExecContext(ctx, query,
		user.ID, user.TenantID, user.Email, user.PasswordHash, user.Name,
		nullString(user.AvatarURL), nullString(user.EmployeeID), nullString(user.Phone),
		user.Status, user.EmailVerified, user.Preferences, user.CreatedAt, user.UpdatedAt,
	)

	return err
}

// Update 更新用户
func (r *userRepository) Update(ctx context.Context, user *model.User) error {
	user.UpdatedAt = time.Now()

	query := `
		UPDATE users SET
			email = $1,
			name = $2,
			avatar_url = $3,
			employee_id = $4,
			phone = $5,
			status = $6,
			email_verified = $7,
			preferences = $8,
			updated_at = $9
		WHERE id = $10 AND tenant_id = $11 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query,
		user.Email, user.Name,
		nullString(user.AvatarURL), nullString(user.EmployeeID), nullString(user.Phone),
		user.Status, user.EmailVerified, user.Preferences, user.UpdatedAt,
		user.ID, user.TenantID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user not found")
	}

	return nil
}

// UpdateStatus 更新用户状态
func (r *userRepository) UpdateStatus(ctx context.Context, tenantID, userID, status string) error {
	query := `
		UPDATE users SET status = $1, updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, status, time.Now(), userID, tenantID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user not found")
	}

	return nil
}

// ExistsByUsername 检查用户名是否存在
func (r *userRepository) ExistsByUsername(ctx context.Context, tenantID, username string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL)`
	err := r.db.QueryRowContext(ctx, query, username, tenantID).Scan(&exists)
	return exists, err
}

// ExistsByEmployeeCode 检查工号是否存在
func (r *userRepository) ExistsByEmployeeCode(ctx context.Context, tenantID, employeeCode string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE employee_id = $1 AND tenant_id = $2 AND deleted_at IS NULL)`
	err := r.db.QueryRowContext(ctx, query, employeeCode, tenantID).Scan(&exists)
	return exists, err
}

// BindDepartments 绑定用户部门
func (r *userRepository) BindDepartments(ctx context.Context, userID string, departmentIDs []string, primaryDepartmentID string) error {
	// 删除现有关联
	_, err := r.db.ExecContext(ctx, `DELETE FROM user_departments WHERE user_id = $1`, userID)
	if err != nil {
		return err
	}

	// 插入新关联
	for _, deptID := range departmentIDs {
		isPrimary := deptID == primaryDepartmentID
		_, err := r.db.ExecContext(ctx,
			`INSERT INTO user_departments (user_id, department_id, is_primary, created_at) VALUES ($1, $2, $3, $4)`,
			userID, deptID, isPrimary, time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// BindRoles 绑定用户角色
func (r *userRepository) BindRoles(ctx context.Context, userID string, roleIDs []string) error {
	// 删除现有关联
	_, err := r.db.ExecContext(ctx, `DELETE FROM user_roles WHERE user_id = $1`, userID)
	if err != nil {
		return err
	}

	// 插入新关联
	for _, roleID := range roleIDs {
		_, err := r.db.ExecContext(ctx,
			`INSERT INTO user_roles (user_id, role_id, created_at) VALUES ($1, $2, $3)`,
			userID, roleID, time.Now(),
		)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetUserDepartmentIDs 获取用户部门 ID 列表
func (r *userRepository) GetUserDepartmentIDs(ctx context.Context, userID string) ([]string, error) {
	query := `SELECT department_id FROM user_departments WHERE user_id = $1`
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

// GetUserRoleIDs 获取用户角色 ID 列表
func (r *userRepository) GetUserRoleIDs(ctx context.Context, userID string) ([]string, error) {
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

// nullString 辅助函数
func nullString(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}

// UpdateManagerID 更新用户上级
func (r *userRepository) UpdateManagerID(ctx context.Context, tenantID, userID string, managerID *string) error {
	query := `
		UPDATE users SET manager_id = $1, updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`

	var managerParam interface{}
	if managerID != nil {
		managerParam = *managerID
	}

	result, err := r.db.ExecContext(ctx, query, managerParam, time.Now(), userID, tenantID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user not found")
	}

	return nil
}

// GetManagerChain 获取用户上级链
func (r *userRepository) GetManagerChain(ctx context.Context, tenantID, userID string, maxDepth int) ([]*repository.ManagerChainItem, error) {
	var chain []*repository.ManagerChainItem

	currentUserID := userID
	visited := make(map[string]bool)

	for level := 1; level <= maxDepth; level++ {
		// 查询当前用户的上级
		query := `
			SELECT u.id, u.name, u.employee_id, u.manager_id
			FROM users u
			WHERE u.id = (
				SELECT manager_id FROM users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
			) AND u.tenant_id = $2 AND u.deleted_at IS NULL
		`

		var managerID sql.NullString
		var id, name, employeeCode string

		err := r.db.QueryRowContext(ctx, query, currentUserID, tenantID).Scan(&id, &name, &employeeCode, &managerID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				break // 没有上级了
			}
			return nil, err
		}

		// 检测循环
		if visited[id] {
			break // 检测到循环，停止
		}
		visited[id] = true

		// 获取上级部门信息
		dept, err := r.getUserPrimaryDepartment(ctx, id, tenantID)
		if err != nil {
			return nil, err
		}

		chain = append(chain, &repository.ManagerChainItem{
			Level: level,
			User: &repository.UserSummary{
				ID:           id,
				RealName:     name,
				EmployeeCode: employeeCode,
				Department:   dept,
			},
		})

		if !managerID.Valid {
			break // 这是最顶级
		}

		currentUserID = id
	}

	return chain, nil
}

// GetSubordinates 获取用户直接下属列表
func (r *userRepository) GetSubordinates(ctx context.Context, tenantID, managerID string) ([]*repository.SubordinateItem, error) {
	query := `
		SELECT u.id, u.name, u.employee_id, u.status
		FROM users u
		WHERE u.manager_id = $1 AND u.tenant_id = $2 AND u.deleted_at IS NULL
		ORDER BY u.name
	`

	rows, err := r.db.QueryContext(ctx, query, managerID, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subordinates []*repository.SubordinateItem

	for rows.Next() {
		var id, name, employeeCode, status string
		if err := rows.Scan(&id, &name, &employeeCode, &status); err != nil {
			return nil, err
		}

		dept, err := r.getUserPrimaryDepartment(ctx, id, tenantID)
		if err != nil {
			return nil, err
		}

		subordinates = append(subordinates, &repository.SubordinateItem{
			ID:           id,
			RealName:     name,
			EmployeeCode: employeeCode,
			Department:   dept,
			Status:       status,
		})
	}

	return subordinates, nil
}

// FindUserSummaries 根据用户 ID 列表获取用户简要信息
func (r *userRepository) FindUserSummaries(ctx context.Context, tenantID string, userIDs []string) ([]*repository.UserSummary, error) {
	if len(userIDs) == 0 {
		return nil, nil
	}

	query := `
		SELECT id, name, employee_id
		FROM users
		WHERE id = ANY($1) AND tenant_id = $2 AND deleted_at IS NULL
	`

	rows, err := r.db.QueryContext(ctx, query, userIDs, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []*repository.UserSummary

	for rows.Next() {
		var id, name string
		var employeeCode sql.NullString

		if err := rows.Scan(&id, &name, &employeeCode); err != nil {
			return nil, err
		}

		dept, err := r.getUserPrimaryDepartment(ctx, id, tenantID)
		if err != nil {
			return nil, err
		}

		summaries = append(summaries, &repository.UserSummary{
			ID:           id,
			RealName:     name,
			EmployeeCode: employeeCode.String,
			Department:   dept,
		})
	}

	return summaries, nil
}

// SearchUsersForManager 搜索可选上级的用户
func (r *userRepository) SearchUsersForManager(ctx context.Context, tenantID string, query string, excludeIDs []string, limit int) ([]*repository.UserSummary, error) {
	sqlQuery := `
		SELECT id, name, employee_id
		FROM users
		WHERE tenant_id = $1 AND deleted_at IS NULL AND status = 'active'
	`
	args := []interface{}{tenantID}
	argIndex := 2

	if query != "" {
		sqlQuery += fmt.Sprintf(" AND (name ILIKE $%d OR employee_id ILIKE $%d)", argIndex, argIndex)
		args = append(args, "%"+query+"%")
		argIndex++
	}

	if len(excludeIDs) > 0 {
		sqlQuery += fmt.Sprintf(" AND id != ALL($%d)", argIndex)
		args = append(args, excludeIDs)
		argIndex++
	}

	sqlQuery += fmt.Sprintf(" ORDER BY name LIMIT $%d", argIndex)
	args = append(args, limit)

	rows, err := r.db.QueryContext(ctx, sqlQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []*repository.UserSummary

	for rows.Next() {
		var id, name string
		var employeeCode sql.NullString

		if err := rows.Scan(&id, &name, &employeeCode); err != nil {
			return nil, err
		}

		dept, err := r.getUserPrimaryDepartment(ctx, id, tenantID)
		if err != nil {
			return nil, err
		}

		summaries = append(summaries, &repository.UserSummary{
			ID:           id,
			RealName:     name,
			EmployeeCode: employeeCode.String,
			Department:   dept,
		})
	}

	return summaries, nil
}

// getUserPrimaryDepartment 获取用户主部门
func (r *userRepository) getUserPrimaryDepartment(ctx context.Context, userID, tenantID string) (*repository.DeptSummary, error) {
	query := `
		SELECT d.id, d.name
		FROM user_departments ud
		JOIN departments d ON d.id = ud.department_id
		WHERE ud.user_id = $1 AND ud.is_primary = true
		LIMIT 1
	`

	var id, name string
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&id, &name)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // 没有主部门
		}
		return nil, err
	}

	return &repository.DeptSummary{
		ID:   id,
		Name: name,
	}, nil
}
