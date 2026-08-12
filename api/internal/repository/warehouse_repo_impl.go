package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
	"time"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type warehouseRepo struct{ db *gorm.DB }

func NewWarehouseRepository(db *gorm.DB) WarehouseRepository { return &warehouseRepo{db} }

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *warehouseRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}
func (r *warehouseRepo) Create(w *model.Warehouse) error { return r.db.Create(w).Error }
func (r *warehouseRepo) Update(w *model.Warehouse) error { return r.db.Save(w).Error }
func (r *warehouseRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.Warehouse{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *warehouseRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Warehouse, error) {
	var w model.Warehouse
	err := r.db.Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&w).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &w, err
}

func (r *warehouseRepo) ListByEnterprise(eid uuid.UUID, p, ps int) ([]model.Warehouse, int64, error) {
	var ws []model.Warehouse
	var t int64
	q := r.db.Model(&model.Warehouse{}).Where("enterprise_id = ?", eid)
	if err := q.Count(&t).Error; err != nil {
		return nil, 0, err
	}
	if p < 1 {
		p = 1
	}
	if ps < 1 || ps > 100 {
		ps = 20
	}
	if err := q.Order("created_at DESC").Offset((p - 1) * ps).Limit(ps).Find(&ws).Error; err != nil {
		return nil, 0, err
	}
	return ws, t, nil
}
