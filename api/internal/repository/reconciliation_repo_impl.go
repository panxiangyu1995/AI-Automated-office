package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type reconciliationRepo struct {
	db *gorm.DB
}

func NewReconciliationRepository(db *gorm.DB) ReconciliationRepository {
	return &reconciliationRepo{db: db}
}

func (r *reconciliationRepo) SumPaymentsBefore(enterpriseID, customerID uuid.UUID, before time.Time) (float64, error) {
	var amount float64
	err := r.db.Model(&model.PaymentRecord{}).
		Where("enterprise_id=? AND customer_id=? AND created_at < ? AND status != ?",
			enterpriseID, customerID, before, "cancelled").
		Select("COALESCE(SUM(amount), 0)").Scan(&amount).Error
	return amount, err
}

func (r *reconciliationRepo) SumCollectionsBefore(enterpriseID, customerID uuid.UUID, before time.Time) (float64, error) {
	var amount float64
	err := r.db.Model(&model.CollectionRecord{}).
		Where("enterprise_id=? AND customer_id=? AND created_at < ?",
			enterpriseID, customerID, before).
		Select("COALESCE(SUM(amount), 0)").Scan(&amount).Error
	return amount, err
}

func (r *reconciliationRepo) ListPaymentsInRange(enterpriseID, customerID uuid.UUID, start, end time.Time) ([]model.PaymentRecord, error) {
	var records []model.PaymentRecord
	err := r.db.Where("enterprise_id=? AND customer_id=? AND created_at >= ? AND created_at <= ?",
		enterpriseID, customerID, start, end).
		Order("created_at ASC").
		Find(&records).Error
	return records, err
}

func (r *reconciliationRepo) ListCollectionsInRange(enterpriseID, customerID uuid.UUID, start, end time.Time) ([]model.CollectionRecord, error) {
	var records []model.CollectionRecord
	err := r.db.Where("enterprise_id=? AND customer_id=? AND created_at >= ? AND created_at <= ?",
		enterpriseID, customerID, start, end).
		Order("created_at ASC").
		Find(&records).Error
	return records, err
}
