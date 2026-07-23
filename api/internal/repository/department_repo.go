package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type DepartmentRepository interface {
	Create(department *model.Department) error
	Update(department *model.Department) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Department, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.Department, error)
	CountByParent(parentID uuid.UUID) (int64, error)
	CountByEnterprise(enterpriseID uuid.UUID) (int64, error)
	UpdateFields(id, enterpriseID string, fields map[string]interface{}) error
	RestoreFields(id, enterpriseID string, fields map[string]interface{}) error
}
