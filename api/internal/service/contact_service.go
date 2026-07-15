package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type ContactService struct {
	contactRepo  repository.ContactRepository
	customerRepo repository.CustomerRepository
}

func NewContactService(contactRepo repository.ContactRepository, customerRepo repository.CustomerRepository) *ContactService {
	return &ContactService{contactRepo: contactRepo, customerRepo: customerRepo}
}

func (s *ContactService) Create(enterpriseID, customerID, name, position, phone, email, role string, isPrimary bool, makePrimary bool) (*model.Contact, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "联系人姓名不能为空")
	}

	customer, _ := s.customerRepo.FindByID(cid, eid)
	if customer == nil {
		return nil, apperrors.ErrNotFound.WithDetail("客户不存在")
	}

	if makePrimary {
		s.contactRepo.ListByCustomer(cid)
	}

	contact := &model.Contact{
		CustomerID: cid,
		Name:       name,
		Position:   position,
		Phone:      phone,
		Email:      email,
		Role:       role,
		IsPrimary:  isPrimary,
	}
	contact.EnterpriseID = eid

	if err := s.contactRepo.Create(contact); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建联系人失败: " + err.Error())
	}
	return contact, nil
}

func (s *ContactService) Update(enterpriseID, contactID, name, position, phone, email, role string, isPrimary bool) (*model.Contact, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	cid, err := uuid.Parse(contactID)
	if err != nil {
		return nil, apperrors.NewValidationError("contact_id", "联系人ID无效")
	}

	contact, err := s.contactRepo.FindByID(cid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询联系人失败")
	}
	if contact == nil {
		return nil, apperrors.ErrNotFound.WithDetail("联系人不存在")
	}

	if name != "" {
		contact.Name = name
	}
	if position != "" {
		contact.Position = position
	}
	if phone != "" {
		contact.Phone = phone
	}
	if email != "" {
		contact.Email = email
	}
	if role != "" {
		contact.Role = role
	}
	contact.IsPrimary = isPrimary

	if err := s.contactRepo.Update(contact); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新联系人失败: " + err.Error())
	}
	return contact, nil
}

func (s *ContactService) Delete(enterpriseID, contactID string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	cid, err := uuid.Parse(contactID)
	if err != nil {
		return apperrors.NewValidationError("contact_id", "联系人ID无效")
	}
	contact, err := s.contactRepo.FindByID(cid, eid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询联系人失败")
	}
	if contact == nil {
		return apperrors.ErrNotFound.WithDetail("联系人不存在")
	}
	if err := s.contactRepo.Delete(cid, eid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除联系人失败: " + err.Error())
	}
	return nil
}

func (s *ContactService) GetByID(enterpriseID, contactID string) (*model.Contact, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	cid, err := uuid.Parse(contactID)
	if err != nil {
		return nil, apperrors.NewValidationError("contact_id", "联系人ID无效")
	}
	contact, err := s.contactRepo.FindByID(cid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询联系人失败")
	}
	if contact == nil {
		return nil, apperrors.ErrNotFound.WithDetail("联系人不存在")
	}
	return contact, nil
}

func (s *ContactService) ListByCustomer(customerID, role string) ([]model.Contact, *apperrors.AppError) {
	cid, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}

	var contacts []model.Contact
	if role != "" {
		contacts, err = s.contactRepo.ListByCustomerAndRole(cid, role)
	} else {
		contacts, err = s.contactRepo.ListByCustomer(cid)
	}
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询联系人失败: " + err.Error())
	}
	return contacts, nil
}
