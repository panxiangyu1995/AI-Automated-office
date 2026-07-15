package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type inventoryCheckRepo struct {
	db *gorm.DB
}

func NewInventoryCheckRepository(db *gorm.DB) InventoryCheckRepository {
	return &inventoryCheckRepo{db: db}
}

func (r *inventoryCheckRepo) Create(check *model.InventoryCheck) error {
	return r.db.Create(check).Error
}

func (r *inventoryCheckRepo) FindByID(id uuid.UUID) (*model.InventoryCheck, error) {
	var check model.InventoryCheck
	if err := r.db.Where("id = ?", id).First(&check).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &check, nil
}

func (r *inventoryCheckRepo) Update(check *model.InventoryCheck) error {
	return r.db.Save(check).Error
}

func (r *inventoryCheckRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.InventoryCheck, int64, error) {
	var checks []model.InventoryCheck
	var total int64
	q := r.db.Model(&model.InventoryCheck{}).Where("enterprise_id = ?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&checks).Error; err != nil {
		return nil, 0, err
	}
	return checks, total, nil
}
