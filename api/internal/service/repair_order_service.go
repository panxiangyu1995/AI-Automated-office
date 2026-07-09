package service

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type RepairOrderService struct{ db *gorm.DB }

func NewRepairOrderService(db *gorm.DB) *RepairOrderService { return &RepairOrderService{db} }

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

	tx := s.db.Begin()
	if err := tx.Create(r).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.ErrInternal.WithDetail("创建维修工单失败")
	}
	tx.Model(&model.ServiceOrder{}).Where("id=?", serviceOrderID).Update("status", "repairing")
	tx.Commit()

	return r, nil
}

func (s *RepairOrderService) Update(id string, input map[string]interface{}) (*model.RepairOrder, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	var r model.RepairOrder
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("维修工单不存在")
	}
	if err := s.db.Model(&r).Updates(input).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新维修工单失败")
	}
	s.db.Where("id=?", pid).First(&r)
	return &r, nil
}

func (s *RepairOrderService) GetByServiceOrder(serviceOrderID string) (*model.RepairOrder, *apperrors.AppError) {
	var r model.RepairOrder
	if err := s.db.Where("service_order_id=?", serviceOrderID).First(&r).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("维修工单不存在")
	}
	return &r, nil
}
