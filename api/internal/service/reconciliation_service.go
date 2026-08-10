package service

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type ReconciliationService struct{ repo repository.ReconciliationRepository }

func NewReconciliationService(repo repository.ReconciliationRepository) *ReconciliationService {
	return &ReconciliationService{repo}
}

type ReconciliationReport struct {
	CustomerID      string             `json:"customer_id"`
	OpeningBalance  float64            `json:"opening_balance"`
	Receivables     []ReceivableDetail `json:"receivables"`
	Collections     []CollectionDetail `json:"collections"`
	ClosingBalance  float64            `json:"closing_balance"`
	TotalReceivable float64            `json:"total_receivable"`
	TotalCollected  float64            `json:"total_collected"`
}

type ReceivableDetail struct {
	ID        string    `json:"id"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	RefType   string    `json:"ref_type"`
}

type CollectionDetail struct {
	ID          string    `json:"id"`
	Amount      float64   `json:"amount"`
	Method      string    `json:"method"`
	CollectedAt string    `json:"collected_at"`
	CreatedAt   time.Time `json:"created_at"`
}

func (s *ReconciliationService) GetReconciliation(eid, customerID, startDate, endDate string) (*ReconciliationReport, *apperrors.AppError) {
	eUUID, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	cUUID, err := uuid.Parse(customerID)
	if err != nil {
		return nil, apperrors.NewValidationError("customer_id", "无效")
	}

	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		return nil, apperrors.NewValidationError("start_date", "日期格式无效，需要 YYYY-MM-DD")
	}
	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		return nil, apperrors.NewValidationError("end_date", "日期格式无效，需要 YYYY-MM-DD")
	}

	report := &ReconciliationReport{CustomerID: customerID}

	opening, _ := s.repo.SumPaymentsBefore(eUUID, cUUID, start)
	openingCollected, _ := s.repo.SumCollectionsBefore(eUUID, cUUID, start)
	report.OpeningBalance = opening - openingCollected

	records, _ := s.repo.ListPaymentsInRange(eUUID, cUUID, start, end)
	var receivables []ReceivableDetail
	for _, r := range records {
		receivables = append(receivables, ReceivableDetail{
			ID:        r.ID.String(),
			Amount:    r.Amount,
			Status:    r.Status,
			CreatedAt: r.CreatedAt,
		})
	}
	report.Receivables = receivables

	colRecords, _ := s.repo.ListCollectionsInRange(eUUID, cUUID, start, end)
	var collections []CollectionDetail
	for _, c := range colRecords {
		var collectedAtStr string
		if c.CollectedAt != nil {
			collectedAtStr = c.CollectedAt.Format("2006-01-02")
		}
		collections = append(collections, CollectionDetail{
			ID:          c.ID.String(),
			Amount:      c.Amount,
			Method:      c.CollectionMethod,
			CollectedAt: collectedAtStr,
			CreatedAt:   c.CreatedAt,
		})
	}
	report.Collections = collections

	for _, r := range receivables {
		report.TotalReceivable += r.Amount
	}
	for _, c := range collections {
		report.TotalCollected += c.Amount
	}

	report.ClosingBalance = report.OpeningBalance + report.TotalReceivable - report.TotalCollected

	return report, nil
}
