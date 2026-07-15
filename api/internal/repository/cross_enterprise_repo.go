package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type CrossEnterpriseRepository interface {
	Create(perm *model.CrossEnterprisePermission) error
	Update(perm *model.CrossEnterprisePermission) error
	Delete(id, enterpriseID uuid.UUID) error
	FindByID(id, enterpriseID uuid.UUID) (*model.CrossEnterprisePermission, error)
	FindByUserAndTarget(userID, targetEnterpriseID uuid.UUID) (*model.CrossEnterprisePermission, error)
	ListByUser(userID uuid.UUID) ([]model.CrossEnterprisePermission, error)
	ListBySource(sourceEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error)
	ListByTarget(targetEnterpriseID uuid.UUID) ([]model.CrossEnterprisePermission, error)
}
