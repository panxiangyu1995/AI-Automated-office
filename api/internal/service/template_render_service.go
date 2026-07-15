package service

import (
	"fmt"
	"strings"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type TemplateRenderService struct {
	claudeMDRepo repository.ClaudeMDTemplateRepository
}

func NewTemplateRenderService(claudeMDRepo repository.ClaudeMDTemplateRepository) *TemplateRenderService {
	return &TemplateRenderService{claudeMDRepo: claudeMDRepo}
}

func (s *TemplateRenderService) RenderClaudeMD(templateID, enterpriseID string) (string, error) {
	tpl, err := s.claudeMDRepo.FindByID(templateID)
	if err != nil {
		return "", err
	}
	if tpl == nil {
		return "", fmt.Errorf("template not found")
	}

	content := tpl.Content
	content = strings.ReplaceAll(content, "{{.EnterpriseID}}", enterpriseID)
	content = strings.ReplaceAll(content, "{{.APIEndpoint}}", "http://localhost:8080")

	return content, nil
}

func (s *TemplateRenderService) ListTemplates() ([]model.ClaudeMDTemplate, error) {
	return s.claudeMDRepo.List()
}

func (s *TemplateRenderService) CreateTemplate(tpl *model.ClaudeMDTemplate) error {
	if tpl.Name == "" {
		return fmt.Errorf("name is required")
	}
	if tpl.Content == "" {
		return fmt.Errorf("content is required")
	}
	return s.claudeMDRepo.Create(tpl)
}
