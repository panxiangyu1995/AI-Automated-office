package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type RestoreService struct{ repo repository.RestoreRepository }

func NewRestoreService(repo repository.RestoreRepository) *RestoreService {
	return &RestoreService{repo}
}

func (s *RestoreService) Restore(eid, resourceType, id string) *apperrors.AppError {
	eUUID, err := uuid.Parse(eid)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "无效")
	}
	rID, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}

	var tableName string
	switch resourceType {
	case "customers":
		tableName = "customers"
	case "contracts":
		tableName = "contracts"
	case "employees":
		tableName = "employees"
	case "materials":
		tableName = "materials"
	case "suppliers":
		tableName = "suppliers"
	case "service-orders":
		tableName = "service_orders"
	default:
		return apperrors.NewValidationError("resource_type", "不支持的资源类型")
	}

	rowsAffected, dbErr := s.repo.UndeleteByTableAndID(tableName, eUUID, rID)
	if dbErr != nil {
		return apperrors.ErrInternal.WithDetail("恢复失败")
	}
	if rowsAffected == 0 {
		return apperrors.ErrNotFound.WithDetail("资源不存在或未被删除")
	}
	return nil
}
