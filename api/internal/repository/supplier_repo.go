package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type SupplierRepository interface {
	Create(s *model.Supplier) error; Update(s *model.Supplier) error; Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Supplier, error)
	ListByEnterprise(eid uuid.UUID, p, ps int) ([]model.Supplier, int64, error)
	DeleteByID(id, enterpriseID uuid.UUID) (int64, error)
}
