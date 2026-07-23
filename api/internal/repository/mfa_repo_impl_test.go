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

func setupMFATestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE mfa_configs (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL, user_id TEXT NOT NULL,
		method VARCHAR(20) NOT NULL DEFAULT 'totp', secret VARCHAR(100) NOT NULL,
		verified BOOLEAN DEFAULT FALSE, backup_codes TEXT)`).Error)
	return db
}

func TestMFARepo_Create_FindByUserID(t *testing.T) {
	db := setupMFATestDB(t)
	repo := NewMFARepository(db)
	eid := uuid.New()
	userID := uuid.New().String()

	config := &model.MFAConfig{
		UserID:      userID,
		Method:      "totp",
		Secret:      "JBSWY3DPEHPK3PXP",
		Verified:    false,
		BackupCodes: `["12345678"]`,
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()

	err := repo.Create(config)
	assert.NoError(t, err)

	found, err := repo.FindByUserID(userID, eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "totp", found.Method)
	assert.Equal(t, "JBSWY3DPEHPK3PXP", found.Secret)
	assert.False(t, found.Verified)
}

func TestMFARepo_FindByUserID_NotFound(t *testing.T) {
	db := setupMFATestDB(t)
	repo := NewMFARepository(db)

	found, err := repo.FindByUserID("nonexistent-user", uuid.New())
	assert.NoError(t, err)
	assert.Nil(t, found)
}

func TestMFARepo_FindByUserIDAndVerified(t *testing.T) {
	db := setupMFATestDB(t)
	repo := NewMFARepository(db)
	eid := uuid.New()

	userID1 := uuid.New().String()
	config1 := &model.MFAConfig{
		UserID:   userID1,
		Method:   "totp",
		Secret:   "SECRET1",
		Verified: true,
	}
	config1.EnterpriseID = eid
	config1.ID = uuid.New()
	require.NoError(t, repo.Create(config1))

	userID2 := uuid.New().String()
	config2 := &model.MFAConfig{
		UserID:   userID2,
		Method:   "totp",
		Secret:   "SECRET2",
		Verified: false,
	}
	config2.EnterpriseID = eid
	config2.ID = uuid.New()
	require.NoError(t, repo.Create(config2))

	verified, err := repo.FindByUserIDAndVerified(userID1, eid, true)
	assert.NoError(t, err)
	assert.NotNil(t, verified)
	assert.Equal(t, "SECRET1", verified.Secret)

	notVerified, err := repo.FindByUserIDAndVerified(userID2, eid, true)
	assert.NoError(t, err)
	assert.Nil(t, notVerified)

	unverified, err := repo.FindByUserIDAndVerified(userID2, eid, false)
	assert.NoError(t, err)
	assert.NotNil(t, unverified)
	assert.Equal(t, "SECRET2", unverified.Secret)
}

func TestMFARepo_Save(t *testing.T) {
	db := setupMFATestDB(t)
	repo := NewMFARepository(db)
	eid := uuid.New()

	userID := uuid.New().String()
	config := &model.MFAConfig{
		UserID:   userID,
		Method:   "totp",
		Secret:   "ORIGINAL",
		Verified: false,
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()
	require.NoError(t, repo.Create(config))

	config.Secret = "UPDATED"
	config.Verified = true
	err := repo.Save(config)
	assert.NoError(t, err)

	found, err := repo.FindByUserID(userID, eid)
	assert.NoError(t, err)
	assert.Equal(t, "UPDATED", found.Secret)
	assert.True(t, found.Verified)
}

func TestMFARepo_UpdateVerified(t *testing.T) {
	db := setupMFATestDB(t)
	repo := NewMFARepository(db)
	eid := uuid.New()

	config := &model.MFAConfig{
		UserID:   uuid.New().String(),
		Method:   "totp",
		Secret:   "SECRET",
		Verified: false,
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()
	require.NoError(t, repo.Create(config))

	err := repo.UpdateVerified(config.ID, eid, true)
	assert.NoError(t, err)

	found, err := repo.FindByUserID(config.UserID, eid)
	assert.NoError(t, err)
	assert.True(t, found.Verified)
}

func TestMFARepo_UpdateBackupCodes(t *testing.T) {
	db := setupMFATestDB(t)
	repo := NewMFARepository(db)
	eid := uuid.New()

	config := &model.MFAConfig{
		UserID:      uuid.New().String(),
		Method:      "totp",
		Secret:      "SECRET",
		Verified:    false,
		BackupCodes: `["11111111"]`,
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()
	require.NoError(t, repo.Create(config))

	newCodes := `["22222222","33333333"]`
	err := repo.UpdateBackupCodes(config.ID, eid, newCodes)
	assert.NoError(t, err)

	found, err := repo.FindByUserID(config.UserID, eid)
	assert.NoError(t, err)
	assert.Equal(t, newCodes, found.BackupCodes)
}

func TestMFARepo_DeleteByUserID(t *testing.T) {
	db := setupMFATestDB(t)
	repo := NewMFARepository(db)
	eid := uuid.New()

	userID := uuid.New().String()
	config := &model.MFAConfig{
		UserID:   userID,
		Method:   "totp",
		Secret:   "SECRET",
		Verified: true,
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()
	require.NoError(t, repo.Create(config))

	rowsAffected, err := repo.DeleteByUserID(userID, eid)
	assert.NoError(t, err)
	assert.Equal(t, int64(1), rowsAffected)

	found, err := repo.FindByUserID(userID, eid)
	assert.NoError(t, err)
	assert.Nil(t, found)

	rowsAffected, err = repo.DeleteByUserID(userID, eid)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), rowsAffected)
}
