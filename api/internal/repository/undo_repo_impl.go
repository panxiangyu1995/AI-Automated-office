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

func (r *undoRepo) Create(op *model.UndoOperation) error {
	return r.db.Create(op).Error
}

func (r *undoRepo) FindByID(id uuid.UUID) (*model.UndoOperation, error) {
	var op model.UndoOperation
	if err := r.db.Where("id = ?", id).First(&op).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &op, nil
}

func (r *undoRepo) MarkUndone(id uuid.UUID) error {
	return r.db.Model(&model.UndoOperation{}).Where("id = ?", id).Update("undone", true).Error
}

func (r *undoRepo) FindBeforeState(tableName, resourceID string) (map[string]interface{}, error) {
	var result map[string]interface{}
	if err := r.db.Table(tableName).Where("id = ?", resourceID).Take(&result).Error; err != nil {
		return nil, err
	}
	return result, nil
}
