package service

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type MaterialService struct {
	matRepo repository.MaterialRepository
}

func NewMaterialService(matRepo repository.MaterialRepository) *MaterialService {
	return &MaterialService{matRepo: matRepo}
}

func (s *MaterialService) Create(enterpriseID, name, skuCode, materialType, spec, unit string, unitPrice float64) (*model.Material, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "物料名称不能为空")
	}
	if skuCode == "" {
		return nil, apperrors.NewValidationError("sku_code", "SKU编码不能为空")
	}
	if unit == "" {
		return nil, apperrors.NewValidationError("unit", "计量单位不能为空")
	}

	typeAliases := map[string]string{
		"finished_product": "成品", "raw_material": "原材料", "component": "零部件",
		"office_supply": "办公用品", "consumable": "耗材",
		"hardware": "硬件", "software": "软件", "service": "服务",
	}
	if alias, ok := typeAliases[materialType]; ok {
		materialType = alias
	}
	validTypes := map[string]bool{"成品": true, "原材料": true, "零部件": true, "办公用品": true, "耗材": true, "硬件": true, "软件": true, "服务": true}
	if !validTypes[materialType] {
		return nil, apperrors.NewValidationError("material_type", "物料类型无效")
	}

	m := &model.Material{Name: name, SKUCode: skuCode, MaterialType: materialType, Spec: spec, Unit: unit, UnitPrice: unitPrice, Status: "active"}
	m.EnterpriseID = eid
	if err := s.matRepo.Create(m); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建物料失败: " + err.Error())
	}
	return m, nil
}

func (s *MaterialService) Update(enterpriseID, matID, name, materialType, spec, unit string, unitPrice float64, status string) (*model.Material, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	mid, err := uuid.Parse(matID)
	if err != nil {
		return nil, apperrors.NewValidationError("material_id", "物料ID无效")
	}
	m, err := s.matRepo.FindByID(mid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询物料失败")
	}
	if m == nil {
		return nil, apperrors.ErrNotFound.WithDetail("物料不存在")
	}
	if name != "" {
		m.Name = name
	}
	if materialType != "" {
		m.MaterialType = materialType
	}
	if spec != "" {
		m.Spec = spec
	}
	if unit != "" {
		m.Unit = unit
	}
	if unitPrice > 0 {
		m.UnitPrice = unitPrice
	}
	if status != "" {
		m.Status = status
	}
	if err := s.matRepo.Update(m); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新物料失败: " + err.Error())
	}
	return m, nil
}

func (s *MaterialService) Delete(enterpriseID, matID string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	mid, err := uuid.Parse(matID)
	if err != nil {
		return apperrors.NewValidationError("material_id", "物料ID无效")
	}
	m, err := s.matRepo.FindByID(mid, eid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询物料失败")
	}
	if m == nil {
		return apperrors.ErrNotFound.WithDetail("物料不存在")
	}
	if err := s.matRepo.Delete(mid, eid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除物料失败: " + err.Error())
	}
	return nil
}

func (s *MaterialService) Get(enterpriseID, matID string) (*model.Material, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	mid, err := uuid.Parse(matID)
	if err != nil {
		return nil, apperrors.NewValidationError("material_id", "物料ID无效")
	}
	m, err := s.matRepo.FindByID(mid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询物料失败")
	}
	if m == nil {
		return nil, apperrors.ErrNotFound.WithDetail("物料不存在")
	}
	return m, nil
}

func (s *MaterialService) List(enterpriseID string, page, pageSize int) ([]model.Material, int64, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	ms, total, err := s.matRepo.ListByEnterprise(eid, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询物料列表失败: " + err.Error())
	}
	return ms, total, nil
}
