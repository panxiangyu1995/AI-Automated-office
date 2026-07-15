package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ContactRepository interface {
	Create(contact *model.Contact) error
	Update(contact *model.Contact) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Contact, error)
	ListByCustomer(customerID uuid.UUID) ([]model.Contact, error)
	ListByCustomerAndRole(customerID uuid.UUID, role string) ([]model.Contact, error)
	DeleteByID(id, enterpriseID uuid.UUID) (int64, error)
}
