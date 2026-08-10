package repository

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type customerLevelRepo struct {
	db *gorm.DB
}

func NewCustomerLevelRepository(db *gorm.DB) CustomerLevelRepository {
	return &customerLevelRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *customerLevelRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *customerLevelRepo) Create(level *model.CustomerLevel) error {
	return r.fresh().Create(level).Error
}

func (r *customerLevelRepo) Update(level *model.CustomerLevel) error {
	return r.fresh().Save(level).Error
}

func (r *customerLevelRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.CustomerLevel{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *customerLevelRepo) FindByID(id, enterpriseID uuid.UUID) (*model.CustomerLevel, error) {
	var l model.CustomerLevel
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&l).Error
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
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).Order("sort_order ASC, name ASC").Find(&levels).Error
	return levels, err
}
