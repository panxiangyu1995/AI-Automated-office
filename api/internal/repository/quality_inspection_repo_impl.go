package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type qualityInspectionRepo struct{ db *gorm.DB }

func NewQualityInspectionRepository(db *gorm.DB) QualityInspectionRepository {
	return &qualityInspectionRepo{db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *qualityInspectionRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *qualityInspectionRepo) Create(inspection *model.QualityInspection) error {
	return r.fresh().Create(inspection).Error
}

func (r *qualityInspectionRepo) FindByID(id, enterpriseID uuid.UUID) (*model.QualityInspection, error) {
	var qi model.QualityInspection
	err := r.fresh().Where("id = ? AND enterprise_id = ?", id, enterpriseID).First(&qi).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &qi, err
}

func (r *qualityInspectionRepo) ListByPurchaseOrder(purchaseOrderID uuid.UUID, page, pageSize int) ([]model.QualityInspection, int64, error) {
	var qis []model.QualityInspection
	var t int64
	q := r.fresh().Model(&model.QualityInspection{}).Where("purchase_order_id = ?", purchaseOrderID)
	if err := q.Count(&t).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&qis).Error; err != nil {
		return nil, 0, err
	}
	return qis, t, nil
}

func (r *qualityInspectionRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	return r.fresh().Model(&model.QualityInspection{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("status", status).Error
}

func (r *qualityInspectionRepo) Update(inspection *model.QualityInspection) error {
	return r.fresh().Save(inspection).Error
}

func (r *qualityInspectionRepo) CreateItem(item *model.QualityInspectionItem) error {
	return r.fresh().Create(item).Error
}

func (r *qualityInspectionRepo) ListItems(inspectionID uuid.UUID) ([]model.QualityInspectionItem, error) {
	var items []model.QualityInspectionItem
	return items, r.fresh().Where("inspection_id = ?", inspectionID).Find(&items).Error
}
