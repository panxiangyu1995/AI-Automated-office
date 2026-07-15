package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type materialRepo struct{ db *gorm.DB }

func NewMaterialRepository(db *gorm.DB) MaterialRepository { return &materialRepo{db: db} }
func (r *materialRepo) Create(m *model.Material) error { return r.db.Create(m).Error }
func (r *materialRepo) Update(m *model.Material) error { return r.db.Save(m).Error }
func (r *materialRepo) Delete(id, enterpriseID uuid.UUID) error { return r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.Material{}).Error }

func (r *materialRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Material, error) {
	var m model.Material
	err := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&m).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound { return nil, nil }
		return nil, err
	}
	return &m, nil
}

func (r *materialRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Material, int64, error) {
	var ms []model.Material
	var total int64
	q := r.db.Model(&model.Material{}).Where("enterprise_id = ?", enterpriseID)
	if err := q.Count(&total).Error; err != nil { return nil, 0, err }
	if page < 1 { page = 1 }
	if pageSize < 1 || pageSize > 100 { pageSize = 20 }
	if err := q.Order("created_at DESC").Offset((page-1)*pageSize).Limit(pageSize).Find(&ms).Error; err != nil {
		return nil, 0, err
	}
	return ms, total, nil
}

func (r *materialRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	result := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).Delete(&model.Material{})
	return result.RowsAffected, result.Error
}
