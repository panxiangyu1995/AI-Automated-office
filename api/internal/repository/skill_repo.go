package repository

import (
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SkillRepository interface {
	Create(skill *model.Skill) error
	FindByName(name string) (*model.Skill, error)
	ListByEnterprise(enterpriseID uuid.UUID) ([]model.Skill, error)
	GetRoleOpenings(skillID uuid.UUID) ([]model.SkillRoleOpening, error)
	GetParameters(skillID uuid.UUID) ([]model.SkillParameter, error)
	CreateRoleOpening(opening *model.SkillRoleOpening) error
	CreateParameter(param *model.SkillParameter) error
}

type skillRepo struct {
	db *gorm.DB
}

func NewSkillRepository(db *gorm.DB) SkillRepository {
	return &skillRepo{db: db}
}

func (r *skillRepo) Create(skill *model.Skill) error {
	return r.db.Create(skill).Error
}

func (r *skillRepo) FindByName(name string) (*model.Skill, error) {
	var s model.Skill
	err := r.db.Where("name = ?", name).First(&s).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func (r *skillRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.Skill, error) {
	var skills []model.Skill
	err := r.db.Where("enterprise_id = ? AND is_active = ?", enterpriseID, true).Find(&skills).Error
	return skills, err
}

func (r *skillRepo) GetRoleOpenings(skillID uuid.UUID) ([]model.SkillRoleOpening, error) {
	var openings []model.SkillRoleOpening
	err := r.db.Where("skill_id = ?", skillID).Find(&openings).Error
	return openings, err
}

func (r *skillRepo) GetParameters(skillID uuid.UUID) ([]model.SkillParameter, error) {
	var params []model.SkillParameter
	err := r.db.Where("skill_id = ?", skillID).Find(&params).Error
	return params, err
}

func (r *skillRepo) CreateRoleOpening(opening *model.SkillRoleOpening) error {
	return r.db.Create(opening).Error
}

func (r *skillRepo) CreateParameter(param *model.SkillParameter) error {
	return r.db.Create(param).Error
}
