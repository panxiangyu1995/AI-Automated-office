package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type OpportunityRepository interface {
	Create(op *model.Opportunity) error
	Update(op *model.Opportunity) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Opportunity, error)
	ListByCustomer(customerID uuid.UUID) ([]model.Opportunity, int64, error)
}
