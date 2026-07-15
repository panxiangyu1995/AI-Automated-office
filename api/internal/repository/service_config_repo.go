package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ServiceConfigRepository interface {
	FindByKey(enterpriseID uuid.UUID, key string) (*model.ServiceConfig, error)
	Create(config *model.ServiceConfig) error
	UpdateValue(id uuid.UUID, value string) error
}
