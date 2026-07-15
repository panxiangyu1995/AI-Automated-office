package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type CustomerLevelRepository interface {
	Create(level *model.CustomerLevel) error
	Update(level *model.CustomerLevel) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.CustomerLevel, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomerLevel, error)
}
