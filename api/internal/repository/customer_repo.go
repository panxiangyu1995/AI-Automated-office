package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type CustomerRepository interface {
	Create(customer *model.Customer) error
	Update(customer *model.Customer) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Customer, error)
	FindByName(enterpriseID uuid.UUID, name string) (*model.Customer, error)
	List(enterpriseID uuid.UUID, page, pageSize int) ([]model.Customer, int64, error)
	UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error
	UpdateFieldsByID(id string, fields map[string]interface{}) error
	RestoreFields(id string, fields map[string]interface{}) error
	DeleteByID(id, enterpriseID uuid.UUID) (int64, error)
	UpdateStatus(id, enterpriseID uuid.UUID, status string) error
}
