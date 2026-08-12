package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
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

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *skillRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *skillRepo) Create(skill *model.Skill) error {
	return r.fresh().Create(skill).Error
}

func (r *skillRepo) FindByName(name string) (*model.Skill, error) {
	var s model.Skill
	err := r.fresh().Where("name = ?", name).First(&s).Error
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
	err := r.fresh().Where("enterprise_id = ? AND is_active = ?", enterpriseID, true).Find(&skills).Error
	return skills, err
}

func (r *skillRepo) GetRoleOpenings(skillID uuid.UUID) ([]model.SkillRoleOpening, error) {
	var openings []model.SkillRoleOpening
	err := r.fresh().Where("skill_id = ?", skillID).Find(&openings).Error
	return openings, err
}

func (r *skillRepo) GetParameters(skillID uuid.UUID) ([]model.SkillParameter, error) {
	var params []model.SkillParameter
	err := r.fresh().Where("skill_id = ?", skillID).Find(&params).Error
	return params, err
}

func (r *skillRepo) CreateRoleOpening(opening *model.SkillRoleOpening) error {
	return r.fresh().Create(opening).Error
}

func (r *skillRepo) CreateParameter(param *model.SkillParameter) error {
	return r.fresh().Create(param).Error
}
