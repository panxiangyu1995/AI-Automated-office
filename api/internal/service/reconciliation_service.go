package service

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type ReconciliationService struct{ db *gorm.DB }

func NewReconciliationService(db *gorm.DB) *ReconciliationService { return &ReconciliationService{db} }

type ReconciliationReport struct {
	CustomerID      string              `json:"customer_id"`
	OpeningBalance  float64             `json:"opening_balance"`
	Receivables     []ReceivableDetail  `json:"receivables"`
	Collections     []CollectionDetail  `json:"collections"`
	ClosingBalance  float64             `json:"closing_balance"`
	TotalReceivable float64             `json:"total_receivable"`
	TotalCollected  float64             `json:"total_collected"`
}

type ReceivableDetail struct {
	ID        string    `json:"id"`
	Amount    float64   `json:"amount"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	RefType   string    `json:"ref_type"`
}

type CollectionDetail struct {
	ID           string    `json:"id"`
	Amount       float64   `json:"amount"`
	Method       string    `json:"method"`
	CollectedAt  string    `json:"collected_at"`
	CreatedAt    time.Time `json:"created_at"`
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

	var opening float64
	s.db.Model(&model.PaymentRecord{}).
		Where("enterprise_id=? AND customer_id=? AND created_at < ? AND status != ?",
			eUUID, cUUID, start, "cancelled").
		Select("COALESCE(SUM(amount), 0)").Scan(&opening)

	var openingCollected float64
	s.db.Model(&model.CollectionRecord{}).
		Where("enterprise_id=? AND customer_id=? AND created_at < ?",
			eUUID, cUUID, start).
		Select("COALESCE(SUM(amount), 0)").Scan(&openingCollected)

	report.OpeningBalance = opening - openingCollected

	var receivables []ReceivableDetail
	var records []model.PaymentRecord
	s.db.Model(&model.PaymentRecord{}).
		Where("enterprise_id=? AND customer_id=? AND created_at >= ? AND created_at <= ?",
			eUUID, cUUID, start, end).
		Order("created_at ASC").
		Find(&records)
	for _, r := range records {
		receivables = append(receivables, ReceivableDetail{
			ID:        r.ID.String(),
			Amount:    r.Amount,
			Status:    r.Status,
			CreatedAt: r.CreatedAt,
		})
	}
	report.Receivables = receivables

	var collections []CollectionDetail
	var colRecords []model.CollectionRecord
	s.db.Model(&model.CollectionRecord{}).
		Where("enterprise_id=? AND customer_id=? AND created_at >= ? AND created_at <= ?",
			eUUID, cUUID, start, end).
		Order("created_at ASC").
		Find(&colRecords)
	for _, c := range colRecords {
		collections = append(collections, CollectionDetail{
			ID:          c.ID.String(),
			Amount:      c.Amount,
			Method:      c.Method,
			CollectedAt: c.CollectedAt,
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
