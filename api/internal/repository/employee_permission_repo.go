package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type EmployeePermissionRepository interface {
	Create(perm *model.EmployeePermission) error
	Delete(id uuid.UUID) error
	DeleteByEmployeeAndPermission(employeeID uuid.UUID, permission string) error
	ListByEmployee(employeeID uuid.UUID) ([]model.EmployeePermission, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.EmployeePermission, error)
}
