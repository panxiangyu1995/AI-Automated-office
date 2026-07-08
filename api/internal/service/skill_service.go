package service

import (
	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type SkillService struct {
	repo repository.SkillRepository
}

func NewSkillService(repo repository.SkillRepository) *SkillService {
	return &SkillService{repo: repo}
}

func (s *SkillService) ListSkills(enterpriseID uuid.UUID) ([]model.Skill, *apperrors.AppError) {
	skills, err := s.repo.ListByEnterprise(enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询Skill列表失败")
	}
	return skills, nil
}

func (s *SkillService) GetSkillDetail(name string, role string) (*SkillDetailResponse, *apperrors.AppError) {
	skill, err := s.repo.FindByName(name)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询Skill失败")
	}
	if skill == nil {
		return nil, apperrors.ErrNotFound.WithDetail("Skill不存在")
	}

	openings, _ := s.repo.GetRoleOpenings(skill.ID)
	params, _ := s.repo.GetParameters(skill.ID)

	var roleOpening *model.SkillRoleOpening
	for _, o := range openings {
		if o.Role == role {
			roleOpening = &o
			break
		}
	}

	return &SkillDetailResponse{
		Skill:        skill,
		RoleOpening:  roleOpening,
		Parameters:   params,
	}, nil
}

func (s *SkillService) CreateSkill(skill *model.Skill) *apperrors.AppError {
	if skill.Name == "" {
		return apperrors.NewValidationError("name", "Skill名称不能为空")
	}
	if err := s.repo.Create(skill); err != nil {
		return apperrors.ErrInternal.WithDetail("创建Skill失败")
	}
	return nil
}

type SkillDetailResponse struct {
	Skill       *model.Skill            `json:"skill"`
	RoleOpening *model.SkillRoleOpening `json:"role_opening,omitempty"`
	Parameters  []model.SkillParameter  `json:"parameters"`
}
