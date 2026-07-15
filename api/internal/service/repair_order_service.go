package service

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type RepairOrderService struct {
	repo repository.RepairOrderRepository
}

func NewRepairOrderService(repo repository.RepairOrderRepository) *RepairOrderService {
	return &RepairOrderService{repo: repo}
}

func (s *RepairOrderService) genNo() string {
	return fmt.Sprintf("RO-%s", uuid.New().String()[:8])
}

func (s *RepairOrderService) Create(eid, serviceOrderID, faultPoint, repairContent string) (*model.RepairOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	r := &model.RepairOrder{
		ServiceOrderID: serviceOrderID,
		FaultPoint:     faultPoint,
		RepairContent:  repairContent,
		Status:         "pending",
	}
	r.EnterpriseID = id

	tx := s.repo.BeginTx()
	if err := s.repo.CreateWithTx(tx, r); err != nil {
		s.repo.RollbackTx(tx)
		return nil, apperrors.ErrInternal.WithDetail("创建维修工单失败")
	}
	s.repo.UpdateServiceOrderStatus(tx, serviceOrderID, id, "repairing")
	s.repo.CommitTx(tx)

	return r, nil
}

func (s *RepairOrderService) Update(id, enterpriseID string, input map[string]interface{}) (*model.RepairOrder, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	r, dbErr := s.repo.FindByID(pid, eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询维修工单失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("维修工单不存在")
	}
	updated, dbErr := s.repo.Update(pid, eid, input)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新维修工单失败")
	}
	return updated, nil
}

func (s *RepairOrderService) GetByServiceOrder(serviceOrderID string) (*model.RepairOrder, *apperrors.AppError) {
	r, dbErr := s.repo.FindByServiceOrderID(serviceOrderID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询维修工单失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("维修工单不存在")
	}
	return r, nil
}
