package repository

import (
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ClaudeMDTemplateRepository interface {
	Create(tpl *model.ClaudeMDTemplate) error
	List() ([]model.ClaudeMDTemplate, error)
	FindByID(id string) (*model.ClaudeMDTemplate, error)
}

type claudeMDTemplateRepo struct {
	db *gorm.DB
}

func NewClaudeMDTemplateRepository(db *gorm.DB) ClaudeMDTemplateRepository {
	return &claudeMDTemplateRepo{db: db}
}

func (r *claudeMDTemplateRepo) Create(tpl *model.ClaudeMDTemplate) error {
	return r.db.Create(tpl).Error
}

func (r *claudeMDTemplateRepo) List() ([]model.ClaudeMDTemplate, error) {
	var tpls []model.ClaudeMDTemplate
	err := r.db.Find(&tpls).Error
	return tpls, err
}

func (r *claudeMDTemplateRepo) FindByID(id string) (*model.ClaudeMDTemplate, error) {
	var tpl model.ClaudeMDTemplate
	err := r.db.Where("id = ?", id).First(&tpl).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &tpl, nil
}
