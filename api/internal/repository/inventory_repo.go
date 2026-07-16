package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type InventoryRepository interface {
	Upsert(inv *model.WarehouseInventory) error
	AdjustQuantity(eid, whID, matID uuid.UUID, delta int) error
	AdjustQuantityWithCheck(eid, whID, matID uuid.UUID, delta int) error
	Find(whID, matID uuid.UUID) (*model.WarehouseInventory, error)
	FindByID(id, enterpriseID uuid.UUID) (*model.WarehouseInventory, error)
	ListByWarehouse(whID uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error)
	ListByMaterial(matID uuid.UUID) ([]model.WarehouseInventory, error)
	ListLowStock(eid uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error)
}
