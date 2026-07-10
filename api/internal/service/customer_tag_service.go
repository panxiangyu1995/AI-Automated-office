package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type CustomerTagService struct {
	tagRepo      repository.CustomerTagRepository
	customerRepo repository.CustomerRepository
}

func NewCustomerTagService(tagRepo repository.CustomerTagRepository, customerRepo repository.CustomerRepository) *CustomerTagService {
	return &CustomerTagService{tagRepo: tagRepo, customerRepo: customerRepo}
}

func (s *CustomerTagService) AddTag(enterpriseID, customerID, tag string) (*model.CustomerTag, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}
	if tag == "" {
		return nil, apperrors.NewValidationError("tag", "标签不能为空")
	}

	customer, _ := s.customerRepo.FindByID(cid)
	if customer == nil {
		return nil, apperrors.ErrNotFound.WithDetail("客户不存在")
	}

	ct := &model.CustomerTag{
		CustomerID: cid,
		Tag:        tag,
	}
	ct.EnterpriseID = eid

	if err := s.tagRepo.Create(ct); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("添加标签失败: " + err.Error())
	}
	return ct, nil
}

func (s *CustomerTagService) RemoveTag(customerID, tag string) *apperrors.AppError {
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return apperrors.NewValidationError("customer_id", "客户ID无效")
	}
	if tag == "" {
		return apperrors.NewValidationError("tag", "标签不能为空")
	}

	if err := s.tagRepo.DeleteByCustomerAndTag(cid, tag); err != nil {
		return apperrors.ErrInternal.WithDetail("删除标签失败: " + err.Error())
	}
	return nil
}

func (s *CustomerTagService) ListByCustomer(customerID string) ([]model.CustomerTag, *apperrors.AppError) {
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}

	tags, err := s.tagRepo.ListByCustomer(cid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询标签失败: " + err.Error())
	}
	return tags, nil
}

func (s *CustomerTagService) ListByEnterprise(enterpriseID string) ([]string, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	tags, err := s.tagRepo.ListByEnterprise(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询标签失败: " + err.Error())
	}

	unique := make(map[string]bool)
	result := make([]string, 0)
	for _, t := range tags {
		if !unique[t.Tag] {
			unique[t.Tag] = true
			result = append(result, t.Tag)
		}
	}
	return result, nil
}
