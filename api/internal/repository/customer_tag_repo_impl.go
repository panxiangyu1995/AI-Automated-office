package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
)

type customerTagRepo struct {
	db *gorm.DB
}

func NewCustomerTagRepository(db *gorm.DB) CustomerTagRepository {
	return &customerTagRepo{db: db}
}

func (r *customerTagRepo) Create(tag *model.CustomerTag) error {
	return r.db.Create(tag).Error
}

func (r *customerTagRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.CustomerTag{}, "id = ?", id).Error
}

func (r *customerTagRepo) DeleteByCustomerAndTag(customerID uuid.UUID, tag string) error {
	return r.db.Where("customer_id = ? AND tag = ?", customerID, tag).Delete(&model.CustomerTag{}).Error
}

func (r *customerTagRepo) ListByCustomer(customerID uuid.UUID) ([]model.CustomerTag, error) {
	var tags []model.CustomerTag
	err := r.db.Where("customer_id = ?", customerID).Find(&tags).Error
	return tags, err
}

func (r *customerTagRepo) ListByEnterprise(enterpriseID uuid.UUID) ([]model.CustomerTag, error) {
	var tags []model.CustomerTag
	err := r.db.Where("enterprise_id = ?", enterpriseID).Find(&tags).Error
	return tags, err
}
