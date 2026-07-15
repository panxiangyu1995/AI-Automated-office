package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type MaterialRepository interface {
	Create(m *model.Material) error
	Update(m *model.Material) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Material, error)
	ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Material, int64, error)
	DeleteByID(id, enterpriseID uuid.UUID) (int64, error)
}
