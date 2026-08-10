package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type paymentPlanRepo struct {
	db *gorm.DB
}

func NewPaymentPlanRepository(db *gorm.DB) PaymentPlanRepository {
	return &paymentPlanRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *paymentPlanRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *paymentPlanRepo) CreateBatch(plans []model.PaymentPlan) error {
	return r.fresh().Create(&plans).Error
}

func (r *paymentPlanRepo) FindByID(id, enterpriseID uuid.UUID) (*model.PaymentPlan, error) {
	var p model.PaymentPlan
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&p).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func (r *paymentPlanRepo) UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.PaymentPlan, error) {
	if err := r.fresh().Model(&model.PaymentPlan{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Updates(fields).Error; err != nil {
		return nil, err
	}
	var p model.PaymentPlan
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *paymentPlanRepo) Delete(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.PaymentPlan{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).UpdateColumn("deleted_at", time.Now()).Error
}

func (r *paymentPlanRepo) ListByContractID(contractID string) ([]model.PaymentPlan, error) {
	var plans []model.PaymentPlan
	if err := r.fresh().Where("contract_id=?", contractID).Order("due_date ASC").Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *paymentPlanRepo) ListOverdue(enterpriseID uuid.UUID, status string, before time.Time) ([]model.PaymentPlan, error) {
	var plans []model.PaymentPlan
	if err := r.fresh().Where("enterprise_id=? AND status=? AND due_date <= ?", enterpriseID, status, before).
		Order("due_date ASC").Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *paymentPlanRepo) FindPendingUnreminded(before time.Time) ([]model.PaymentPlan, error) {
	var plans []model.PaymentPlan
	if err := r.fresh().Where("status = ? AND due_date <= ? AND reminder_sent = ?",
		model.PaymentPlanStatusPending, before, false).Find(&plans).Error; err != nil {
		return nil, err
	}
	return plans, nil
}

func (r *paymentPlanRepo) UpdatePlanFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	return r.fresh().Model(&model.PaymentPlan{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Updates(fields).Error
}

func (r *paymentPlanRepo) UpdatePlanReminderSent(id, enterpriseID uuid.UUID) error {
	return r.fresh().Model(&model.PaymentPlan{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Update("reminder_sent", true).Error
}
