package service

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type EnterpriseSkillService struct {
	matrixRepo repository.EnterpriseSkillMatrixRepository
}

func NewEnterpriseSkillService(matrixRepo repository.EnterpriseSkillMatrixRepository) *EnterpriseSkillService {
	return &EnterpriseSkillService{matrixRepo: matrixRepo}
}

func (s *EnterpriseSkillService) ConfigureSkill(enterpriseID, skillName string, isEnabled bool, customOpening string, customParams string) error {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return err
	}
	if skillName == "" {
		return fmt.Errorf("skill_name is required")
	}

	matrix := &model.EnterpriseSkillMatrix{
		EnterpriseID:         eid.String(),
		SkillName:            skillName,
		IsEnabled:            isEnabled,
		CustomOpeningMessage: customOpening,
		CustomParams:         customParams,
	}
	return s.matrixRepo.Upsert(matrix)
}

func (s *EnterpriseSkillService) ListSkillMatrix(enterpriseID string) ([]model.EnterpriseSkillMatrix, error) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, err
	}
	return s.matrixRepo.ListByEnterprise(eid)
}

func (s *EnterpriseSkillService) DisableSkill(enterpriseID, skillName string) error {
	return s.ConfigureSkill(enterpriseID, skillName, false, "", "")
}

func (s *EnterpriseSkillService) GetDisabledSkills(enterpriseID string) (map[string]bool, error) {
	matrices, err := s.ListSkillMatrix(enterpriseID)
	if err != nil {
		return nil, err
	}
	disabled := make(map[string]bool)
	for _, m := range matrices {
		if !m.IsEnabled {
			disabled[m.SkillName] = true
		}
	}
	return disabled, nil
}

func (s *EnterpriseSkillService) ApplyMatrixToSkills(enterpriseID string, skills []model.Skill) []model.Skill {
	matrices, err := s.ListSkillMatrix(enterpriseID)
	if err != nil {
		return skills
	}

	matrixMap := make(map[string]model.EnterpriseSkillMatrix)
	for _, m := range matrices {
		matrixMap[m.SkillName] = m
	}

	var filtered []model.Skill
	for _, sk := range skills {
		m, ok := matrixMap[sk.Name]
		if ok {
			if !m.IsEnabled {
				continue
			}
			if m.CustomOpeningMessage != "" {
				sk.OpeningMessage = m.CustomOpeningMessage
			}
		}
		filtered = append(filtered, sk)
	}
	return filtered
}
