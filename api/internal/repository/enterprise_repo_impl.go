package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
)

type enterpriseRepo struct {
	db *gorm.DB
}

func NewEnterpriseRepository(db *gorm.DB) EnterpriseRepository {
	return &enterpriseRepo{db: db}
}

func (r *enterpriseRepo) Create(enterprise *model.Enterprise) error {
	return r.db.Create(enterprise).Error
}

func (r *enterpriseRepo) Update(enterprise *model.Enterprise) error {
	return r.db.Save(enterprise).Error
}

func (r *enterpriseRepo) FindByID(id uuid.UUID) (*model.Enterprise, error) {
	var ent model.Enterprise
	err := r.db.Where("id = ?", id).First(&ent).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ent, nil
}

func (r *enterpriseRepo) FindByCode(code string) (*model.Enterprise, error) {
	var ent model.Enterprise
	err := r.db.Where("code = ?", code).First(&ent).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &ent, nil
}

func (r *enterpriseRepo) List(page, pageSize int) ([]model.Enterprise, int64, error) {
	var enterprises []model.Enterprise
	var total int64

	if err := r.db.Model(&model.Enterprise{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := r.db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&enterprises).Error; err != nil {
		return nil, 0, err
	}
	return enterprises, total, nil
}

func (r *enterpriseRepo) ListByGroup(groupID string) ([]model.Enterprise, error) {
	var enterprises []model.Enterprise
	err := r.db.Where("group_id = ?", groupID).Find(&enterprises).Error
	return enterprises, err
}
