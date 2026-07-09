package service

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type CashFlowService struct{ db *gorm.DB }

func NewCashFlowService(db *gorm.DB) *CashFlowService { return &CashFlowService{db} }

type CashFlowForecast struct {
	Periods      []PeriodForecast `json:"periods"`
	TotalInflow  float64          `json:"total_inflow"`
	TotalOutflow float64          `json:"total_outflow"`
	NetCashFlow  float64          `json:"net_cash_flow"`
}

type PeriodForecast struct {
	Month          string  `json:"month"`
	ExpectedInflow float64 `json:"expected_inflow"`
	ExpectedOutflow float64 `json:"expected_outflow"`
	NetFlow        float64 `json:"net_flow"`
}

func (s *CashFlowService) Forecast(eid string, months int) (*CashFlowForecast, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	if months < 1 {
		months = 3
	}
	if months > 12 {
		months = 12
	}

	now := time.Now()
	var periods []PeriodForecast
	var totalInflow, totalOutflow float64

	for i := 0; i < months; i++ {
		monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location()).AddDate(0, i, 0)
		monthEnd := monthStart.AddDate(0, 1, -1)

		var inflow float64
		s.db.Model(&model.PaymentPlan{}).
			Where("enterprise_id=? AND status=? AND plan_date >= ? AND plan_date <= ?",
				id, model.PaymentPlanStatusPending, monthStart, monthEnd).
			Select("COALESCE(SUM(amount), 0)").Scan(&inflow)

		var outflow float64
		s.db.Model(&model.PurchaseOrder{}).
			Where("enterprise_id=? AND status IN ? AND created_at >= ? AND created_at <= ?",
				id, []string{"confirmed", "received"}, monthStart, monthEnd).
			Select("COALESCE(SUM(total_amount), 0)").Scan(&outflow)

		periodLabel := monthStart.Format("2006-01")
		netFlow := inflow - outflow
		periods = append(periods, PeriodForecast{
			Month:          periodLabel,
			ExpectedInflow: inflow,
			ExpectedOutflow: outflow,
			NetFlow:        netFlow,
		})
		totalInflow += inflow
		totalOutflow += outflow
	}

	return &CashFlowForecast{
		Periods:      periods,
		TotalInflow:  totalInflow,
		TotalOutflow: totalOutflow,
		NetCashFlow:  totalInflow - totalOutflow,
	}, nil
}
