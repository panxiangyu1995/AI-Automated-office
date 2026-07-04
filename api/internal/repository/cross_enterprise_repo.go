package repository

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
)

type CrossEnterpriseRepository interface {
	Create(perm *model.CrossEnterprisePermission) error
	Update(perm *model.CrossEnterprisePermission) error
	Delete(id uuid.UUID) error
	FindByID(id uuid.UUID) (*model.CrossEnterprisePermission, error)
	FindByUserAndTarget(userID, targetEnterpriseID uuid.UUID) (*model.CrossEnterprisePermission, error)
	ListByUser(userID uuid.UUID) ([]model.CrossEnterprisePermission, error)
	ListBySource(sourceEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error)
	ListByTarget(targetEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error)
}
