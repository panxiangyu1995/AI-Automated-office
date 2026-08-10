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

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *restoreRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *restoreRepo) UndeleteByTableAndID(tableName string, enterpriseID, id uuid.UUID) (int64, error) {
	result := r.fresh().Table(tableName).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("deleted_at", nil)
	if result.Error != nil {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}
