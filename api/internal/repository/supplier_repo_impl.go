package repository

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type supplierRepo struct{ db *gorm.DB }

func NewSupplierRepository(db *gorm.DB) SupplierRepository { return &supplierRepo{db} }

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *supplierRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}
func (r *supplierRepo) Create(s *model.Supplier) error     { return r.db.Create(s).Error }
func (r *supplierRepo) Update(s *model.Supplier) error     { return r.db.Save(s).Error }
func (r *supplierRepo) Delete(id, enterpriseID uuid.UUID) error { return r.fresh().Model(&model.Supplier{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error }

func (r *supplierRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Supplier, error) {
	var s model.Supplier
	err := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&s).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &s, err
}

func (r *supplierRepo) ListByEnterprise(eid uuid.UUID, p, ps int) ([]model.Supplier, int64, error) {
	var ss []model.Supplier
	var t int64
	q := r.db.Model(&model.Supplier{}).Where("enterprise_id = ?", eid)
	if err := q.Count(&t).Error; err != nil {
		return nil, 0, err
	}
	if p < 1 {
		p = 1
	}
	if ps < 1 || ps > 100 {
		ps = 20
	}
	if err := q.Order("created_at DESC").Offset((p - 1) * ps).Limit(ps).Find(&ss).Error; err != nil {
		return nil, 0, err
	}
	return ss, t, nil
}

func (r *supplierRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	result := r.fresh().Model(&model.Supplier{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now())
	return result.RowsAffected, result.Error
}
