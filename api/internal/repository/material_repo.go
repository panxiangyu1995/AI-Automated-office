package repository

import (
	"github.com/google/uuid"
	"github.com/ai-office/api/internal/model"
)

type MaterialRepository interface {
	Create(m *model.Material) error
	Update(m *model.Material) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.Material, error)
	ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Material, int64, error)
}
