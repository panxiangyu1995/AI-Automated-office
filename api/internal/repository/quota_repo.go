package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ApiQuotaRepository interface {
	FindByEnterprise(enterpriseID uuid.UUID) (*model.ApiQuota, error)
	Create(quota *model.ApiQuota) error
	Update(quota *model.ApiQuota) error
	Upsert(quota *model.ApiQuota) error
}

type FeatureFlagRepository interface {
	FindByEnterprise(enterpriseID uuid.UUID) ([]model.FeatureFlag, error)
	Find(enterpriseID uuid.UUID, featureKey string) (*model.FeatureFlag, error)
	Create(flag *model.FeatureFlag) error
	Update(flag *model.FeatureFlag) error
	Delete(id uuid.UUID) error
	InitDefaults(enterpriseID uuid.UUID) error
}
