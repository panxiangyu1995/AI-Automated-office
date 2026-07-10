package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type CustomerRepository interface {
	Create(customer *model.Customer) error
	Update(customer *model.Customer) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Customer, error)
	FindByName(enterpriseID uuid.UUID, name string) (*model.Customer, error)
	List(enterpriseID uuid.UUID, page, pageSize int) ([]model.Customer, int64, error)
}
