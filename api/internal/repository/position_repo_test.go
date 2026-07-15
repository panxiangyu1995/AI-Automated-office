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

func setupPositionTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE positions (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, department_id TEXT,
		name VARCHAR(100) NOT NULL, description TEXT)`).Error)
	return db
}

func TestPositionRepo_Create_FindByID_Update(t *testing.T) {
	db := setupPositionTestDB(t)
	repo := NewPositionRepository(db)
	eid := uuid.New()
	deptID := uuid.New().String()

	pos := &model.Position{
		DepartmentID: &deptID,
		Name:         "高级工程师",
		Description:  "负责核心系统开发",
	}
	pos.EnterpriseID = eid
	pos.ID = uuid.New()

	err := repo.Create(pos)
	assert.NoError(t, err)

	found, err := repo.FindByID(pos.ID, eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "高级工程师", found.Name)
	assert.Equal(t, "负责核心系统开发", found.Description)

	found.Name = "首席工程师"
	found.Description = "负责技术架构"
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(pos.ID, eid)
	assert.NoError(t, err)
	assert.Equal(t, "首席工程师", updated.Name)
	assert.Equal(t, "负责技术架构", updated.Description)
}

func TestPositionRepo_ListByEnterprise(t *testing.T) {
	db := setupPositionTestDB(t)
	repo := NewPositionRepository(db)
	eid := uuid.New()

	for i := 0; i < 3; i++ {
		pos := &model.Position{
			Name:        "岗位" + string(rune('A'+i)),
			Description: "描述",
		}
		pos.EnterpriseID = eid
		pos.ID = uuid.New()
		require.NoError(t, repo.Create(pos))
	}

	positions, err := repo.ListByEnterprise(eid)
	assert.NoError(t, err)
	assert.Len(t, positions, 3)
}

func TestPositionRepo_FindByID_NotFound(t *testing.T) {
	db := setupPositionTestDB(t)
	repo := NewPositionRepository(db)

	found, err := repo.FindByID(uuid.New(), uuid.New())
	assert.NoError(t, err)
	assert.Nil(t, found)
}
