package repository

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type cashFlowRepo struct {
	db *gorm.DB
}

func NewCashFlowRepository(db *gorm.DB) CashFlowRepository {
	return &cashFlowRepo{db: db}
}

func (r *cashFlowRepo) SumPendingPaymentPlans(enterpriseID uuid.UUID, start, end time.Time) (float64, error) {
	var amount float64
	err := r.db.Model(&model.PaymentPlan{}).
		Where("enterprise_id=? AND status=? AND plan_date >= ? AND plan_date <= ?",
			enterpriseID, model.PaymentPlanStatusPending, start, end).
		Select("COALESCE(SUM(amount), 0)").Scan(&amount).Error
	return amount, err
}

func (r *cashFlowRepo) SumConfirmedPurchaseOrders(enterpriseID uuid.UUID, start, end time.Time) (float64, error) {
	var amount float64
	err := r.db.Model(&model.PurchaseOrder{}).
		Where("enterprise_id=? AND status IN ? AND created_at >= ? AND created_at <= ?",
			enterpriseID, []string{"confirmed", "received"}, start, end).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&amount).Error
	return amount, err
}
