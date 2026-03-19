package persistence

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"cloud-server/internal/model"
	"cloud-server/internal/module/auth/domain/repository"

	"github.com/google/uuid"
)

// UserRepositoryImpl 用户仓储实现
type UserRepositoryImpl struct {
	db *sql.DB
}

// NewUserRepository 创建用户仓储
func NewUserRepository(db *sql.DB) repository.UserRepository {
	return &UserRepositoryImpl{db: db}
}

// FindByEmail 根据邮箱查找用户
func (r *UserRepositoryImpl) FindByEmail(ctx context.Context, tenantID, email string) (*model.User, error) {
	user := &model.User{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, tenant_id, email, password_hash, name, avatar_url, employee_id, phone, status, 
		       email_verified, last_login_at, preferences, created_at, updated_at
		FROM users
		WHERE tenant_id = $1 AND email = $2 AND deleted_at IS NULL
		LIMIT 1
	`, tenantID, email).Scan(
		&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.EmployeeID, &user.Phone, &user.Status,
		&user.EmailVerified, &user.LastLoginAt, &user.Preferences,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// FindByID 根据 ID 查找用户
func (r *UserRepositoryImpl) FindByID(ctx context.Context, tenantID, userID string) (*model.User, error) {
	user := &model.User{}
	err := r.db.QueryRowContext(ctx, `
		SELECT id, tenant_id, email, password_hash, name, avatar_url, employee_id, phone, status, 
		       email_verified, last_login_at, preferences, created_at, updated_at
		FROM users
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
		LIMIT 1
	`, userID, tenantID).Scan(
		&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.EmployeeID, &user.Phone, &user.Status,
		&user.EmailVerified, &user.LastLoginAt, &user.Preferences,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// Create 创建用户
func (r *UserRepositoryImpl) Create(ctx context.Context, user *model.User) error {
	if user.ID == "" {
		user.ID = uuid.New().String()
	}
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	_, err := r.db.ExecContext(ctx, `
		INSERT INTO users (id, tenant_id, email, password_hash, name, avatar_url, employee_id, 
		                   phone, status, email_verified, preferences, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`, user.ID, user.TenantID, user.Email, user.PasswordHash, user.Name,
		user.AvatarURL, user.EmployeeID, user.Phone, user.Status,
		user.EmailVerified, user.Preferences, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

// Update 更新用户
func (r *UserRepositoryImpl) Update(ctx context.Context, user *model.User) error {
	user.UpdatedAt = time.Now()
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET
			email = $2, name = $3, avatar_url = $4, employee_id = $5,
			phone = $6, status = $7, email_verified = $8, preferences = $9, updated_at = $10
		WHERE id = $1
	`, user.ID, user.Email, user.Name, user.AvatarURL, user.EmployeeID,
		user.Phone, user.Status, user.EmailVerified, user.Preferences, user.UpdatedAt,
	)
	return err
}

// UpdateLoginInfo 更新登录信息
func (r *UserRepositoryImpl) UpdateLoginInfo(ctx context.Context, userID string, failedCount int, lockedUntil *string) error {
	var lockedUntilSQL interface{}
	if lockedUntil != nil {
		lockedUntilSQL = *lockedUntil
	}

	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET
			last_login_at = NOW(),
			failed_login_count = $2,
			locked_until = $3,
			updated_at = NOW()
		WHERE id = $1
	`, userID, failedCount, lockedUntilSQL)
	return err
}

// GetUserWithRole 获取用户及其角色
func (r *UserRepositoryImpl) GetUserWithRole(ctx context.Context, tenantID, email string) (*repository.UserWithRole, error) {
	var (
		user         model.User
		roleCode     sql.NullString
		roleName     sql.NullString
		departmentID sql.NullString
	)

	err := r.db.QueryRowContext(ctx, `
		SELECT u.id, u.tenant_id, u.email, u.password_hash, u.name, u.avatar_url, u.employee_id, 
		       u.phone, u.status, u.email_verified, u.last_login_at, u.preferences, u.created_at, u.updated_at,
		       COALESCE(r.code, '') AS role_code,
		       COALESCE(r.name, '') AS role_name,
		       COALESCE(u.preferences->>'department_id', '') AS department_id
		FROM users u
		LEFT JOIN user_roles ur ON ur.user_id = u.id
		LEFT JOIN roles r ON r.id = ur.role_id AND r.tenant_id = u.tenant_id
		WHERE u.tenant_id = $1 AND u.email = $2 AND u.deleted_at IS NULL
		LIMIT 1
	`, tenantID, email).Scan(
		&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.Name,
		&user.AvatarURL, &user.EmployeeID, &user.Phone, &user.Status,
		&user.EmailVerified, &user.LastLoginAt, &user.Preferences,
		&user.CreatedAt, &user.UpdatedAt,
		&roleCode, &roleName, &departmentID,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return &repository.UserWithRole{
		User:         &user,
		RoleCode:     roleCode.String,
		RoleName:     roleName.String,
		DepartmentID: departmentID.String,
	}, nil
}
