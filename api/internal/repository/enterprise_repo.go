package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type EnterpriseRepository interface {
	Create(enterprise *model.Enterprise) error
	Update(enterprise *model.Enterprise) error
	FindByID(id uuid.UUID) (*model.Enterprise, error)
	FindByCode(code string) (*model.Enterprise, error)
	List(page, pageSize int) ([]model.Enterprise, int64, error)
	ListByGroup(groupID string) ([]model.Enterprise, error)
}
