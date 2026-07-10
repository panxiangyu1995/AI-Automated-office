package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type CustomerLevelRepository interface {
	Create(level *model.CustomerLevel) error
	Update(level *model.CustomerLevel) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.CustomerLevel, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomerLevel, error)
}
