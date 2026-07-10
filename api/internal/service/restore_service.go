package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type RestoreService struct{ db *gorm.DB }

func NewRestoreService(db *gorm.DB) *RestoreService { return &RestoreService{db} }

func (s *RestoreService) Restore(eid, resourceType, id string) *apperrors.AppError {
	eUUID, err := uuid.Parse(eid)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "无效")
	}
	rID, err := uuid.Parse(id)
	if err != nil {
		return apperrors.NewValidationError("id", "无效")
	}

	switch resourceType {
	case "customers":
		return s.restoreModel(eUUID, "customers", rID)
	case "contracts":
		return s.restoreModel(eUUID, "contracts", rID)
	case "employees":
		return s.restoreModel(eUUID, "employees", rID)
	case "materials":
		return s.restoreModel(eUUID, "materials", rID)
	case "suppliers":
		return s.restoreModel(eUUID, "suppliers", rID)
	case "service-orders":
		return s.restoreModel(eUUID, "service_orders", rID)
	default:
		return apperrors.NewValidationError("resource_type", "不支持的资源类型")
	}
}

func (s *RestoreService) restoreModel(eID uuid.UUID, tableName string, id uuid.UUID) *apperrors.AppError {
	result := s.db.Table(tableName).Where("id = ? AND enterprise_id = ?", id, eID).Update("deleted_at", nil)
	if result.Error != nil {
		return apperrors.ErrInternal.WithDetail("恢复失败")
	}
	if result.RowsAffected == 0 {
		return apperrors.ErrNotFound.WithDetail("资源不存在或未被删除")
	}
	return nil
}
