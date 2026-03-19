package service

import (
	"context"
	"database/sql"
	"testing"

	"cloud-server/internal/module/auth/application/dto"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPermissionService_GetUserPermissions(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	service := NewPermissionService(db)

	tests := []struct {
		name          string
		userID        string
		setupMock     func()
		expectedPerms int
		expectError   bool
	}{
		{
			name:   "user with permissions",
			userID: "user-123",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"code", "name", "resource", "action"}).
					AddRow("user:read", "查看用户", "user", "read").
					AddRow("user:write", "编辑用户", "user", "update").
					AddRow("role:read", "查看角色", "role", "read")

				mock.ExpectQuery(`SELECT DISTINCT p.code, p.name, p.resource, p.action`).
					WithArgs("user-123").
					WillReturnRows(rows)
			},
			expectedPerms: 3,
			expectError:   false,
		},
		{
			name:   "user with no permissions",
			userID: "user-456",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"code", "name", "resource", "action"})
				mock.ExpectQuery(`SELECT DISTINCT p.code, p.name, p.resource, p.action`).
					WithArgs("user-456").
					WillReturnRows(rows)
			},
			expectedPerms: 0,
			expectError:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			perms, err := service.GetUserPermissions(context.Background(), tt.userID)

			if tt.expectError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Len(t, perms, tt.expectedPerms)
			}
		})
	}
}

func TestPermissionService_GetUserPermissionCodes(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	service := NewPermissionService(db)

	tests := []struct {
		name          string
		userID        string
		setupMock     func()
		expectedCodes []string
		expectError   bool
	}{
		{
			name:   "user with permissions",
			userID: "user-123",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"code"}).
					AddRow("user:read").
					AddRow("user:write").
					AddRow("role:read")

				mock.ExpectQuery(`SELECT DISTINCT p.code`).
					WithArgs("user-123").
					WillReturnRows(rows)
			},
			expectedCodes: []string{"user:read", "user:write", "role:read"},
			expectError:   false,
		},
		{
			name:   "user with no permissions",
			userID: "user-456",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"code"})
				mock.ExpectQuery(`SELECT DISTINCT p.code`).
					WithArgs("user-456").
					WillReturnRows(rows)
			},
			expectedCodes: []string{},
			expectError:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			codes, err := service.GetUserPermissionCodes(context.Background(), tt.userID)

			if tt.expectError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedCodes, codes)
			}
		})
	}
}

func TestPermissionService_HasPermission(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	service := NewPermissionService(db)

	tests := []struct {
		name           string
		userID         string
		permissionCode string
		setupMock      func()
		expectedResult bool
		expectError    bool
	}{
		{
			name:           "user has permission",
			userID:         "user-123",
			permissionCode: "user:read",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
				mock.ExpectQuery(`SELECT EXISTS`).
					WithArgs("user-123", "user:read").
					WillReturnRows(rows)
			},
			expectedResult: true,
			expectError:    false,
		},
		{
			name:           "user does not have permission",
			userID:         "user-123",
			permissionCode: "admin:delete",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"exists"}).AddRow(false)
				mock.ExpectQuery(`SELECT EXISTS`).
					WithArgs("user-123", "admin:delete").
					WillReturnRows(rows)
			},
			expectedResult: false,
			expectError:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			result, err := service.HasPermission(context.Background(), tt.userID, tt.permissionCode)

			if tt.expectError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedResult, result)
			}
		})
	}
}

func TestPermissionService_GetUserRole(t *testing.T) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)
	defer db.Close()

	service := NewPermissionService(db)

	tests := []struct {
		name         string
		userID       string
		setupMock    func()
		expectedRole *dto.RoleInfo
		expectError  bool
	}{
		{
			name:   "user has role",
			userID: "user-123",
			setupMock: func() {
				rows := sqlmock.NewRows([]string{"code", "name", "is_system"}).
					AddRow("admin", "管理员", true)
				mock.ExpectQuery(`SELECT r.code, r.name, r.is_system`).
					WithArgs("user-123").
					WillReturnRows(rows)
			},
			expectedRole: &dto.RoleInfo{
				Code:     "admin",
				Name:     "管理员",
				IsSystem: true,
			},
			expectError: false,
		},
		{
			name:   "user has no role",
			userID: "user-456",
			setupMock: func() {
				mock.ExpectQuery(`SELECT r.code, r.name, r.is_system`).
					WithArgs("user-456").
					WillReturnError(sql.ErrNoRows)
			},
			expectedRole: nil,
			expectError:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tt.setupMock()

			role, err := service.GetUserRole(context.Background(), tt.userID)

			if tt.expectError {
				assert.Error(t, err)
			} else {
				require.NoError(t, err)
				if tt.expectedRole == nil {
					assert.Nil(t, role)
				} else {
					require.NotNil(t, role)
					assert.Equal(t, tt.expectedRole.Code, role.Code)
					assert.Equal(t, tt.expectedRole.Name, role.Name)
					assert.Equal(t, tt.expectedRole.IsSystem, role.IsSystem)
				}
			}
		})
	}
}
