package service

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type CollectionService struct{ db *gorm.DB }

func NewCollectionService(db *gorm.DB) *CollectionService { return &CollectionService{db} }

func (s *CollectionService) genNo() string {
	return fmt.Sprintf("COL-%s", uuid.New().String()[:8])
}

func (s *CollectionService) Create(eid, customerID, receivableID string, contractID, salesOrderID *string, amount float64, method, collectedAt, notes string) (*model.CollectionRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	r := &model.CollectionRecord{
		CollectionNo: s.genNo(),
		CustomerID:   customerID,
		ReceivableID: receivableID,
		ContractID:   contractID,
		SalesOrderID: salesOrderID,
		Amount:       amount,
		Method:       method,
		CollectedAt:  collectedAt,
		Notes:        notes,
	}
	r.EnterpriseID = id

	tx := s.db.Begin()

	if err := tx.Create(r).Error; err != nil {
		tx.Rollback()
		return nil, apperrors.ErrInternal.WithDetail("创建回款记录失败")
	}

	if contractID != nil && *contractID != "" {
		if err := tx.Model(&model.Contract{}).Where("id=?", *contractID).
			Update("paid_amount", gorm.Expr("paid_amount + ?", amount)).Error; err != nil {
			tx.Rollback()
			return nil, apperrors.ErrInternal.WithDetail("更新合同已回款金额失败")
		}
	}

	tx.Commit()
	return r, nil
}

func (s *CollectionService) Get(id string) (*model.CollectionRecord, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	var r model.CollectionRecord
	if err := s.db.Where("id=?", pid).First(&r).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("回款记录不存在")
	}
	return &r, nil
}

func (s *CollectionService) List(eid string, page, pageSize int) ([]model.CollectionRecord, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	var items []model.CollectionRecord
	var total int64
	q := s.db.Model(&model.CollectionRecord{}).Where("enterprise_id=?", id)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}
