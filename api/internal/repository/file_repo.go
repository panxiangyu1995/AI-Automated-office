package repository

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FileMetadataRepository interface {
	Create(fm *model.FileMetadata) error
	FindByStorageKey(key string) (*model.FileMetadata, error)
	FindByID(id, enterpriseID uuid.UUID) (*model.FileMetadata, error)
	Delete(id, enterpriseID uuid.UUID) error
}

type fileMetadataRepo struct {
	db *gorm.DB
}

func NewFileMetadataRepository(db *gorm.DB) FileMetadataRepository {
	return &fileMetadataRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *fileMetadataRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *fileMetadataRepo) Create(fm *model.FileMetadata) error {
	return r.fresh().Create(fm).Error
}

func (r *fileMetadataRepo) FindByStorageKey(key string) (*model.FileMetadata, error) {
	var fm model.FileMetadata
	err := r.fresh().Where("storage_key = ?", key).First(&fm).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &fm, nil
}

func (r *fileMetadataRepo) FindByID(id, enterpriseID uuid.UUID) (*model.FileMetadata, error) {
	var fm model.FileMetadata
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&fm).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &fm, nil
}

func (r *fileMetadataRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.FileMetadata{}).Error
}
