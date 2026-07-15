package repository

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ReconciliationRepository interface {
	SumPaymentsBefore(enterpriseID, customerID uuid.UUID, before time.Time) (float64, error)
	SumCollectionsBefore(enterpriseID, customerID uuid.UUID, before time.Time) (float64, error)
	ListPaymentsInRange(enterpriseID, customerID uuid.UUID, start, end time.Time) ([]model.PaymentRecord, error)
	ListCollectionsInRange(enterpriseID, customerID uuid.UUID, start, end time.Time) ([]model.CollectionRecord, error)
}
