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

func (r *industryTemplateRepo) Create(tpl *model.IndustryTemplate) error {
	return r.db.Create(tpl).Error
}

func (r *industryTemplateRepo) FindByID(id uuid.UUID) (*model.IndustryTemplate, error) {
	var tpl model.IndustryTemplate
	err := r.db.Where("id = ?", id).First(&tpl).Error
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

	q := r.db.Model(&model.IndustryTemplate{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := q.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&tpls).Error; err != nil {
		return nil, 0, err
	}

	return tpls, total, nil
}
