package service

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type PricingService struct {
	repo repository.MaterialPriceRepository
}

func NewPricingService(repo repository.MaterialPriceRepository) *PricingService {
	return &PricingService{repo}
}

func (s *PricingService) SetPrice(eid, matID, level string, price float64) (*model.MaterialPrice, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	mid, err := uuid.Parse(matID)
	if err != nil {
		return nil, apperrors.NewValidationError("material_id", "无效")
	}
	if level == "" {
		return nil, apperrors.NewValidationError("level", "客户级别不能为空")
	}
	if price <= 0 {
		return nil, apperrors.NewValidationError("unit_price", "价格必须大于0")
	}
	p := &model.MaterialPrice{MaterialID: mid.String(), Level: level, UnitPrice: price}
	p.EnterpriseID = id
	if err := s.repo.Upsert(p); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("设置价格失败: " + err.Error())
	}
	return p, nil
}

func (s *PricingService) ListByMaterial(matID string) ([]model.MaterialPrice, *apperrors.AppError) {
	items, err := s.repo.ListByMaterial(matID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询价格失败: " + err.Error())
	}
	return items, nil
}
