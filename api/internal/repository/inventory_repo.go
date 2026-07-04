package repository

import (
	"github.com/google/uuid"
	"github.com/ai-office/api/internal/model"
)

type InventoryRepository interface {
	Upsert(inv *model.WarehouseInventory) error
	Find(whID, matID uuid.UUID) (*model.WarehouseInventory, error)
	FindByID(id uuid.UUID) (*model.WarehouseInventory, error)
	ListByWarehouse(whID uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error)
	ListByMaterial(matID uuid.UUID) ([]model.WarehouseInventory, error)
	ListLowStock(eid uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error)
}
