package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type InventoryCheckService struct {
	checkRepo repository.InventoryCheckRepository
	whRepo    repository.WarehouseRepository
	invRepo   repository.InventoryRepository
}

func NewInventoryCheckService(checkRepo repository.InventoryCheckRepository, whRepo repository.WarehouseRepository, invRepo repository.InventoryRepository) *InventoryCheckService {
	return &InventoryCheckService{checkRepo, whRepo, invRepo}
}

func (s *InventoryCheckService) Create(eid, whID, notes string) (*model.InventoryCheck, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	wid, err := uuid.Parse(whID)
	if err != nil {
		return nil, apperrors.NewValidationError("warehouse_id", "无效")
	}
	wh, _ := s.whRepo.FindByID(wid, id)
	if wh == nil {
		return nil, apperrors.ErrNotFound.WithDetail("仓库不存在")
	}

	check := &model.InventoryCheck{WarehouseID: whID, CheckNo: "CK-" + uuid.New().String()[:8], Status: "draft", Notes: notes}
	check.EnterpriseID = id
	if err := s.checkRepo.Create(check); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建盘点单失败: " + err.Error())
	}
	return check, nil
}

func (s *InventoryCheckService) Complete(checkID string) (*model.InventoryCheck, *apperrors.AppError) {
	cid, err := uuid.Parse(checkID)
	if err != nil {
		return nil, apperrors.NewValidationError("check_id", "无效")
	}
	check, dbErr := s.checkRepo.FindByID(cid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询盘点单失败")
	}
	if check == nil {
		return nil, apperrors.ErrNotFound.WithDetail("盘点单不存在")
	}
	check.Status = "completed"
	if err := s.checkRepo.Update(check); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("完成盘点失败: " + err.Error())
	}
	return check, nil
}

func (s *InventoryCheckService) List(eid string, p, ps int) ([]model.InventoryCheck, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	checks, total, dbErr := s.checkRepo.ListByEnterprise(id, p, ps)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询盘点列表失败: " + dbErr.Error())
	}
	return checks, total, nil
}
