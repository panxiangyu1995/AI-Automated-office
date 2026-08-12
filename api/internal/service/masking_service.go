package service

import (
	"encoding/json"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	"github.com/panxiangyu1995/AI-Automated-office/api/pkg/masking"
)

type MaskingService struct {
	serviceConfigRepo repository.ServiceConfigRepository
}

func NewMaskingService(serviceConfigRepo repository.ServiceConfigRepository) *MaskingService {
	return &MaskingService{serviceConfigRepo: serviceConfigRepo}
}

func (s *MaskingService) GetRules(enterpriseID uuid.UUID) ([]masking.MaskingRule, *apperrors.AppError) {
	config, err := s.serviceConfigRepo.FindByKey(enterpriseID, "masking_rules")
	if err != nil {
		return []masking.MaskingRule{}, nil
	}
	if config == nil {
		return []masking.MaskingRule{}, nil
	}

	var rules []masking.MaskingRule
	if jsonErr := json.Unmarshal([]byte(config.ConfigValue), &rules); jsonErr != nil {
		return []masking.MaskingRule{}, nil
	}
	return rules, nil
}

func (s *MaskingService) SetRules(enterpriseID uuid.UUID, rules []masking.MaskingRule) *apperrors.AppError {
	data, err := json.Marshal(rules)
	if err != nil {
		return apperrors.ErrInternal.WithDetail("序列化脱敏规则失败")
	}

	config, findErr := s.serviceConfigRepo.FindByKey(enterpriseID, "masking_rules")
	if findErr != nil {
		return apperrors.ErrInternal.WithDetail("查询脱敏规则失败")
	}
	if config == nil {
		newConfig := &model.ServiceConfig{
			ConfigKey:   "masking_rules",
			ConfigValue: string(data),
		}
		newConfig.EnterpriseID = enterpriseID
		if createErr := s.serviceConfigRepo.Create(newConfig); createErr != nil {
			return apperrors.ErrInternal.WithDetail("保存脱敏规则失败")
		}
		return nil
	}

	if updateErr := s.serviceConfigRepo.UpdateValue(config.ID, enterpriseID, string(data)); updateErr != nil {
		return apperrors.ErrInternal.WithDetail("更新脱敏规则失败")
	}
	return nil
}

func (s *MaskingService) ApplyMasking(enterpriseID uuid.UUID, data map[string]interface{}) map[string]interface{} {
	rules, appErr := s.GetRules(enterpriseID)
	if appErr != nil || len(rules) == 0 {
		return data
	}

	result := make(map[string]interface{})
	for k, v := range data {
		result[k] = v
	}

	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}
		if val, exists := result[rule.Field]; exists {
			if strVal, ok := val.(string); ok {
				result[rule.Field] = masking.ApplyMask(strVal, rule.Strategy)
			}
		}
	}
	return result
}
