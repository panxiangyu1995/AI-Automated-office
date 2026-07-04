package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type OpportunityRepository interface {
	Create(op *model.Opportunity) error
	Update(op *model.Opportunity) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Opportunity, error)
	ListByCustomer(customerID uuid.UUID) ([]model.Opportunity, int64, error)
}
