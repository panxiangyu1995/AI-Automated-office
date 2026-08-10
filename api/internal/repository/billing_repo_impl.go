package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type billingRepo struct {
	db *gorm.DB
}

func NewBillingRepository(db *gorm.DB) BillingRepository {
	return &billingRepo{db: db}
}
// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *billingRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}


func (r *billingRepo) CreatePlan(plan *model.SubscriptionPlan) error {
	return r.fresh().Create(plan).Error
}

func (r *billingRepo) FindPlanByID(id uuid.UUID) (*model.SubscriptionPlan, error) {
	var plan model.SubscriptionPlan
	if err := r.fresh().Where("id = ?", id).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &plan, nil
}

func (r *billingRepo) ListPlans(enterpriseID uuid.UUID, page, pageSize int) ([]model.SubscriptionPlan, int64, error) {
	var items []model.SubscriptionPlan
	var total int64
	q := r.fresh().Model(&model.SubscriptionPlan{}).Where("enterprise_id = ?", enterpriseID)
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

func (r *billingRepo) CreateSubscription(sub *model.EnterpriseSubscription) error {
	return r.fresh().Create(sub).Error
}

func (r *billingRepo) FindSubscriptionByID(id uuid.UUID) (*model.EnterpriseSubscription, error) {
	var sub model.EnterpriseSubscription
	if err := r.fresh().Where("id = ?", id).First(&sub).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &sub, nil
}

func (r *billingRepo) SaveSubscription(sub *model.EnterpriseSubscription) error {
	return r.fresh().Model(&model.EnterpriseSubscription{}).
		Where("id = ?", sub.ID).
		Updates(map[string]interface{}{
			"status":                sub.Status,
			"start_at":              sub.StartAt,
			"end_at":                sub.EndAt,
			"auto_renew":            sub.AutoRenew,
			"current_period_start":  sub.CurrentPeriodStart,
			"current_period_end":    sub.CurrentPeriodEnd,
			"grace_period_end":      sub.GracePeriodEnd,
			"billing_cycle":         sub.BillingCycle,
			"updated_at":            time.Now(),
		}).Error
}

func (r *billingRepo) FindActiveOrPastDueSubscriptions() ([]model.EnterpriseSubscription, error) {
	var subs []model.EnterpriseSubscription
	if err := r.fresh().Where("status IN ?", []string{"active", "past_due"}).Find(&subs).Error; err != nil {
		return nil, err
	}
	return subs, nil
}

func (r *billingRepo) CreateBillingRecord(record *model.BillingRecord) error {
	return r.fresh().Create(record).Error
}

func (r *billingRepo) FindBillingRecordByID(id uuid.UUID) (*model.BillingRecord, error) {
	var record model.BillingRecord
	if err := r.fresh().Where("id = ?", id).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &record, nil
}

func (r *billingRepo) SaveBillingRecord(record *model.BillingRecord) error {
	return r.fresh().Model(&model.BillingRecord{}).
		Where("id = ?", record.ID).
		Updates(map[string]interface{}{
			"amount":        record.Amount,
			"type":          record.Type,
			"status":        record.Status,
			"period_start":  record.PeriodStart,
			"period_end":    record.PeriodEnd,
			"due_date":      record.DueDate,
			"paid_at":       record.PaidAt,
			"updated_at":    time.Now(),
		}).Error
}

func (r *billingRepo) ListBillingRecords(enterpriseID uuid.UUID, page, pageSize int) ([]model.BillingRecord, int64, error) {
	var items []model.BillingRecord
	var total int64
	q := r.fresh().Model(&model.BillingRecord{}).Where("enterprise_id = ?", enterpriseID)
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

func (r *billingRepo) CountBillingRecords(enterpriseID uuid.UUID, status string, recordTypes []string, since time.Time) (int64, float64, error) {
	var count int64
	var total float64
	q := r.fresh().Model(&model.BillingRecord{}).Where("enterprise_id = ? AND status = ? AND type IN ? AND created_at >= ?", enterpriseID, status, recordTypes, since)
	if err := q.Count(&count).Error; err != nil {
		return 0, 0, err
	}
	if err := r.fresh().Model(&model.BillingRecord{}).
		Where("enterprise_id = ? AND status = ? AND type IN ? AND created_at >= ?", enterpriseID, status, recordTypes, since).
		Select("COALESCE(SUM(amount),0)").Scan(&total).Error; err != nil {
		return 0, 0, err
	}
	return count, total, nil
}

func (r *billingRepo) CountPendingBillingRecords(enterpriseID uuid.UUID) (int64, error) {
	var count int64
	if err := r.fresh().Model(&model.BillingRecord{}).Where("enterprise_id = ? AND status = 'pending'", enterpriseID).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *billingRepo) CreatePaymentGatewayConfig(config *model.PaymentGatewayConfig) error {
	return r.fresh().Create(config).Error
}

func (r *billingRepo) FindActivePaymentGatewayConfig(provider string) (*model.PaymentGatewayConfig, error) {
	var config model.PaymentGatewayConfig
	if err := r.fresh().Where("provider = ? AND is_active = ?", provider, true).First(&config).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &config, nil
}
