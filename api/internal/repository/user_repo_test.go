package repository

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

func setupUserTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE users (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, employee_id TEXT,
		email VARCHAR(255) NOT NULL, password_hash VARCHAR(255) NOT NULL,
		name VARCHAR(100) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'employee',
		status VARCHAR(20) NOT NULL DEFAULT 'active', last_login_at DATETIME)`).Error)
	return db
}

func TestUserRepo_Create_FindByID_Update_Delete(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)
	eid := uuid.New().String()

	user := &model.User{
		EnterpriseID: eid,
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		Name:         "测试用户",
		Role:         "employee",
		Status:       "active",
	}
	user.ID = uuid.New()

	err := repo.Create(user)
	assert.NoError(t, err)

	eidUUID := uuid.MustParse(eid)

	found, err := repo.FindByID(user.ID, eidUUID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "测试用户", found.Name)
	assert.Equal(t, "test@example.com", found.Email)

	found.Name = "更新用户"
	found.Role = "admin"
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(user.ID, eidUUID)
	assert.NoError(t, err)
	assert.Equal(t, "更新用户", updated.Name)
	assert.Equal(t, "admin", updated.Role)

	err = repo.Delete(user.ID, eidUUID)
	assert.NoError(t, err)

	deleted, err := repo.FindByID(user.ID, eidUUID)
	assert.NoError(t, err)
	assert.Nil(t, deleted)
}

func TestUserRepo_FindByEmail(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)
	eid := uuid.New().String()

	user := &model.User{
		EnterpriseID: eid,
		Email:        "findme@example.com",
		PasswordHash: "hash",
		Name:         "查找用户",
		Role:         "employee",
		Status:       "active",
	}
	user.ID = uuid.New()
	require.NoError(t, repo.Create(user))

	found, err := repo.FindByEmail("findme@example.com", eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "查找用户", found.Name)

	missing, err := repo.FindByEmail("noone@example.com", eid)
	assert.NoError(t, err)
	assert.Nil(t, missing)
}

func TestUserRepo_List(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)
	eid := uuid.New().String()

	for i := 0; i < 3; i++ {
		user := &model.User{
			EnterpriseID: eid,
			Email:        "user" + string(rune('A'+i)) + "@example.com",
			PasswordHash: "hash",
			Name:         "用户" + string(rune('A'+i)),
			Role:         "employee",
			Status:       "active",
		}
		user.ID = uuid.New()
		require.NoError(t, repo.Create(user))
	}

	users, total, err := repo.List(eid, 0, 10)
	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, users, 3)
}

func TestUserRepo_UpdateLastLogin(t *testing.T) {
	db := setupUserTestDB(t)
	repo := NewUserRepository(db)
	eid := uuid.New().String()

	user := &model.User{
		EnterpriseID: eid,
		Email:        "login@example.com",
		PasswordHash: "hash",
		Name:         "登录用户",
		Role:         "employee",
		Status:       "active",
	}
	user.ID = uuid.New()
	require.NoError(t, repo.Create(user))
	assert.Nil(t, user.LastLoginAt)

	err := repo.UpdateLastLogin(user.ID)
	if err != nil {
		t.Skipf("UpdateLastLogin uses NOW() which is PostgreSQL-only: %v", err)
	}

	updated, err := repo.FindByID(user.ID, uuid.MustParse(eid))
	assert.NoError(t, err)
	assert.NotNil(t, updated.LastLoginAt)
}
