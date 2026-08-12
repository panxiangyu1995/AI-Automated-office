package repository

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"gorm.io/gorm"
)

type inventoryRepo struct{ db *gorm.DB }

func NewInventoryRepository(db *gorm.DB) InventoryRepository { return &inventoryRepo{db} }

func (r *inventoryRepo) Upsert(inv *model.WarehouseInventory) error {
	sql := `INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit, created_at, updated_at)
		VALUES (?,?,?,?,?,?, NOW(), NOW())
		ON CONFLICT (warehouse_id, material_id) DO UPDATE SET quantity=EXCLUDED.quantity, safety_stock=EXCLUDED.safety_stock, in_transit=EXCLUDED.in_transit, updated_at=NOW()`
	if err := r.db.Exec(sql, inv.EnterpriseID, inv.WarehouseID, inv.MaterialID, inv.Quantity, inv.SafetyStock, inv.InTransit).Error; err != nil {
		return err
	}
	return r.db.Where("warehouse_id=? AND material_id=?", inv.WarehouseID, inv.MaterialID).First(inv).Error
}

func (r *inventoryRepo) AdjustQuantity(eid, whID, matID uuid.UUID, delta int) error {
	sql := `INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit, created_at, updated_at)
		VALUES (?, ?, ?, ?, 0, 0, NOW(), NOW())
		ON CONFLICT (warehouse_id, material_id) DO UPDATE SET quantity = warehouse_inventories.quantity + EXCLUDED.quantity, updated_at = NOW()`
	return r.db.Exec(sql, eid, whID, matID, delta).Error
}

func (r *inventoryRepo) AdjustQuantityWithCheck(eid, whID, matID uuid.UUID, delta int) error {
	sql := `INSERT INTO warehouse_inventories (enterprise_id, warehouse_id, material_id, quantity, safety_stock, in_transit, created_at, updated_at)
		VALUES (?, ?, ?, ?, 0, 0, NOW(), NOW())
		ON CONFLICT (warehouse_id, material_id) DO UPDATE SET quantity = warehouse_inventories.quantity + EXCLUDED.quantity, updated_at = NOW()
		WHERE (warehouse_inventories.quantity + EXCLUDED.quantity) >= 0`
	result := r.db.Exec(sql, eid, whID, matID, delta)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("insufficient stock for warehouse %s material %s", whID, matID)
	}
	return nil
}

func (r *inventoryRepo) Find(whID, matID uuid.UUID) (*model.WarehouseInventory, error) {
	var inv model.WarehouseInventory
	err := r.db.Where("warehouse_id=? AND material_id=?", whID, matID).First(&inv).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &inv, err
}

func (r *inventoryRepo) FindByID(id, enterpriseID uuid.UUID) (*model.WarehouseInventory, error) {
	var inv model.WarehouseInventory
	err := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&inv).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &inv, err
}

func (r *inventoryRepo) ListByWarehouse(whID uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	var invs []model.WarehouseInventory
	var t int64
	q := r.db.Model(&model.WarehouseInventory{}).Where("warehouse_id=?", whID)
	if err := q.Count(&t).Error; err != nil {
		return nil, 0, err
	}
	if p < 1 {
		p = 1
	}
	if ps < 1 || ps > 100 {
		ps = 20
	}
	return invs, t, q.Order("created_at DESC").Offset((p - 1) * ps).Limit(ps).Find(&invs).Error
}

func (r *inventoryRepo) ListByMaterial(matID uuid.UUID) ([]model.WarehouseInventory, error) {
	var invs []model.WarehouseInventory
	return invs, r.db.Where("material_id=?", matID).Find(&invs).Error
}

func (r *inventoryRepo) ListLowStock(eid uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	var invs []model.WarehouseInventory
	var t int64
	q := r.db.Model(&model.WarehouseInventory{}).Where("enterprise_id=? AND quantity < safety_stock", eid)
	if err := q.Count(&t).Error; err != nil {
		return nil, 0, err
	}
	if p < 1 {
		p = 1
	}
	if ps < 1 || ps > 100 {
		ps = 20
	}
	return invs, t, q.Order("(safety_stock - quantity) DESC").Offset((p - 1) * ps).Limit(ps).Find(&invs).Error
}
