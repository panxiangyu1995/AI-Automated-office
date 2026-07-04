package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type PositionRepository interface {
	Create(position *model.Position) error
	Update(position *model.Position) error
	FindByID(id uuid.UUID) (*model.Position, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.Position, error)
}
