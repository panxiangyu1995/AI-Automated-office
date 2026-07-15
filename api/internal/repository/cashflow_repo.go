package repository

import (
	"time"

	"github.com/google/uuid"
)

type CashFlowRepository interface {
	SumPendingPaymentPlans(enterpriseID uuid.UUID, start, end time.Time) (float64, error)
	SumConfirmedPurchaseOrders(enterpriseID uuid.UUID, start, end time.Time) (float64, error)
}
