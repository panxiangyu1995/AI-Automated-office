package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mfaRepo struct {
	db *gorm.DB
}

func NewMFARepository(db *gorm.DB) MFARepository {
	return &mfaRepo{db: db}
}

func (r *mfaRepo) FindByUserID(userID string) (*model.MFAConfig, error) {
	var config model.MFAConfig
	if err := r.db.Where("user_id = ?", userID).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}

func (r *mfaRepo) FindByUserIDAndVerified(userID string, verified bool) (*model.MFAConfig, error) {
	var config model.MFAConfig
	if err := r.db.Where("user_id = ? AND verified = ?", userID, verified).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}

func (r *mfaRepo) Create(config *model.MFAConfig) error {
	return r.db.Create(config).Error
}

func (r *mfaRepo) Save(config *model.MFAConfig) error {
	return r.db.Save(config).Error
}

func (r *mfaRepo) UpdateVerified(id uuid.UUID, verified bool) error {
	return r.db.Model(&model.MFAConfig{}).Where("id = ?", id).Update("verified", verified).Error
}

func (r *mfaRepo) UpdateBackupCodes(id uuid.UUID, backupCodes string) error {
	return r.db.Model(&model.MFAConfig{}).Where("id = ?", id).Update("backup_codes", backupCodes).Error
}

func (r *mfaRepo) DeleteByUserID(userID string) (int64, error) {
	result := r.db.Where("user_id = ?", userID).Delete(&model.MFAConfig{})
	return result.RowsAffected, result.Error
}
