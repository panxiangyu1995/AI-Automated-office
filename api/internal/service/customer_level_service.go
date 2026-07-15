package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type CustomerLevelService struct {
	levelRepo repository.CustomerLevelRepository
}

func NewCustomerLevelService(levelRepo repository.CustomerLevelRepository) *CustomerLevelService {
	return &CustomerLevelService{levelRepo: levelRepo}
}

func (s *CustomerLevelService) Create(enterpriseID, name, description string, minAmount float64, color string, sortOrder int) (*model.CustomerLevel, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "分级名称不能为空")
	}

	level := &model.CustomerLevel{
		Name:        name,
		Description: description,
		MinAmount:   minAmount,
		Color:       color,
		SortOrder:   sortOrder,
	}
	level.EnterpriseID = eid

	if err := s.levelRepo.Create(level); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建客户分级失败: " + err.Error())
	}
	return level, nil
}

func (s *CustomerLevelService) Update(enterpriseID, levelID, name, description string, minAmount float64, color string, sortOrder int) (*model.CustomerLevel, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	lid, err := uuid.Parse(levelID)
	if err != nil {
		return nil, apperrors.NewValidationError("level_id", "分级ID无效")
	}

	level, err := s.levelRepo.FindByID(lid, eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询分级失败")
	}
	if level == nil {
		return nil, apperrors.ErrNotFound.WithDetail("分级不存在")
	}

	if name != "" {
		level.Name = name
	}
	if description != "" {
		level.Description = description
	}
	if minAmount > 0 {
		level.MinAmount = minAmount
	}
	if color != "" {
		level.Color = color
	}
	level.SortOrder = sortOrder

	if err := s.levelRepo.Update(level); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新分级失败: " + err.Error())
	}
	return level, nil
}

func (s *CustomerLevelService) Delete(enterpriseID, levelID string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	lid, err := uuid.Parse(levelID)
	if err != nil {
		return apperrors.NewValidationError("level_id", "分级ID无效")
	}

	level, err := s.levelRepo.FindByID(lid, eid)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询分级失败")
	}
	if level == nil {
		return apperrors.ErrNotFound.WithDetail("分级不存在")
	}

	if err := s.levelRepo.Delete(lid, eid); err != nil {
		return apperrors.ErrInternal.WithDetail("删除分级失败: " + err.Error())
	}
	return nil
}

func (s *CustomerLevelService) List(enterpriseID string) ([]model.CustomerLevel, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	levels, err := s.levelRepo.ListByEnterprise(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询分级列表失败: " + err.Error())
	}
	return levels, nil
}
