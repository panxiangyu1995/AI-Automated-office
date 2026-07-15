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

func setupGroupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE groups (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		name VARCHAR(255) NOT NULL, code VARCHAR(100) NOT NULL UNIQUE,
		contact_email VARCHAR(255), contact_phone VARCHAR(50),
		address TEXT, status VARCHAR(20) NOT NULL DEFAULT 'active')`).Error)
	return db
}

func TestGroupRepo_Create_FindByID_Update_Delete(t *testing.T) {
	db := setupGroupTestDB(t)
	repo := NewGroupRepository(db)

	group := &model.Group{
		Name:         "测试集团",
		Code:         "GRP001",
		ContactEmail: "admin@group.com",
		ContactPhone: "13800000001",
		Address:      "北京市",
		Status:       "active",
	}
	group.ID = uuid.New()

	err := repo.Create(group)
	assert.NoError(t, err)

	found, err := repo.FindByID(group.ID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "测试集团", found.Name)
	assert.Equal(t, "GRP001", found.Code)

	found.Name = "更新集团"
	found.Status = "inactive"
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(group.ID)
	assert.NoError(t, err)
	assert.Equal(t, "更新集团", updated.Name)
	assert.Equal(t, "inactive", updated.Status)

	err = repo.Delete(group.ID)
	assert.NoError(t, err)

	deleted, err := repo.FindByID(group.ID)
	assert.NoError(t, err)
	assert.Nil(t, deleted)
}

func TestGroupRepo_FindByCode(t *testing.T) {
	db := setupGroupTestDB(t)
	repo := NewGroupRepository(db)

	group := &model.Group{Name: "集团A", Code: "CODE_A", Status: "active"}
	group.ID = uuid.New()
	require.NoError(t, repo.Create(group))

	found, err := repo.FindByCode("CODE_A")
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "集团A", found.Name)

	notFound, err := repo.FindByCode("NOTEXIST")
	assert.NoError(t, err)
	assert.Nil(t, notFound)
}

func TestGroupRepo_List(t *testing.T) {
	db := setupGroupTestDB(t)
	repo := NewGroupRepository(db)

	for i := 0; i < 5; i++ {
		g := &model.Group{Name: "集团" + string(rune('A'+i)), Code: "CODE" + string(rune('A'+i)), Status: "active"}
		g.ID = uuid.New()
		require.NoError(t, repo.Create(g))
	}

	groups, total, err := repo.List(1, 3)
	assert.NoError(t, err)
	assert.Equal(t, int64(5), total)
	assert.Len(t, groups, 3)
}
