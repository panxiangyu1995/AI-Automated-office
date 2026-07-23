package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type EmployeeRepository interface {
	Create(employee *model.Employee) error
	Update(employee *model.Employee) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Employee, error)
	FindByIDNoEnterprise(id string) (*model.Employee, error)
	FindByEmail(email string, enterpriseID uuid.UUID) (*model.Employee, error)
	List(query model.EmployeeQuery) ([]model.Employee, int64, error)
	CountByDepartment(deptID uuid.UUID) (int64, error)
	CountByEnterprise(enterpriseID uuid.UUID) (int64, error)
	CountActiveByEnterprise(enterpriseID uuid.UUID) (int64, error)
	UpdateFields(id, enterpriseID string, fields map[string]interface{}) error
	RestoreFields(id, enterpriseID string, fields map[string]interface{}) error
}
