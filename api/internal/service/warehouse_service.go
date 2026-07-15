package service

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type WarehouseService struct{ repo repository.WarehouseRepository }

func NewWarehouseService(repo repository.WarehouseRepository) *WarehouseService { return &WarehouseService{repo} }

func (s *WarehouseService) Create(eid, name, code, addr string) (*model.Warehouse, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	if name == "" { return nil, apperrors.NewValidationError("name", "仓库名称不能为空") }
	if code == "" { return nil, apperrors.NewValidationError("code", "仓库编码不能为空") }
	w := &model.Warehouse{Name: name, Code: code, Address: addr, Status: "active"}; w.EnterpriseID = id
	if err := s.repo.Create(w); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建仓库失败: "+err.Error()) }
	return w, nil
}

func (s *WarehouseService) Update(enterpriseID, wID, name, code, addr, status string) (*model.Warehouse, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	id, err := uuid.Parse(wID); if err != nil { return nil, apperrors.NewValidationError("warehouse_id", "仓库ID无效") }
	w, err := s.repo.FindByID(id, eid); if err != nil { return nil, apperrors.ErrInternal.WithDetail("查询仓库失败") }
	if w == nil { return nil, apperrors.ErrNotFound.WithDetail("仓库不存在") }
	if name != "" { w.Name = name }; if code != "" { w.Code = code }; if addr != "" { w.Address = addr }; if status != "" { w.Status = status }
	if err := s.repo.Update(w); err != nil { return nil, apperrors.ErrInternal.WithDetail("更新仓库失败: "+err.Error()) }
	return w, nil
}

func (s *WarehouseService) Delete(enterpriseID, wID string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID); if err != nil { return apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	id, err := uuid.Parse(wID); if err != nil { return apperrors.NewValidationError("warehouse_id", "仓库ID无效") }
	w, err := s.repo.FindByID(id, eid); if err != nil { return apperrors.ErrInternal.WithDetail("查询仓库失败") }
	if w == nil { return apperrors.ErrNotFound.WithDetail("仓库不存在") }
	if err := s.repo.Delete(id, eid); err != nil { return apperrors.ErrInternal.WithDetail("删除仓库失败: "+err.Error()) }
	return nil
}

func (s *WarehouseService) Get(enterpriseID, wID string) (*model.Warehouse, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	id, err := uuid.Parse(wID); if err != nil { return nil, apperrors.NewValidationError("warehouse_id", "仓库ID无效") }
	w, err := s.repo.FindByID(id, eid); if err != nil { return nil, apperrors.ErrInternal.WithDetail("查询仓库失败") }
	if w == nil { return nil, apperrors.ErrNotFound.WithDetail("仓库不存在") }
	return w, nil
}

func (s *WarehouseService) List(eid string, p, ps int) ([]model.Warehouse, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "企业ID无效") }
	items, total, err := s.repo.ListByEnterprise(id, p, ps)
	if err != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询仓库列表失败: "+err.Error()) }
	return items, total, nil
}
