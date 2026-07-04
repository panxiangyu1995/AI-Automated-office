package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
)

type groupRepo struct {
	db *gorm.DB
}

func NewGroupRepository(db *gorm.DB) GroupRepository {
	return &groupRepo{db: db}
}

func (r *groupRepo) Create(group *model.Group) error {
	return r.db.Create(group).Error
}

func (r *groupRepo) Update(group *model.Group) error {
	return r.db.Save(group).Error
}

func (r *groupRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Group{}, "id = ?", id).Error
}

func (r *groupRepo) FindByID(id uuid.UUID) (*model.Group, error) {
	var group model.Group
	err := r.db.Where("id = ?", id).First(&group).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}

func (r *groupRepo) FindByCode(code string) (*model.Group, error) {
	var group model.Group
	err := r.db.Where("code = ?", code).First(&group).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}

func (r *groupRepo) List(page, pageSize int) ([]model.Group, int64, error) {
	var groups []model.Group
	var total int64

	if err := r.db.Model(&model.Group{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	if err := r.db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&groups).Error; err != nil {
		return nil, 0, err
	}
	return groups, total, nil
}
