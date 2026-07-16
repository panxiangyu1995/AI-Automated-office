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

func setupBackupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.Exec(`CREATE TABLE backup_configs (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL,
		backup_time VARCHAR(5) NOT NULL,
		backup_directory VARCHAR(500) NOT NULL DEFAULT '/var/backups',
		retention_days INTEGER NOT NULL DEFAULT 30,
		enabled BOOLEAN NOT NULL DEFAULT 1)`).Error)
	require.NoError(t, db.Exec(`CREATE TABLE backup_records (
		id TEXT PRIMARY KEY, created_at DATETIME, updated_at DATETIME, deleted_at DATETIME,
		enterprise_id TEXT NOT NULL,
		config_id TEXT, status VARCHAR(20) NOT NULL DEFAULT 'pending',
		file_path VARCHAR(500), file_size INTEGER,
		encrypted BOOLEAN NOT NULL DEFAULT 0,
		error_message TEXT, started_at DATETIME, completed_at DATETIME)`).Error)
	return db
}

func TestBackupConfigRepo_Create_FindByID_Update_Delete(t *testing.T) {
	db := setupBackupTestDB(t)
	repo := NewBackupConfigRepository(db)
	eid := uuid.New()

	config := &model.BackupConfig{
		BackupTime:      "02:00",
		BackupDirectory: "/var/backups",
		RetentionDays:   30,
		Enabled:         true,
	}
	config.EnterpriseID = eid
	config.ID = uuid.New()

	err := repo.Create(config)
	assert.NoError(t, err)

	found, err := repo.FindByID(config.ID, eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "02:00", found.BackupTime)
	assert.Equal(t, 30, found.RetentionDays)
	assert.Equal(t, true, found.Enabled)

	found.RetentionDays = 60
	found.Enabled = false
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(config.ID, eid)
	assert.NoError(t, err)
	assert.Equal(t, 60, updated.RetentionDays)
	assert.Equal(t, false, updated.Enabled)

	err = repo.Delete(config.ID, eid)
	assert.NoError(t, err)

	deleted, err := repo.FindByID(config.ID, eid)
	assert.NoError(t, err)
	assert.Nil(t, deleted)
}

func TestBackupConfigRepo_ListByEnterprise(t *testing.T) {
	db := setupBackupTestDB(t)
	repo := NewBackupConfigRepository(db)
	eid := uuid.New()

	config1 := &model.BackupConfig{BackupTime: "02:00", BackupDirectory: "/var/backups", RetentionDays: 30, Enabled: true}
	config1.EnterpriseID = eid
	config1.ID = uuid.New()
	require.NoError(t, repo.Create(config1))

	config2 := &model.BackupConfig{BackupTime: "03:00", BackupDirectory: "/var/backups", RetentionDays: 60, Enabled: true}
	config2.EnterpriseID = eid
	config2.ID = uuid.New()
	require.NoError(t, repo.Create(config2))

	configs, err := repo.ListByEnterprise(eid.String())
	assert.NoError(t, err)
	assert.Len(t, configs, 2)
}

func TestBackupConfigRepo_ListEnabled(t *testing.T) {
	db := setupBackupTestDB(t)
	repo := NewBackupConfigRepository(db)
	eid := uuid.New()

	enabled := &model.BackupConfig{BackupTime: "02:00", BackupDirectory: "/var/backups", RetentionDays: 30, Enabled: true}
	enabled.EnterpriseID = eid
	enabled.ID = uuid.New()
	require.NoError(t, repo.Create(enabled))

	disabled := &model.BackupConfig{BackupTime: "03:00", BackupDirectory: "/var/backups", RetentionDays: 60, Enabled: false}
	disabled.EnterpriseID = eid
	disabled.ID = uuid.New()
	require.NoError(t, repo.Create(disabled))

	configs, err := repo.ListEnabled()
	assert.NoError(t, err)
	for _, c := range configs {
		assert.Equal(t, true, c.Enabled)
	}
}

func TestBackupRecordRepo_Create_FindByID_Update(t *testing.T) {
	db := setupBackupTestDB(t)
	repo := NewBackupRecordRepository(db)
	eid := uuid.New()
	configID := uuid.New().String()

	record := &model.BackupRecord{
		ConfigID:     &configID,
		Status:       "pending",
		FilePath:     "/var/backups/backup_001.tar.gz",
		FileSize:     1024000,
		ErrorMessage: "",
	}
	record.EnterpriseID = eid
	record.ID = uuid.New()

	err := repo.Create(record)
	assert.NoError(t, err)

	found, err := repo.FindByID(record.ID, eid)
	assert.NoError(t, err)
	assert.NotNil(t, found)
	assert.Equal(t, "pending", found.Status)
	assert.Equal(t, int64(1024000), found.FileSize)

	found.Status = "completed"
	now := time.Now()
	found.CompletedAt = &now
	err = repo.Update(found)
	assert.NoError(t, err)

	updated, err := repo.FindByID(record.ID, eid)
	assert.NoError(t, err)
	assert.Equal(t, "completed", updated.Status)
	assert.NotNil(t, updated.CompletedAt)
}

func TestBackupRecordRepo_ListByEnterprise(t *testing.T) {
	db := setupBackupTestDB(t)
	repo := NewBackupRecordRepository(db)
	eid := uuid.New()

	for i := 0; i < 3; i++ {
		record := &model.BackupRecord{Status: "completed", FilePath: "/var/backups/backup.tar.gz"}
		record.EnterpriseID = eid
		record.ID = uuid.New()
		require.NoError(t, repo.Create(record))
	}

	records, total, err := repo.ListByEnterprise(eid.String(), 0, 10)
	assert.NoError(t, err)
	assert.Equal(t, int64(3), total)
	assert.Len(t, records, 3)
}
