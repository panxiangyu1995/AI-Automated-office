package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type restoreRepo struct {
	db *gorm.DB
}

func NewRestoreRepository(db *gorm.DB) RestoreRepository {
	return &restoreRepo{db: db}
}

func (r *restoreRepo) UndeleteByTableAndID(tableName string, enterpriseID, id uuid.UUID) (int64, error) {
	result := r.db.Table(tableName).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("deleted_at", nil)
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
