package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type EmployeeRepository interface {
	Create(employee *model.Employee) error
	Update(employee *model.Employee) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Employee, error)
	FindByEmail(email string, enterpriseID uuid.UUID) (*model.Employee, error)
	List(query model.EmployeeQuery) ([]model.Employee, int64, error)
	CountByDepartment(deptID uuid.UUID) (int64, error)
}
