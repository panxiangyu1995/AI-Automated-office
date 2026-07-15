package repository

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type apiQuotaRepo struct {
	db *gorm.DB
}

func NewApiQuotaRepository(db *gorm.DB) ApiQuotaRepository {
	return &apiQuotaRepo{db: db}
}

func (r *apiQuotaRepo) FindByEnterprise(enterpriseID uuid.UUID) (*model.ApiQuota, error) {
	var quota model.ApiQuota
	err := r.db.Where("enterprise_id = ?", enterpriseID).First(&quota).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &quota, nil
}

func (r *apiQuotaRepo) Create(quota *model.ApiQuota) error {
	return r.db.Create(quota).Error
}

func (r *apiQuotaRepo) Update(quota *model.ApiQuota) error {
	return r.db.Save(quota).Error
}

func (r *apiQuotaRepo) Upsert(quota *model.ApiQuota) error {
	sql := `INSERT INTO api_quotas (enterprise_id, daily_limit, monthly_limit, daily_used, monthly_used, daily_reset_at, monthly_reset_at, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
		ON CONFLICT (enterprise_id) DO UPDATE SET
			daily_used = EXCLUDED.daily_used,
			monthly_used = EXCLUDED.monthly_used,
			daily_reset_at = EXCLUDED.daily_reset_at,
			monthly_reset_at = EXCLUDED.monthly_reset_at,
			daily_limit = EXCLUDED.daily_limit,
			monthly_limit = EXCLUDED.monthly_limit,
			updated_at = NOW()`
	return r.db.Exec(sql,
		quota.EnterpriseID, quota.DailyLimit, quota.MonthlyLimit,
		quota.DailyUsed, quota.MonthlyUsed,
		quota.DailyResetAt, quota.MonthlyResetAt,
	).Error
}

type featureFlagRepo struct {
	db *gorm.DB
}

func NewFeatureFlagRepository(db *gorm.DB) FeatureFlagRepository {
	return &featureFlagRepo{db: db}
}

func (r *featureFlagRepo) FindByEnterprise(enterpriseID uuid.UUID) ([]model.FeatureFlag, error) {
	var flags []model.FeatureFlag
	err := r.db.Where("enterprise_id = ?", enterpriseID).Find(&flags).Error
	return flags, err
}

func (r *featureFlagRepo) Find(enterpriseID uuid.UUID, featureKey string) (*model.FeatureFlag, error) {
	var flag model.FeatureFlag
	err := r.db.Where("enterprise_id = ? AND feature_key = ?", enterpriseID, featureKey).First(&flag).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &flag, nil
}

func (r *featureFlagRepo) Create(flag *model.FeatureFlag) error {
	return r.db.Create(flag).Error
}

func (r *featureFlagRepo) Update(flag *model.FeatureFlag) error {
	return r.db.Save(flag).Error
}

func (r *featureFlagRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.FeatureFlag{}).Error
}

func (r *featureFlagRepo) InitDefaults(enterpriseID uuid.UUID) error {
	for _, key := range model.DefaultFeatureKeys {
		flag := &model.FeatureFlag{
			FeatureKey: key,
			Enabled:    true,
			Label:      fmt.Sprintf("%s module", key),
		}
		flag.EnterpriseID = enterpriseID
		if err := r.db.Create(flag).Error; err != nil {
			if !isDuplicateError(err) {
				return err
			}
		}
	}
	return nil
}

func (r *featureFlagRepo) List() ([]model.FeatureFlag, int64, error) {
	var flags []model.FeatureFlag
	var total int64

	if err := r.db.Model(&model.FeatureFlag{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.Find(&flags).Error; err != nil {
		return nil, 0, err
	}
	return flags, total, nil
}

func isDuplicateError(err error) bool {
	return err != nil && (isPGDuplicate(err) || isSQLiteDuplicate(err))
}

func isPGDuplicate(err error) bool {
	return err.Error() != "" && contains(err.Error(), "duplicate key")
}

func isSQLiteDuplicate(err error) bool {
	return err.Error() != "" && contains(err.Error(), "UNIQUE constraint")
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
