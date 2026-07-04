package service

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type CustomerService struct {
	customerRepo repository.CustomerRepository
}

func NewCustomerService(customerRepo repository.CustomerRepository) *CustomerService {
	return &CustomerService{customerRepo: customerRepo}
}

func (s *CustomerService) Create(enterpriseID, name, industry, creditCode, address, notes string) (*model.Customer, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "客户名称不能为空")
	}

	existing, _ := s.customerRepo.FindByName(eid, name)
	if existing != nil {
		return nil, apperrors.ErrDuplicateEntry.WithDetail("客户名称已存在")
	}

	customer := &model.Customer{
		Name:                   name,
		Industry:               industry,
		UnifiedSocialCreditCode: creditCode,
		Address:                address,
		Notes:                  notes,
		Level:                  "普通",
		Status:                 "active",
	}
	customer.EnterpriseID = eid

	if err := s.customerRepo.Create(customer); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建客户失败: " + err.Error())
	}
	return customer, nil
}

func (s *CustomerService) Update(customerID, name, industry, creditCode, address, notes, level string) (*model.Customer, *apperrors.AppError) {
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}

	customer, err := s.customerRepo.FindByID(cid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询客户失败")
	}
	if customer == nil {
		return nil, apperrors.ErrNotFound.WithDetail("客户不存在")
	}

	if name != "" {
		customer.Name = name
	}
	if industry != "" {
		customer.Industry = industry
	}
	if creditCode != "" {
		customer.UnifiedSocialCreditCode = creditCode
	}
	if address != "" {
		customer.Address = address
	}
	if notes != "" {
		customer.Notes = notes
	}
	if level != "" {
		customer.Level = level
	}

	if err := s.customerRepo.Update(customer); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新客户失败: " + err.Error())
	}
	return customer, nil
}

func (s *CustomerService) Delete(customerID string) *apperrors.AppError {
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return apperrors.NewValidationError("customer_id", "客户ID无效")
	}

	customer, err := s.customerRepo.FindByID(cid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询客户失败")
	}
	if customer == nil {
		return apperrors.ErrNotFound.WithDetail("客户不存在")
	}

	if err := s.customerRepo.Delete(cid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除客户失败: " + err.Error())
	}
	return nil
}

func (s *CustomerService) Get(customerID string) (*model.Customer, *apperrors.AppError) {
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}

	customer, err := s.customerRepo.FindByID(cid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询客户失败")
	}
	if customer == nil {
		return nil, apperrors.ErrNotFound.WithDetail("客户不存在")
	}
	return customer, nil
}

func (s *CustomerService) List(enterpriseID string, page, pageSize int) ([]model.Customer, int64, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	customers, total, err := s.customerRepo.List(eid, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询客户列表失败: " + err.Error())
	}
	return customers, total, nil
}
