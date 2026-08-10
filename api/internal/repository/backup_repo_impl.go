package repository

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type backupConfigRepo struct {
	db *gorm.DB
}

func NewBackupConfigRepository(db *gorm.DB) BackupConfigRepository {
	return &backupConfigRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *backupConfigRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *backupConfigRepo) Create(config *model.BackupConfig) error {
	return r.fresh().Create(config).Error
}

func (r *backupConfigRepo) Update(config *model.BackupConfig) error {
	return r.fresh().Save(config).Error
}

func (r *backupConfigRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.BackupConfig{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *backupConfigRepo) FindByID(id, enterpriseID uuid.UUID) (*model.BackupConfig, error) {
	var config model.BackupConfig
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&config).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}

func (r *backupConfigRepo) ListByEnterprise(enterpriseID string) ([]model.BackupConfig, error) {
	var configs []model.BackupConfig
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, err
	}
	err = r.fresh().Where("enterprise_id = ?", eid).Find(&configs).Error
	return configs, err
}

func (r *backupConfigRepo) ListEnabled() ([]model.BackupConfig, error) {
	var configs []model.BackupConfig
	err := r.fresh().Where("enabled = ?", true).Find(&configs).Error
	return configs, err
}

type backupRecordRepo struct {
	db *gorm.DB
}

func NewBackupRecordRepository(db *gorm.DB) BackupRecordRepository {
	return &backupRecordRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *backupRecordRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *backupRecordRepo) Create(record *model.BackupRecord) error {
	return r.fresh().Create(record).Error
}

func (r *backupRecordRepo) Update(record *model.BackupRecord) error {
	return r.fresh().Save(record).Error
}

func (r *backupRecordRepo) FindByID(id, enterpriseID uuid.UUID) (*model.BackupRecord, error) {
	var record model.BackupRecord
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &record, nil
}

func (r *backupRecordRepo) ListByEnterprise(enterpriseID string, offset, limit int) ([]model.BackupRecord, int64, error) {
	var records []model.BackupRecord
	var total int64

	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, 0, err
	}

	query := r.fresh().Model(&model.BackupRecord{}).Where("enterprise_id = ?", eid)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&records).Error; err != nil {
		return nil, 0, err
	}
	return records, total, nil
}
