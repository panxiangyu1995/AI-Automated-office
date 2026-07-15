package service

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type CollectionService struct {
	repo repository.CollectionRepository
}

func NewCollectionService(repo repository.CollectionRepository) *CollectionService {
	return &CollectionService{repo}
}

func (s *CollectionService) Create(eid, customerID, receivableID string, contractID, salesOrderID *string, amount float64, method, collectedAt, notes string) (*model.CollectionRecord, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	r := &model.CollectionRecord{
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
	r.CollectionNo = fmt.Sprintf("COL-%s", uuid.New().String()[:8])

	result, dbErr := s.repo.CreateWithTx(r, contractID, salesOrderID, receivableID, amount, id)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建回款记录失败")
	}
	return result, nil
}

func (s *CollectionService) Get(id, enterpriseID string) (*model.CollectionRecord, *apperrors.AppError) {
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
		return nil, apperrors.ErrInternal.WithDetail("查询回款记录失败")
	}
	if r == nil {
		return nil, apperrors.ErrNotFound.WithDetail("回款记录不存在")
	}
	return r, nil
}

func (s *CollectionService) List(eid string, page, pageSize int) ([]model.CollectionRecord, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	items, total, dbErr := s.repo.List(id, page, pageSize)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return items, total, nil
}
