package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type WarehouseRepository interface {
	Create(w *model.Warehouse) error; Update(w *model.Warehouse) error; Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Warehouse, error)
	ListByEnterprise(eid uuid.UUID, p, ps int) ([]model.Warehouse, int64, error)
}
