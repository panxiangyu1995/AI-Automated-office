package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type InventoryCheckRepository interface {
	Create(check *model.InventoryCheck) error
	FindByID(id uuid.UUID) (*model.InventoryCheck, error)
	Update(check *model.InventoryCheck) error
	ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.InventoryCheck, int64, error)
}
