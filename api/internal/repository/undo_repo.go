package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type UndoRepository interface {
	Create(op *model.UndoOperation) error
	FindByID(id uuid.UUID) (*model.UndoOperation, error)
	MarkUndone(id uuid.UUID) error
	FindBeforeState(tableName, resourceID string) (map[string]interface{}, error)
}
