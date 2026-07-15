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

func setupServiceConfigTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE service_configs (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, config_key VARCHAR(100) NOT NULL, config_value TEXT)`).Error)
	return db
}

func TestServiceConfigRepo_Create_FindByKey(t *testing.T) {
	db := setupServiceConfigTestDB(t)
	repo := NewServiceConfigRepository(db)
	eid := uuid.New()

	config := &model.ServiceConfig{
		ConfigKey:   "max_users",
		ConfigValue: "100",
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()

	err := repo.Create(config)
	assert.NoError(t, err)

	found, err := repo.FindByKey(eid, "max_users")
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "100", found.ConfigValue)
	assert.Equal(t, "max_users", found.ConfigKey)
}

func TestServiceConfigRepo_FindByKey_NotFound(t *testing.T) {
	db := setupServiceConfigTestDB(t)
	repo := NewServiceConfigRepository(db)

	found, err := repo.FindByKey(uuid.New(), "nonexistent")
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestServiceConfigRepo_FindByKey_DifferentEnterprise(t *testing.T) {
	db := setupServiceConfigTestDB(t)
	repo := NewServiceConfigRepository(db)
	eid1 := uuid.New()
	eid2 := uuid.New()

	config1 := &model.ServiceConfig{
		ConfigKey:   "max_users",
		ConfigValue: "50",
	}
	config1.EnterpriseID = eid1
	config1.ID = uuid.New()
	require.NoError(t, repo.Create(config1))

	config2 := &model.ServiceConfig{
		ConfigKey:   "max_users",
		ConfigValue: "200",
	}
	config2.EnterpriseID = eid2
	config2.ID = uuid.New()
	require.NoError(t, repo.Create(config2))

	found1, err := repo.FindByKey(eid1, "max_users")
	assert.NoError(t, err)
	assert.NotNil(t, found1)
	assert.Equal(t, "50", found1.ConfigValue)

	found2, err := repo.FindByKey(eid2, "max_users")
	assert.NoError(t, err)
	assert.NotNil(t, found2)
	assert.Equal(t, "200", found2.ConfigValue)
}

func TestServiceConfigRepo_UpdateValue(t *testing.T) {
	db := setupServiceConfigTestDB(t)
	repo := NewServiceConfigRepository(db)
	eid := uuid.New()

	config := &model.ServiceConfig{
		ConfigKey:   "max_users",
		ConfigValue: "100",
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()
	require.NoError(t, repo.Create(config))

	err := repo.UpdateValue(config.ID, "500")
	assert.NoError(t, err)

	found, err := repo.FindByKey(eid, "max_users")
	assert.NoError(t, err)
	assert.Equal(t, "500", found.ConfigValue)
}

func TestServiceConfigRepo_UpdateValue_NonExistentID(t *testing.T) {
	db := setupServiceConfigTestDB(t)
	repo := NewServiceConfigRepository(db)

	err := repo.UpdateValue(uuid.New(), "value")
	assert.NoError(t, err)
}
