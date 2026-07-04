package repository

import (
	"github.com/google/uuid"
	"github.com/ai-office/api/internal/model"
)

type SupplierRepository interface {
	Create(s *model.Supplier) error; Update(s *model.Supplier) error; Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Supplier, error)
	ListByEnterprise(eid uuid.UUID, p, ps int) ([]model.Supplier, int64, error)
}
