package repository

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type BillingRepository interface {
	CreatePlan(plan *model.SubscriptionPlan) error
	FindPlanByID(id uuid.UUID) (*model.SubscriptionPlan, error)
	ListPlans(enterpriseID uuid.UUID, page, pageSize int) ([]model.SubscriptionPlan, int64, error)
	CreateSubscription(sub *model.EnterpriseSubscription) error
	FindSubscriptionByID(id uuid.UUID) (*model.EnterpriseSubscription, error)
	SaveSubscription(sub *model.EnterpriseSubscription) error
	FindActiveOrPastDueSubscriptions() ([]model.EnterpriseSubscription, error)
	CreateBillingRecord(record *model.BillingRecord) error
	FindBillingRecordByID(id uuid.UUID) (*model.BillingRecord, error)
	SaveBillingRecord(record *model.BillingRecord) error
	ListBillingRecords(enterpriseID uuid.UUID, page, pageSize int) ([]model.BillingRecord, int64, error)
	CountBillingRecords(enterpriseID uuid.UUID, status string, recordTypes []string, since time.Time) (int64, float64, error)
	CountPendingBillingRecords(enterpriseID uuid.UUID) (int64, error)
	CreatePaymentGatewayConfig(config *model.PaymentGatewayConfig) error
	FindActivePaymentGatewayConfig(provider string) (*model.PaymentGatewayConfig, error)
}
