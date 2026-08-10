package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type paymentRequestRepo struct {
	db *gorm.DB
}

func NewPaymentRequestRepository(db *gorm.DB) PaymentRequestRepository {
	return &paymentRequestRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *paymentRequestRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *paymentRequestRepo) Create(rec *model.PaymentRequest) error {
	return r.fresh().Create(rec).Error
}

func (r *paymentRequestRepo) FindByID(id, enterpriseID uuid.UUID) (*model.PaymentRequest, error) {
	var rec model.PaymentRequest
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rec).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *paymentRequestRepo) List(enterpriseID uuid.UUID, status string, page, pageSize int) ([]model.PaymentRequest, int64, error) {
	var items []model.PaymentRequest
	var total int64
	q := r.fresh().Model(&model.PaymentRequest{}).Where("enterprise_id=?", enterpriseID)
	if status != "" {
		q = q.Where("status=?", status)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}
	return items, total, nil
}

func (r *paymentRequestRepo) UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.PaymentRequest, error) {
	if err := r.fresh().Model(&model.PaymentRequest{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Updates(fields).Error; err != nil {
		return nil, err
	}
	var rec model.PaymentRequest
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&rec).Error; err != nil {
		return nil, err
	}
	return &rec, nil
}

func (r *paymentRequestRepo) Delete(rec *model.PaymentRequest, enterpriseID uuid.UUID) error {
	return r.fresh().Where("id = ? AND enterprise_id = ?", rec.ID, enterpriseID).Delete(rec).Error
}

func (r *paymentRequestRepo) Save(rec *model.PaymentRequest) error {
	return r.fresh().Save(rec).Error
}
