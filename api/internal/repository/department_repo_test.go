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

func setupDepartmentTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE departments (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL,
		name VARCHAR(255) NOT NULL, parent_id TEXT, manager_id TEXT)`).Error)
	return db
}

func TestDepartmentRepo_Create_FindByID_Update_Delete(t *testing.T) {
	db := setupDepartmentTestDB(t)
	repo := NewDepartmentRepository(db)
	eid := uuid.New()

	dept := &model.Department{Name: "技术部"}
	dept.EnterpriseID = eid
	dept.ID = uuid.New()

	err := repo.Create(dept)
	assert.NoError(t, err)

	found, err := repo.FindByID(dept.ID, eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "技术部", found.Name)

	found.Name = "研发部"
	managerID := uuid.New()
	found.ManagerID = &managerID
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(dept.ID, eid)
	assert.NoError(t, err)
	assert.Equal(t, "研发部", updated.Name)
	assert.NotNil(t, updated.ManagerID)

	err = repo.Delete(dept.ID, eid)
	assert.NoError(t, err)

	deleted, err := repo.FindByID(dept.ID, eid)
	assert.NoError(t, err)
	assert.Nil(t, deleted)
}

func TestDepartmentRepo_ListByEnterprise(t *testing.T) {
	db := setupDepartmentTestDB(t)
	repo := NewDepartmentRepository(db)
	eid := uuid.New()

	for i := 0; i < 3; i++ {
		dept := &model.Department{Name: "部门" + string(rune('A'+i))}
		dept.EnterpriseID = eid
		dept.ID = uuid.New()
		require.NoError(t, repo.Create(dept))
	}

	departments, err := repo.ListByEnterprise(eid)
	assert.NoError(t, err)
	assert.Len(t, departments, 3)
}

func TestDepartmentRepo_CountByEnterprise(t *testing.T) {
	db := setupDepartmentTestDB(t)
	repo := NewDepartmentRepository(db)
	eid := uuid.New()

	dept := &model.Department{Name: "测试部"}
	dept.EnterpriseID = eid
	dept.ID = uuid.New()
	require.NoError(t, repo.Create(dept))

	count, err := repo.CountByEnterprise(eid)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
}

func TestDepartmentRepo_CountByParent(t *testing.T) {
	db := setupDepartmentTestDB(t)
	repo := NewDepartmentRepository(db)
	eid := uuid.New()
	parentID := uuid.New()

	child := &model.Department{Name: "子部门", ParentID: &parentID}
	child.EnterpriseID = eid
	child.ID = uuid.New()
	require.NoError(t, repo.Create(child))

	count, err := repo.CountByParent(parentID)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)
}
