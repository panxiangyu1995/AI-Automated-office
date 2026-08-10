package repository

import (
	"time"
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

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *apiQuotaRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *apiQuotaRepo) FindByEnterprise(enterpriseID uuid.UUID) (*model.ApiQuota, error) {
	var quota model.ApiQuota
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).First(&quota).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &quota, nil
}

func (r *apiQuotaRepo) Create(quota *model.ApiQuota) error {
	return r.fresh().Create(quota).Error
}

func (r *apiQuotaRepo) Update(quota *model.ApiQuota) error {
	return r.fresh().Model(&model.ApiQuota{}).
		Where("id = ?", quota.ID).
		Updates(map[string]interface{}{
			"daily_limit":      quota.DailyLimit,
			"monthly_limit":    quota.MonthlyLimit,
			"daily_used":       quota.DailyUsed,
			"monthly_used":     quota.MonthlyUsed,
			"daily_reset_at":   quota.DailyResetAt,
			"monthly_reset_at": quota.MonthlyResetAt,
			"updated_at":       time.Now(),
		}).Error
}

func (r *apiQuotaRepo) Upsert(quota *model.ApiQuota) error {
	return r.fresh().Where("enterprise_id = ?", quota.EnterpriseID).FirstOrCreate(quota).Error
}

type featureFlagRepo struct {
	db *gorm.DB
}

func NewFeatureFlagRepository(db *gorm.DB) FeatureFlagRepository {
	return &featureFlagRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *featureFlagRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *featureFlagRepo) FindByEnterprise(enterpriseID uuid.UUID) ([]model.FeatureFlag, error) {
	var flags []model.FeatureFlag
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).Find(&flags).Error
	return flags, err
}

func (r *featureFlagRepo) Find(enterpriseID uuid.UUID, featureKey string) (*model.FeatureFlag, error) {
	var flag model.FeatureFlag
	err := r.fresh().Where("enterprise_id = ? AND feature_key = ?", enterpriseID, featureKey).First(&flag).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &flag, nil
}

func (r *featureFlagRepo) Create(flag *model.FeatureFlag) error {
	return r.fresh().Create(flag).Error
}

func (r *featureFlagRepo) Update(flag *model.FeatureFlag) error {
	return r.fresh().Model(&model.FeatureFlag{}).
		Where("id = ?", flag.ID).
		Updates(map[string]interface{}{
			"enabled":    flag.Enabled,
			"label":      flag.Label,
			"updated_at": time.Now(),
		}).Error
}

func (r *featureFlagRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.FeatureFlag{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *featureFlagRepo) InitDefaults(enterpriseID uuid.UUID) error {
	for _, key := range model.DefaultFeatureKeys {
		flag := &model.FeatureFlag{
			FeatureKey: key,
			Enabled:    true,
			Label:      fmt.Sprintf("%s module", key),
		}
		flag.EnterpriseID = enterpriseID
		if err := r.fresh().Create(flag).Error; err != nil {
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

	if err := r.fresh().Model(&model.FeatureFlag{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.fresh().Find(&flags).Error; err != nil {
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
