package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type skillTestRepo struct {
	mock.Mock
}

func (m *skillTestRepo) Create(skill *model.Skill) error {
	args := m.Called(skill)
	return args.Error(0)
}

func (m *skillTestRepo) FindByName(name string) (*model.Skill, error) {
	args := m.Called(name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Skill), args.Error(1)
}

func (m *skillTestRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.Skill, error) {
	args := m.Called(enterpriseID)
	return args.Get(0).([]model.Skill), args.Error(1)
}

func (m *skillTestRepo) GetRoleOpenings(skillID uuid.UUID) ([]model.SkillRoleOpening, error) {
	args := m.Called(skillID)
	return args.Get(0).([]model.SkillRoleOpening), args.Error(1)
}

func (m *skillTestRepo) GetParameters(skillID uuid.UUID) ([]model.SkillParameter, error) {
	args := m.Called(skillID)
	return args.Get(0).([]model.SkillParameter), args.Error(1)
}

func (m *skillTestRepo) CreateRoleOpening(opening *model.SkillRoleOpening) error {
	args := m.Called(opening)
	return args.Error(0)
}

func (m *skillTestRepo) CreateParameter(param *model.SkillParameter) error {
	args := m.Called(param)
	return args.Error(0)
}

func TestGetByRole_ReturnsCorrectRoleOpening(t *testing.T) {
	repo := new(skillTestRepo)
	svc := NewSkillService(repo)

	skillID := uuid.New()
	skill := &model.Skill{
		BaseModel: model.BaseModel{ID: skillID},
		Name:      "hrm_employee_create",
	}

	openings := []model.SkillRoleOpening{
		{SkillID: skillID, Role: "owner", OpeningText: "完整HRM管理权限"},
		{SkillID: skillID, Role: "employee", OpeningText: "查看和编辑自己的档案"},
	}

	repo.On("FindByName", "hrm_employee_create").Return(skill, nil)
	repo.On("GetRoleOpenings", skillID).Return(openings, nil)
	repo.On("GetParameters", skillID).Return([]model.SkillParameter{}, nil)

	result, appErr := svc.GetByRole("hrm_employee_create", "owner")
	assert.Nil(t, appErr)
	assert.NotNil(t, result)
	assert.Equal(t, "owner", result.RoleOpening.Role)
	assert.Equal(t, "完整HRM管理权限", result.RoleOpening.OpeningText)
}

func TestGetByRole_NoRole_ReturnsNilRoleOpening(t *testing.T) {
	repo := new(skillTestRepo)
	svc := NewSkillService(repo)

	skillID := uuid.New()
	skill := &model.Skill{
		BaseModel: model.BaseModel{ID: skillID},
		Name:      "hrm_employee_create",
	}

	openings := []model.SkillRoleOpening{
		{SkillID: skillID, Role: "owner", OpeningText: "完整HRM管理权限"},
	}

	repo.On("FindByName", "hrm_employee_create").Return(skill, nil)
	repo.On("GetRoleOpenings", skillID).Return(openings, nil)
	repo.On("GetParameters", skillID).Return([]model.SkillParameter{}, nil)

	result, appErr := svc.GetByRole("hrm_employee_create", "")
	assert.Nil(t, appErr)
	assert.NotNil(t, result)
	assert.Nil(t, result.RoleOpening)
}

func TestGetByRole_NonexistentSkill_ReturnsError(t *testing.T) {
	repo := new(skillTestRepo)
	svc := NewSkillService(repo)

	repo.On("FindByName", "nonexistent").Return(nil, nil)

	result, appErr := svc.GetByRole("nonexistent", "owner")
	assert.Nil(t, result)
	assert.NotNil(t, appErr)
	assert.Equal(t, apperrors.ErrNotFound.Code, appErr.Code)
}

func TestGetByRole_UnknownRole_ReturnsNilRoleOpening(t *testing.T) {
	repo := new(skillTestRepo)
	svc := NewSkillService(repo)

	skillID := uuid.New()
	skill := &model.Skill{
		BaseModel: model.BaseModel{ID: skillID},
		Name:      "hrm_employee_create",
	}

	openings := []model.SkillRoleOpening{
		{SkillID: skillID, Role: "owner", OpeningText: "完整HRM管理权限"},
	}

	repo.On("FindByName", "hrm_employee_create").Return(skill, nil)
	repo.On("GetRoleOpenings", skillID).Return(openings, nil)
	repo.On("GetParameters", skillID).Return([]model.SkillParameter{}, nil)

	result, appErr := svc.GetByRole("hrm_employee_create", "unknown_role")
	assert.Nil(t, appErr)
	assert.NotNil(t, result)
	assert.Nil(t, result.RoleOpening)
}
