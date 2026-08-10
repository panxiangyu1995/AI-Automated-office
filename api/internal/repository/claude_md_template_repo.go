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

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *claudeMDTemplateRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *claudeMDTemplateRepo) Create(tpl *model.ClaudeMDTemplate) error {
	return r.fresh().Create(tpl).Error
}

func (r *claudeMDTemplateRepo) List() ([]model.ClaudeMDTemplate, error) {
	var tpls []model.ClaudeMDTemplate
	err := r.fresh().Find(&tpls).Error
	return tpls, err
}

func (r *claudeMDTemplateRepo) FindByID(id string) (*model.ClaudeMDTemplate, error) {
	var tpl model.ClaudeMDTemplate
	err := r.fresh().Where("id = ?", id).First(&tpl).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &tpl, nil
}
