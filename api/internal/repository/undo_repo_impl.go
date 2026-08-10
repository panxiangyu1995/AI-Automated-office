package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type undoRepo struct {
	db *gorm.DB
}

func NewUndoRepository(db *gorm.DB) UndoRepository {
	return &undoRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *undoRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *undoRepo) Create(op *model.UndoOperation) error {
	return r.fresh().Create(op).Error
}

func (r *undoRepo) FindByID(id uuid.UUID) (*model.UndoOperation, error) {
	var op model.UndoOperation
	if err := r.fresh().Where("id = ?", id).First(&op).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &op, nil
}

func (r *undoRepo) MarkUndone(id uuid.UUID) error {
	return r.fresh().Model(&model.UndoOperation{}).Where("id = ?", id).Update("undone", true).Error
}

func (r *undoRepo) FindBeforeState(tableName, resourceID string) (map[string]interface{}, error) {
	var result map[string]interface{}
	if err := r.fresh().Table(tableName).Where("id = ?", resourceID).Take(&result).Error; err != nil {
		return nil, err
	}
	return result, nil
}
