package service

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type TemplateService struct {
	templateRepo repository.IndustryTemplateRepository
	skillRepo    repository.SkillRepository
}

func NewTemplateService(templateRepo repository.IndustryTemplateRepository, skillRepo repository.SkillRepository) *TemplateService {
	return &TemplateService{templateRepo: templateRepo, skillRepo: skillRepo}
}

func (s *TemplateService) CreateTemplate(tpl *model.IndustryTemplate) error {
	if tpl.Name == "" {
		return fmt.Errorf("name is required")
	}
	if tpl.Industry == "" {
		return fmt.Errorf("industry is required")
	}
	return s.templateRepo.Create(tpl)
}

func (s *TemplateService) ListTemplates(page, pageSize int) ([]model.IndustryTemplate, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	return s.templateRepo.List(page, pageSize)
}

func (s *TemplateService) GetTemplate(id uuid.UUID) (*model.IndustryTemplate, error) {
	tpl, err := s.templateRepo.FindByID(id)
	if err != nil {
		return nil, err
	}
	if tpl == nil {
		return nil, fmt.Errorf("template not found")
	}
	return tpl, nil
}

func (s *TemplateService) ApplyTemplate(templateID, enterpriseID string) error {
	tid, err := uuid.Parse(templateID)
	if err != nil {
		return fmt.Errorf("invalid template ID")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return fmt.Errorf("invalid enterprise ID")
	}

	tpl, err := s.templateRepo.FindByID(tid)
	if err != nil {
		return err
	}
	if tpl == nil {
		return fmt.Errorf("template not found")
	}

	if tpl.PresetSkills != "" {
		var skills []map[string]interface{}
		if err := json.Unmarshal([]byte(tpl.PresetSkills), &skills); err == nil {
			for _, sk := range skills {
				name, _ := sk["name"].(string)
				desc, _ := sk["description"].(string)
				cat, _ := sk["category"].(string)
				endpoint, _ := sk["api_endpoint"].(string)
				if name == "" {
					continue
				}
				existing, _ := s.skillRepo.FindByName(name)
				if existing != nil {
					continue
				}
				skill := &model.Skill{
					Name:        name,
					Description: desc,
					Category:    cat,
					APIEndpoint: endpoint,
					Method:      "POST",
					IsActive:    true,
				}
				skill.EnterpriseID = eid
				if createErr := s.skillRepo.Create(skill); createErr != nil {
					return fmt.Errorf("创建Skill %s 失败: %w", name, createErr)
				}
			}
		}
	}

	return nil
}

func (s *TemplateService) CreateFromEnterprise(enterpriseID string) (*model.IndustryTemplate, *apperrors.AppError) {
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "企业ID无效")
	}

	skills, err := s.skillRepo.ListByEnterprise(eid)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询企业Skill失败")
	}

	presetSkills := make([]map[string]interface{}, 0, len(skills))
	for _, sk := range skills {
		presetSkills = append(presetSkills, map[string]interface{}{
			"name":         sk.Name,
			"description":  sk.Description,
			"category":     sk.Category,
			"api_endpoint": sk.APIEndpoint,
		})
	}

	skillsJSON, _ := json.Marshal(presetSkills)

	tpl := &model.IndustryTemplate{
		Name:         "Enterprise " + enterpriseID[:8] + " Template",
		Industry:     "custom",
		PresetSkills: string(skillsJSON),
	}

	if err := s.templateRepo.Create(tpl); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建模板失败")
	}

	return tpl, nil
}
