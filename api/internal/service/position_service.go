package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type PositionService struct {
	positionRepo repository.PositionRepository
}

func NewPositionService(positionRepo repository.PositionRepository) *PositionService {
	return &PositionService{positionRepo: positionRepo}
}

func (s *PositionService) Create(enterpriseID, departmentID, name, description string) (*model.Position, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if name == "" {
		return nil, apperrors.NewValidationError("name", "岗位名称不能为空")
	}

	position := &model.Position{
		Name:        name,
		Description: description,
	}
	position.EnterpriseID = eid

	if departmentID != "" {
		did, err := uuid.Parse(departmentID)
		if err != nil {
			return nil, apperrors.NewValidationError("department_id", "部门ID无效")
		}
		didStr := did.String()
		position.DepartmentID = &didStr
	}

	if err := s.positionRepo.Create(position); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建岗位失败: " + err.Error())
	}
	return position, nil
}

func (s *PositionService) Update(positionID, name, description string) (*model.Position, *apperrors.AppError) {
	pid, err := uuid.Parse(positionID)
	if err != nil {
		return nil, apperrors.NewValidationError("position_id", "岗位ID无效")
	}

	position, err := s.positionRepo.FindByID(pid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询岗位失败")
	}
	if position == nil {
		return nil, apperrors.ErrNotFound.WithDetail("岗位不存在")
	}

	if name != "" {
		position.Name = name
	}
	if description != "" {
		position.Description = description
	}

	if err := s.positionRepo.Update(position); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新岗位失败: " + err.Error())
	}
	return position, nil
}

func (s *PositionService) List(enterpriseID string) ([]model.Position, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	positions, err := s.positionRepo.ListByEnterprise(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询岗位列表失败: " + err.Error())
	}
	return positions, nil
}
