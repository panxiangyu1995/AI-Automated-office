package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
)

type customerLevelRepo struct {
	db *gorm.DB
}

func NewCustomerLevelRepository(db *gorm.DB) CustomerLevelRepository {
	return &customerLevelRepo{db: db}
}

func (r *customerLevelRepo) Create(level *model.CustomerLevel) error {
	return r.db.Create(level).Error
}

func (r *customerLevelRepo) Update(level *model.CustomerLevel) error {
	return r.db.Save(level).Error
}

func (r *customerLevelRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.CustomerLevel{}, "id = ?", id).Error
}

func (r *customerLevelRepo) FindByID(id uuid.UUID) (*model.CustomerLevel, error) {
	var l model.CustomerLevel
	err := r.db.Where("id = ?", id).First(&l).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &l, nil
}

func (r *customerLevelRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomerLevel, error) {
	var levels []model.CustomerLevel
	err := r.db.Where("enterprise_id = ?", enterpriseID).Order("sort_order ASC, name ASC").Find(&levels).Error
	return levels, err
}
