package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type CustomerTagRepository interface {
	Create(tag *model.CustomerTag) error
	Delete(id uuid.UUID) error
	DeleteByCustomerAndTag(customerID uuid.UUID, tag string) error
	ListByCustomer(customerID uuid.UUID) ([]model.CustomerTag, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomerTag, error)
}
