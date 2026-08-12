package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type customerTagRepo struct {
	db *gorm.DB
}

func NewCustomerTagRepository(db *gorm.DB) CustomerTagRepository {
	return &customerTagRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *customerTagRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *customerTagRepo) Create(tag *model.CustomerTag) error {
	return r.fresh().Create(tag).Error
}

func (r *customerTagRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.CustomerTag{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *customerTagRepo) DeleteByCustomerAndTag(customerID uuid.UUID, tag string, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.CustomerTag{}).Where("customer_id = ? AND tag = ? AND enterprise_id = ?", customerID, tag, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *customerTagRepo) ListByCustomer(customerID uuid.UUID) ([]model.CustomerTag, error) {
	var tags []model.CustomerTag
	err := r.fresh().Where("customer_id = ?", customerID).Find(&tags).Error
	return tags, err
}

func (r *customerTagRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomerTag, error) {
	var tags []model.CustomerTag
	err := r.fresh().Where("enterprise_id = ?", enterpriseID).Find(&tags).Error
	return tags, err
}
