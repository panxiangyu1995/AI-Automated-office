package service

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type SupplierService struct{ repo repository.SupplierRepository }

func NewSupplierService(repo repository.SupplierRepository) *SupplierService { return &SupplierService{repo} }

func (s *SupplierService) Create(eid, name, contact, phone, email, addr string) (*model.Supplier, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	if name == "" { return nil, apperrors.NewValidationError("name", "供应商名称不能为空") }
	sup := &model.Supplier{Name: name, ContactName: contact, ContactPhone: phone, ContactEmail: email, Address: addr, Status: "active"}
	sup.EnterpriseID = id
	if err := s.repo.Create(sup); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建供应商失败: "+err.Error()) }
	return sup, nil
}

func (s *SupplierService) Update(supID, name, contact, phone, email, addr, status string) (*model.Supplier, *apperrors.AppError) {
	id, err := uuid.Parse(supID); if err != nil { return nil, apperrors.NewValidationError("supplier_id", "供应商ID无效") }
	sup, err := s.repo.FindByID(id); if err != nil { return nil, apperrors.ErrInternal.WithDetail("查询供应商失败") }
	if sup == nil { return nil, apperrors.ErrNotFound.WithDetail("供应商不存在") }
	if name != "" { sup.Name = name }; if contact != "" { sup.ContactName = contact }
	if phone != "" { sup.ContactPhone = phone }; if email != "" { sup.ContactEmail = email }
	if addr != "" { sup.Address = addr }; if status != "" { sup.Status = status }
	if err := s.repo.Update(sup); err != nil { return nil, apperrors.ErrInternal.WithDetail("更新供应商失败: "+err.Error()) }
	return sup, nil
}

func (s *SupplierService) Delete(supID string) *apperrors.AppError {
	id, err := uuid.Parse(supID); if err != nil { return apperrors.NewValidationError("supplier_id", "供应商ID无效") }
	sup, err := s.repo.FindByID(id); if err != nil { return apperrors.ErrInternal.WithDetail("查询供应商失败") }
	if sup == nil { return apperrors.ErrNotFound.WithDetail("供应商不存在") }
	if err := s.repo.Delete(id); err != nil { return apperrors.ErrInternal.WithDetail("删除供应商失败: "+err.Error()) }
	return nil
}

func (s *SupplierService) Get(supID string) (*model.Supplier, *apperrors.AppError) {
	id, err := uuid.Parse(supID); if err != nil { return nil, apperrors.NewValidationError("supplier_id", "供应商ID无效") }
	sup, err := s.repo.FindByID(id); if err != nil { return nil, apperrors.ErrInternal.WithDetail("查询供应商失败") }
	if sup == nil { return nil, apperrors.ErrNotFound.WithDetail("供应商不存在") }
	return sup, nil
}

func (s *SupplierService) List(eid string, p, ps int) ([]model.Supplier, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	items, total, err := s.repo.ListByEnterprise(id, p, ps)
	if err != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询供应商列表失败: "+err.Error()) }
	return items, total, nil
}
