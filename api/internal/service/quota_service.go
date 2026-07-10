package service

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type QuotaService struct {
	quotaRepo  repository.ApiQuotaRepository
	featureRepo repository.FeatureFlagRepository
}

func NewQuotaService(quotaRepo repository.ApiQuotaRepository, featureRepo repository.FeatureFlagRepository) *QuotaService {
	return &QuotaService{
		quotaRepo:   quotaRepo,
		featureRepo: featureRepo,
	}
}

func (s *QuotaService) CheckAndIncrement(enterpriseID uuid.UUID) *apperrors.AppError {
	quota, err := s.quotaRepo.FindByEnterprise(enterpriseID)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询配额失败: " + err.Error())
	}

	now := time.Now().UTC()

	if quota == nil {
		quota = &model.ApiQuota{
			DailyLimit:     10000,
			MonthlyLimit:   300000,
			DailyUsed:      0,
			MonthlyUsed:    0,
			DailyResetAt:   now,
			MonthlyResetAt: now,
		}
		quota.EnterpriseID = enterpriseID
		quota.DailyUsed = 1
		quota.MonthlyUsed = 1
		if err := s.quotaRepo.Create(quota); err != nil {
			return apperrors.ErrInternal.WithDetail("创建配额记录失败: " + err.Error())
		}
		return nil
	}

	s.resetIfNeeded(quota, now)

	if quota.DailyUsed >= quota.DailyLimit {
		return apperrors.ErrQuotaExceeded.WithDetail("当日配额已用完")
	}
	if quota.MonthlyUsed >= quota.MonthlyLimit {
		return apperrors.ErrQuotaExceeded.WithDetail("当月配额已用完")
	}

	quota.DailyUsed++
	quota.MonthlyUsed++

	if err := s.quotaRepo.Update(quota); err != nil {
		return apperrors.ErrInternal.WithDetail("更新配额失败: " + err.Error())
	}

	return nil
}

func (s *QuotaService) resetIfNeeded(quota *model.ApiQuota, now time.Time) {
	if now.Day() != quota.DailyResetAt.Day() || now.Month() != quota.DailyResetAt.Month() || now.Year() != quota.DailyResetAt.Year() {
		quota.DailyUsed = 0
		quota.DailyResetAt = now
	}
	if now.Month() != quota.MonthlyResetAt.Month() || now.Year() != quota.MonthlyResetAt.Year() {
		quota.MonthlyUsed = 0
		quota.MonthlyResetAt = now
	}
}

func (s *QuotaService) GetQuota(enterpriseID uuid.UUID) (*model.ApiQuota, *apperrors.AppError) {
	quota, err := s.quotaRepo.FindByEnterprise(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询配额失败: " + err.Error())
	}
	if quota == nil {
		return nil, apperrors.ErrNotFound.WithDetail("配额记录不存在")
	}
	s.resetIfNeeded(quota, time.Now().UTC())
	return quota, nil
}

func (s *QuotaService) UpdateQuota(enterpriseID uuid.UUID, dailyLimit, monthlyLimit int) (*model.ApiQuota, *apperrors.AppError) {
	quota, err := s.quotaRepo.FindByEnterprise(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询配额失败")
	}
	if quota == nil {
		return nil, apperrors.ErrNotFound.WithDetail("配额记录不存在")
	}
	if dailyLimit > 0 {
		quota.DailyLimit = dailyLimit
	}
	if monthlyLimit > 0 {
		quota.MonthlyLimit = monthlyLimit
	}
	if err := s.quotaRepo.Update(quota); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新配额失败: " + err.Error())
	}
	return quota, nil
}

func (s *QuotaService) InitQuota(enterpriseID uuid.UUID) *apperrors.AppError {
	now := time.Now().UTC()
	quota := &model.ApiQuota{
		DailyLimit:     10000,
		MonthlyLimit:   300000,
		DailyUsed:      0,
		MonthlyUsed:    0,
		DailyResetAt:   now,
		MonthlyResetAt: now,
	}
	quota.EnterpriseID = enterpriseID
	if err := s.quotaRepo.Create(quota); err != nil {
		return apperrors.ErrInternal.WithDetail("初始化配额失败: " + err.Error())
	}
	return nil
}

func (s *QuotaService) CheckFeature(enterpriseID uuid.UUID, featureKey string) *apperrors.AppError {
	flag, err := s.featureRepo.Find(enterpriseID, featureKey)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("查询功能开关失败: " + err.Error())
	}
	if flag == nil {
		return nil
	}
	if !flag.Enabled {
		return apperrors.ErrFeatureDisabled.WithDetail("功能模块 " + featureKey + " 已被禁用")
	}
	return nil
}

func (s *QuotaService) GetFeatureFlags(enterpriseID uuid.UUID) ([]model.FeatureFlag, *apperrors.AppError) {
	flags, err := s.featureRepo.FindByEnterprise(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询功能开关失败: " + err.Error())
	}
	return flags, nil
}

func (s *QuotaService) UpdateFeatureFlag(enterpriseID string, featureKey string, enabled bool) (*model.FeatureFlag, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	flag, err := s.featureRepo.Find(eid, featureKey)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询功能开关失败: " + err.Error())
	}
	if flag == nil {
		flag = &model.FeatureFlag{
			FeatureKey: featureKey,
			Enabled:    enabled,
		}
		flag.EnterpriseID = eid
		if err := s.featureRepo.Create(flag); err != nil {
			return nil, apperrors.ErrInternal.WithDetail("创建功能开关失败: " + err.Error())
		}
		return flag, nil
	}

	flag.Enabled = enabled
	if err := s.featureRepo.Update(flag); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新功能开关失败: " + err.Error())
	}
	return flag, nil
}

func (s *QuotaService) InitFeatureFlags(enterpriseID string) *apperrors.AppError {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}
	if err := s.featureRepo.InitDefaults(eid); err != nil {
		return apperrors.ErrInternal.WithDetail("初始化功能开关失败: " + err.Error())
	}
	return nil
}
