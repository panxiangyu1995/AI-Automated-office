package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type QualityInspectionService struct {
	repo    repository.QualityInspectionRepository
	invRepo repository.InventoryRepository
	ordRepo repository.OrderRepository
}

func NewQualityInspectionService(repo repository.QualityInspectionRepository, invRepo repository.InventoryRepository, ordRepo repository.OrderRepository) *QualityInspectionService {
	return &QualityInspectionService{repo: repo, invRepo: invRepo, ordRepo: ordRepo}
}

func (s *QualityInspectionService) CreateInspection(inspection *model.QualityInspection) *apperrors.AppError {
	inspection.InspectionNo = fmt.Sprintf("QI-%s", uuid.New().String()[:8])
	inspection.Status = "pending"
	if err := s.repo.Create(inspection); err != nil {
		return apperrors.ErrInternal.WithDetail("创建质检单失败")
	}
	return nil
}

func (s *QualityInspectionService) GetInspection(id, enterpriseID uuid.UUID) (*model.QualityInspection, *apperrors.AppError) {
	qi, err := s.repo.FindByID(id, enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询质检单失败")
	}
	if qi == nil {
		return nil, apperrors.ErrNotFound.WithDetail("质检单不存在")
	}
	return qi, nil
}

func (s *QualityInspectionService) AddInspectionItem(item *model.QualityInspectionItem) *apperrors.AppError {
	if err := s.repo.CreateItem(item); err != nil {
		return apperrors.ErrInternal.WithDetail("添加质检项失败")
	}
	return nil
}

func (s *QualityInspectionService) CompleteInspection(id, enterpriseID uuid.UUID, inspectorID string) (*model.QualityInspection, *apperrors.AppError) {
	qi, err := s.repo.FindByID(id, enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询质检单失败")
	}
	if qi == nil {
		return nil, apperrors.ErrNotFound.WithDetail("质检单不存在")
	}
	if qi.Status != "pending" {
		return nil, apperrors.ErrInvalidStatus.WithDetail("质检单状态不允许完成")
	}

	items, err := s.repo.ListItems(id)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询质检项失败")
	}
	if len(items) == 0 {
		return nil, apperrors.ErrBadRequest.WithDetail("质检单没有质检项")
	}

	status := "qualified"
	for _, item := range items {
		if item.Result == "fail" {
			status = "unqualified"
			break
		}
	}

	qi.Status = status
	qi.InspectorID = &inspectorID
	now := time.Now()
	qi.InspectedAt = &now

	if err := s.repo.Update(qi); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新质检单失败")
	}
	return qi, nil
}

func (s *QualityInspectionService) QualifiedAutoReceive(inspectionID, enterpriseID uuid.UUID, warehouseID string) *apperrors.AppError {
	qi, err := s.repo.FindByID(inspectionID, enterpriseID)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询质检单失败")
	}
	if qi == nil {
		return apperrors.ErrNotFound.WithDetail("质检单不存在")
	}
	if qi.Status != "qualified" {
		return apperrors.ErrInvalidStatus.WithDetail("质检未通过，不能自动入库")
	}

	poItems, _ := s.ordRepo.ListPurchaseOrderItems(qi.PurchaseOrderID)

	whUUID, perr := uuid.Parse(warehouseID)
	if perr != nil {
		return apperrors.NewValidationError("warehouse_id", "仓库ID无效")
	}

	for _, item := range poItems {
		qty := item.Quantity - item.ReceivedQty
		if qty <= 0 {
			continue
		}
		matID, _ := uuid.Parse(item.MaterialID)
		inv := &model.WarehouseInventory{Quantity: qty}
		inv.EnterpriseID = qi.EnterpriseID
		inv.WarehouseID = whUUID
		inv.MaterialID = matID
		s.invRepo.Upsert(inv)
		s.ordRepo.IncrementPurchaseOrderItemReceivedQty(item.ID.String(), qty)
	}

	s.ordRepo.UpdatePurchaseOrderStatusByOrderID(qi.PurchaseOrderID, "received")
	return nil
}

func (s *QualityInspectionService) ListByPurchaseOrder(purchaseOrderID uuid.UUID, page, pageSize int) ([]model.QualityInspection, int64, *apperrors.AppError) {
	qis, total, err := s.repo.ListByPurchaseOrder(purchaseOrderID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询质检单列表失败")
	}
	return qis, total, nil
}
