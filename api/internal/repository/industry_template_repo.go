package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type IndustryTemplateRepository interface {
	Create(tpl *model.IndustryTemplate) error
	FindByID(id uuid.UUID) (*model.IndustryTemplate, error)
	List(page, pageSize int) ([]model.IndustryTemplate, int64, error)
}

type industryTemplateRepo struct {
	db *gorm.DB
}

func NewIndustryTemplateRepository(db *gorm.DB) IndustryTemplateRepository {
	return &industryTemplateRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *industryTemplateRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *industryTemplateRepo) Create(tpl *model.IndustryTemplate) error {
	return r.fresh().Create(tpl).Error
}

func (r *industryTemplateRepo) FindByID(id uuid.UUID) (*model.IndustryTemplate, error) {
	var tpl model.IndustryTemplate
	err := r.fresh().Where("id = ?", id).First(&tpl).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &tpl, nil
}

func (r *industryTemplateRepo) List(page, pageSize int) ([]model.IndustryTemplate, int64, error) {
	var tpls []model.IndustryTemplate
	var total int64

	q := r.fresh().Model(&model.IndustryTemplate{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&tpls).Error; err != nil {
		return nil, 0, err
	}

	return tpls, total, nil
}
