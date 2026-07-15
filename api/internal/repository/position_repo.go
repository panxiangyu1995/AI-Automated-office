package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type PositionRepository interface {
	Create(position *model.Position) error
	Update(position *model.Position) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Position, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.Position, error)
}
