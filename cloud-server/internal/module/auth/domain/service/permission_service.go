package service

import (
	"context"
	"database/sql"
	"fmt"

	"cloud-server/internal/module/auth/application/dto"
)

// PermissionService handles permission-related operations
type PermissionService struct {
	db *sql.DB
}

// NewPermissionService creates a new permission service
func NewPermissionService(db *sql.DB) *PermissionService {
	return &PermissionService{db: db}
}

// GetUserPermissions retrieves all permissions for a user through their role
func (s *PermissionService) GetUserPermissions(ctx context.Context, userID string) ([]dto.PermissionInfo, error) {
	query := `
		SELECT DISTINCT p.code, p.name, p.resource, p.action
		FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		INNER JOIN user_roles ur ON ur.role_id = rp.role_id
		WHERE ur.user_id = $1
		ORDER BY p.resource, p.action
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user permissions: %w", err)
	}
	defer rows.Close()

	var permissions []dto.PermissionInfo
	for rows.Next() {
		var perm dto.PermissionInfo
		err := rows.Scan(&perm.Code, &perm.Name, &perm.Resource, &perm.Action)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission: %w", err)
		}
		permissions = append(permissions, perm)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating permission rows: %w", err)
	}

	// Return empty slice instead of nil if no permissions
	if permissions == nil {
		permissions = []dto.PermissionInfo{}
	}

	return permissions, nil
}

// GetUserPermissionCodes retrieves permission codes only (for JWT token)
func (s *PermissionService) GetUserPermissionCodes(ctx context.Context, userID string) ([]string, error) {
	query := `
		SELECT DISTINCT p.code
		FROM permissions p
		INNER JOIN role_permissions rp ON rp.permission_id = p.id
		INNER JOIN user_roles ur ON ur.role_id = rp.role_id
		WHERE ur.user_id = $1
		ORDER BY p.code
	`

	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query user permission codes: %w", err)
	}
	defer rows.Close()

	var codes []string
	for rows.Next() {
		var code string
		err := rows.Scan(&code)
		if err != nil {
			return nil, fmt.Errorf("failed to scan permission code: %w", err)
		}
		codes = append(codes, code)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating permission code rows: %w", err)
	}

	// Return empty slice instead of nil if no permissions
	if codes == nil {
		codes = []string{}
	}

	return codes, nil
}

// GetUserRole retrieves the user's primary role
func (s *PermissionService) GetUserRole(ctx context.Context, userID string) (*dto.RoleInfo, error) {
	query := `
		SELECT r.code, r.name, r.is_system
		FROM roles r
		INNER JOIN user_roles ur ON ur.role_id = r.id
		WHERE ur.user_id = $1
		LIMIT 1
	`

	var role dto.RoleInfo
	var isSystem bool
	err := s.db.QueryRowContext(ctx, query, userID).Scan(&role.Code, &role.Name, &isSystem)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No role assigned
		}
		return nil, fmt.Errorf("failed to query user role: %w", err)
	}

	role.IsSystem = isSystem
	return &role, nil
}

// HasPermission checks if a user has a specific permission
func (s *PermissionService) HasPermission(ctx context.Context, userID, permissionCode string) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM permissions p
			INNER JOIN role_permissions rp ON rp.permission_id = p.id
			INNER JOIN user_roles ur ON ur.role_id = rp.role_id
			WHERE ur.user_id = $1 AND p.code = $2
		)
	`

	var hasPermission bool
	err := s.db.QueryRowContext(ctx, query, userID, permissionCode).Scan(&hasPermission)
	if err != nil {
		return false, fmt.Errorf("failed to check permission: %w", err)
	}

	return hasPermission, nil
}

// HasAnyPermission checks if a user has any of the specified permissions
func (s *PermissionService) HasAnyPermission(ctx context.Context, userID string, permissionCodes []string) (bool, error) {
	if len(permissionCodes) == 0 {
		return false, nil
	}

	query := `
		SELECT EXISTS (
			SELECT 1
			FROM permissions p
			INNER JOIN role_permissions rp ON rp.permission_id = p.id
			INNER JOIN user_roles ur ON ur.role_id = rp.role_id
			WHERE ur.user_id = $1 AND p.code = ANY($2)
		)
	`

	var hasPermission bool
	err := s.db.QueryRowContext(ctx, query, userID, permissionCodes).Scan(&hasPermission)
	if err != nil {
		return false, fmt.Errorf("failed to check permissions: %w", err)
	}

	return hasPermission, nil
}
