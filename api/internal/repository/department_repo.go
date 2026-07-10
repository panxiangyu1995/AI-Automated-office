package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type DepartmentRepository interface {
	Create(department *model.Department) error
	Update(department *model.Department) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Department, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.Department, error)
	CountByParent(parentID uuid.UUID) (int64, error)
	CountByEnterprise(enterpriseID uuid.UUID) (int64, error)
}
