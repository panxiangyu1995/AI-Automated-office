package service

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type OpportunityService struct {
	oppRepo    repository.OpportunityRepository
	custRepo   repository.CustomerRepository
}

func NewOpportunityService(oppRepo repository.OpportunityRepository, custRepo repository.CustomerRepository) *OpportunityService {
	return &OpportunityService{oppRepo: oppRepo, custRepo: custRepo}
}

func (s *OpportunityService) Create(enterpriseID, customerID, name, description string, amount float64, expectedCloseAt *time.Time) (*model.Opportunity, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "商机名称不能为空")
	}
	cust, _ := s.custRepo.FindByID(cid, eid)
	if cust == nil {
		return nil, apperrors.ErrNotFound.WithDetail("客户不存在")
	}

	op := &model.Opportunity{
		CustomerID:      cid,
		Name:            name,
		Amount:          amount,
		Status:          "跟进中",
		ExpectedCloseAt: expectedCloseAt,
		Description:     description,
	}
	op.EnterpriseID = eid
	if err := s.oppRepo.Create(op); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建商机失败: " + err.Error())
	}
	return op, nil
}

func (s *OpportunityService) Update(enterpriseID, opID, name, status, description string, amount float64, expectedCloseAt *time.Time) (*model.Opportunity, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	oid, err := uuid.Parse(opID)
	if err != nil {
		return nil, apperrors.NewValidationError("opportunity_id", "商机ID无效")
	}
	op, err := s.oppRepo.FindByID(oid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询商机失败")
	}
	if op == nil {
		return nil, apperrors.ErrNotFound.WithDetail("商机不存在")
	}
	if name != "" {
		op.Name = name
	}
	if status != "" {
		validStatuses := map[string]bool{"跟进中": true, "报价中": true, "成交": true, "失败": true}
		if !validStatuses[status] {
			return nil, apperrors.NewValidationError("status", "无效的状态值")
		}
		op.Status = status
	}
	if amount > 0 {
		op.Amount = amount
	}
	if expectedCloseAt != nil {
		op.ExpectedCloseAt = expectedCloseAt
	}
	if description != "" {
		op.Description = description
	}
	if err := s.oppRepo.Update(op); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新商机失败: " + err.Error())
	}
	return op, nil
}

func (s *OpportunityService) Delete(enterpriseID, opID string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	oid, err := uuid.Parse(opID)
	if err != nil {
		return apperrors.NewValidationError("opportunity_id", "商机ID无效")
	}
	op, err := s.oppRepo.FindByID(oid, eid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询商机失败")
	}
	if op == nil {
		return apperrors.ErrNotFound.WithDetail("商机不存在")
	}
	if err := s.oppRepo.Delete(oid, eid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除商机失败: " + err.Error())
	}
	return nil
}

func (s *OpportunityService) GetByID(enterpriseID, opID string) (*model.Opportunity, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	oid, err := uuid.Parse(opID)
	if err != nil {
		return nil, apperrors.NewValidationError("opportunity_id", "商机ID无效")
	}
	op, err := s.oppRepo.FindByID(oid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询商机失败")
	}
	if op == nil {
		return nil, apperrors.ErrNotFound.WithDetail("商机不存在")
	}
	return op, nil
}

func (s *OpportunityService) ListByCustomer(customerID string) ([]model.Opportunity, int64, *apperrors.AppError) {
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("customer_id", "客户ID无效")
	}
	ops, total, err := s.oppRepo.ListByCustomer(cid)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询商机失败: " + err.Error())
	}
	return ops, total, nil
}
