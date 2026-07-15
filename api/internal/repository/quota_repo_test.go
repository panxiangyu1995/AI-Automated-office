package repository

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

func setupQuotaTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE api_quotas (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL,
		daily_limit INTEGER NOT NULL DEFAULT 10000,
		monthly_limit INTEGER NOT NULL DEFAULT 300000,
		daily_used INTEGER NOT NULL DEFAULT 0,
		monthly_used INTEGER NOT NULL DEFAULT 0,
		daily_reset_at DATETIME NOT NULL,
		monthly_reset_at DATETIME NOT NULL)`).Error)
	require.NoError(t, db.Exec(`CREATE TABLE feature_flags (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL,
		feature_key VARCHAR(100) NOT NULL,
		enabled BOOLEAN NOT NULL DEFAULT 1,
		label VARCHAR(200))`).Error)
	return db
}

func TestApiQuotaRepo_Create_FindByEnterprise_Update(t *testing.T) {
	db := setupQuotaTestDB(t)
	repo := NewApiQuotaRepository(db)
	eid := uuid.New()
	now := time.Now()

	quota := &model.ApiQuota{
		DailyLimit:     10000,
		MonthlyLimit:   300000,
		DailyUsed:      0,
		MonthlyUsed:    0,
		DailyResetAt:   now,
		MonthlyResetAt: now,
	}
	quota.EnterpriseID = eid
	quota.ID = uuid.New()

	err := repo.Create(quota)
	assert.NoError(t, err)

	found, err := repo.FindByEnterprise(eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, 10000, found.DailyLimit)
	assert.Equal(t, 300000, found.MonthlyLimit)

	found.DailyUsed = 500
	found.MonthlyUsed = 15000
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByEnterprise(eid)
	assert.NoError(t, err)
	assert.Equal(t, 500, updated.DailyUsed)
	assert.Equal(t, 15000, updated.MonthlyUsed)
}

func TestApiQuotaRepo_FindByEnterprise_NotFound(t *testing.T) {
	db := setupQuotaTestDB(t)
	repo := NewApiQuotaRepository(db)

	found, err := repo.FindByEnterprise(uuid.New())
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestFeatureFlagRepo_Create_Find_Update_Delete(t *testing.T) {
	db := setupQuotaTestDB(t)
	repo := NewFeatureFlagRepository(db)
	eid := uuid.New()

	flag := &model.FeatureFlag{
		FeatureKey: "hrm",
		Enabled:    true,
		Label:      "hrm module",
	}
	flag.EnterpriseID = eid
	flag.ID = uuid.New()

	err := repo.Create(flag)
	assert.NoError(t, err)

	found, err := repo.Find(eid, "hrm")
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, true, found.Enabled)
	assert.Equal(t, "hrm module", found.Label)

	found.Enabled = false
	found.Label = "hrm disabled"
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.Find(eid, "hrm")
	assert.NoError(t, err)
	assert.Equal(t, false, updated.Enabled)
	assert.Equal(t, "hrm disabled", updated.Label)

	err = repo.Delete(flag.ID, eid)
	assert.NoError(t, err)

	deleted, err := repo.Find(eid, "hrm")
	assert.NoError(t, err)
	assert.Nil(t, deleted)
}

func TestFeatureFlagRepo_FindByEnterprise(t *testing.T) {
	db := setupQuotaTestDB(t)
	repo := NewFeatureFlagRepository(db)
	eid := uuid.New()

	for _, key := range []string{"hrm", "crm", "ims"} {
		flag := &model.FeatureFlag{FeatureKey: key, Enabled: true, Label: key + " module"}
		flag.EnterpriseID = eid
		flag.ID = uuid.New()
		require.NoError(t, repo.Create(flag))
	}

	flags, err := repo.FindByEnterprise(eid)
	assert.NoError(t, err)
	assert.Len(t, flags, 3)
}

func TestFeatureFlagRepo_InitDefaults(t *testing.T) {
	db := setupQuotaTestDB(t)
	repo := NewFeatureFlagRepository(db)
	eid := uuid.New()

	err := repo.InitDefaults(eid)
	assert.NoError(t, err)

	flags, err := repo.FindByEnterprise(eid)
	assert.NoError(t, err)
	assert.Len(t, flags, len(model.DefaultFeatureKeys))

	for _, f := range flags {
		assert.Equal(t, true, f.Enabled)
	}
}
