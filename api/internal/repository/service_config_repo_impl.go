package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type serviceConfigRepo struct {
	db *gorm.DB
}

func NewServiceConfigRepository(db *gorm.DB) ServiceConfigRepository {
	return &serviceConfigRepo{db: db}
}

func (r *serviceConfigRepo) FindByKey(enterpriseID uuid.UUID, key string) (*model.ServiceConfig, error) {
	var config model.ServiceConfig
	if err := r.db.Where("enterprise_id = ? AND config_key = ?", enterpriseID, key).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}

func (r *serviceConfigRepo) Create(config *model.ServiceConfig) error {
	return r.db.Create(config).Error
}

func (r *serviceConfigRepo) UpdateValue(id, enterpriseID uuid.UUID, value string) error {
	return r.db.Model(&model.ServiceConfig{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("config_value", value).Error
}
