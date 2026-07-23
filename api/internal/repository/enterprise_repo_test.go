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

func setupEnterpriseTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE groups (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		name VARCHAR(255) NOT NULL, code VARCHAR(100) NOT NULL UNIQUE,
		contact_email VARCHAR(255), contact_phone VARCHAR(50),
		address TEXT, status VARCHAR(20) NOT NULL DEFAULT 'active')`).Error)
	require.NoError(t, db.Exec(`CREATE TABLE "public.enterprises" (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		group_id TEXT NOT NULL, name VARCHAR(255) NOT NULL,
		code VARCHAR(100) NOT NULL UNIQUE,
		contact_email VARCHAR(255), contact_phone VARCHAR(50),
		address TEXT, status VARCHAR(20) NOT NULL DEFAULT 'trial',
		status_reason TEXT, status_changed_at DATETIME, status_changed_by TEXT,
		suspended_at DATETIME, frozen_at DATETIME, subscribed_at DATETIME, expires_at DATETIME,
		schema_name VARCHAR(100))`).Error)
	return db
}

func TestEnterpriseRepo_Create_FindByID_Update(t *testing.T) {
	t.Skip("requires PostgreSQL: enterprise repo uses db.Table(\"public.enterprises\") which is incompatible with SQLite")
	db := setupEnterpriseTestDB(t)
	repo := NewEnterpriseRepository(db)
	groupID := uuid.New().String()

	ent := &model.Enterprise{
		GroupID:      groupID,
		Name:         "测试企业",
		Code:         "ENT001",
		ContactEmail: "admin@ent.com",
		ContactPhone: "13900000001",
		Address:      "上海市",
		Status:       "active",
		SchemaName:   "tenant_ent001",
	}
	ent.ID = uuid.New()

	err := repo.Create(ent)
	assert.NoError(t, err)

	found, err := repo.FindByID(ent.ID)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "测试企业", found.Name)
	assert.Equal(t, "ENT001", found.Code)
	assert.Equal(t, "tenant_ent001", found.SchemaName)

	found.Name = "更新企业"
	found.Status = "inactive"
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(ent.ID)
	assert.NoError(t, err)
	assert.Equal(t, "更新企业", updated.Name)
	assert.Equal(t, "inactive", updated.Status)
}

func TestEnterpriseRepo_findByCode(t *testing.T) {
	t.Skip("requires PostgreSQL: enterprise repo uses db.Table(\"public.enterprises\") which is incompatible with SQLite")
	db := setupEnterpriseTestDB(t)
	repo := NewEnterpriseRepository(db)

	ent := &model.Enterprise{
		GroupID: uuid.New().String(),
		Name:    "企业A",
		Code:    "CODE_A",
		Status:  "active",
	}
	ent.ID = uuid.New()
	require.NoError(t, repo.Create(ent))

	found, err := repo.FindByCode("CODE_A")
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "企业A", found.Name)

	notFound, err := repo.FindByCode("NOTEXIST")
	assert.NoError(t, err)
	assert.Nil(t, notFound)
}

func TestEnterpriseRepo_List(t *testing.T) {
	t.Skip("requires PostgreSQL: enterprise repo uses db.Table(\"public.enterprises\") which is incompatible with SQLite")
	db := setupEnterpriseTestDB(t)
	repo := NewEnterpriseRepository(db)

	for i := 0; i < 5; i++ {
		ent := &model.Enterprise{
			GroupID: uuid.New().String(),
			Name:    "企业" + string(rune('A'+i)),
			Code:    "CODE" + string(rune('A'+i)),
			Status:  "active",
		}
		ent.ID = uuid.New()
		require.NoError(t, repo.Create(ent))
	}

	enterprises, total, err := repo.List(1, 3)
	assert.NoError(t, err)
	assert.Equal(t, int64(5), total)
	assert.Len(t, enterprises, 3)
}

func TestEnterpriseRepo_ListByGroup(t *testing.T) {
	t.Skip("requires PostgreSQL: enterprise repo uses db.Table(\"public.enterprises\") which is incompatible with SQLite")
	db := setupEnterpriseTestDB(t)
	repo := NewEnterpriseRepository(db)
	groupID := uuid.New().String()

	ent1 := &model.Enterprise{GroupID: groupID, Name: "企业1", Code: "E1", Status: "active"}
	ent1.ID = uuid.New()
	require.NoError(t, repo.Create(ent1))

	ent2 := &model.Enterprise{GroupID: groupID, Name: "企业2", Code: "E2", Status: "active"}
	ent2.ID = uuid.New()
	require.NoError(t, repo.Create(ent2))

	ent3 := &model.Enterprise{GroupID: uuid.New().String(), Name: "其他企业", Code: "E3", Status: "active"}
	ent3.ID = uuid.New()
	require.NoError(t, repo.Create(ent3))

	enterprises, err := repo.ListByGroup(groupID)
	assert.NoError(t, err)
	assert.Len(t, enterprises, 2)
}
