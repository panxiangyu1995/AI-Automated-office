package service

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type InventoryService struct {
	invRepo    repository.InventoryRepository
	matRepo    repository.MaterialRepository
	whRepo     repository.WarehouseRepository
}

func NewInventoryService(invRepo repository.InventoryRepository, matRepo repository.MaterialRepository, whRepo repository.WarehouseRepository) *InventoryService {
	return &InventoryService{invRepo, matRepo, whRepo}
}

func (s *InventoryService) Set(eid, whID, matID string, qty, safety, transit int) (*model.WarehouseInventory, *apperrors.AppError) {
	_, err := uuid.Parse(eid); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	wid, err := uuid.Parse(whID); if err != nil { return nil, apperrors.NewValidationError("warehouse_id", "仓库ID无效") }
	mid, err := uuid.Parse(matID); if err != nil { return nil, apperrors.NewValidationError("material_id", "物料ID无效") }
	inv := &model.WarehouseInventory{Quantity: qty, SafetyStock: safety, InTransit: transit}
	inv.EnterpriseID = uuid.MustParse(eid); inv.WarehouseID = wid; inv.MaterialID = mid
	if err := s.invRepo.Upsert(inv); err != nil { return nil, apperrors.ErrInternal.WithDetail("设置库存失败") }
	return inv, nil
}

func (s *InventoryService) QueryByWarehouse(whID string, p, ps int) ([]model.WarehouseInventory, int64, *apperrors.AppError) {
	wid, err := uuid.Parse(whID); if err != nil { return nil,0, apperrors.NewValidationError("warehouse_id", "仓库ID无效") }
	items, total, err := s.invRepo.ListByWarehouse(wid, p, ps)
	if err != nil { return nil,0, apperrors.ErrInternal.WithDetail("查询库存失败") }
	return items, total, nil
}

func (s *InventoryService) QueryByMaterial(matID string) ([]model.WarehouseInventory, *apperrors.AppError) {
	mid, err := uuid.Parse(matID); if err != nil { return nil, apperrors.NewValidationError("material_id", "物料ID无效") }
	items, err := s.invRepo.ListByMaterial(mid)
	if err != nil { return nil, apperrors.ErrInternal.WithDetail("查询库存失败") }
	return items, nil
}

func (s *InventoryService) LowStockAlerts(eid string, p, ps int) ([]model.WarehouseInventory, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil,0, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	items, total, err := s.invRepo.ListLowStock(id, p, ps)
	if err != nil { return nil,0, apperrors.ErrInternal.WithDetail("查询库存预警失败") }
	return items, total, nil
}
