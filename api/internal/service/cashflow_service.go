package service

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type CashFlowService struct{ repo repository.CashFlowRepository }

func NewCashFlowService(repo repository.CashFlowRepository) *CashFlowService {
	return &CashFlowService{repo}
}

type CashFlowForecast struct {
	Periods      []PeriodForecast `json:"periods"`
	TotalInflow  float64          `json:"total_inflow"`
	TotalOutflow float64          `json:"total_outflow"`
	NetCashFlow  float64          `json:"net_cash_flow"`
}

type PeriodForecast struct {
	Month           string  `json:"month"`
	ExpectedInflow  float64 `json:"expected_inflow"`
	ExpectedOutflow float64 `json:"expected_outflow"`
	NetFlow         float64 `json:"net_flow"`
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

		inflow, _ := s.repo.SumPendingPaymentPlans(id, monthStart, monthEnd)
		outflow, _ := s.repo.SumConfirmedPurchaseOrders(id, monthStart, monthEnd)

		periodLabel := monthStart.Format("2006-01")
		netFlow := inflow - outflow
		periods = append(periods, PeriodForecast{
			Month:           periodLabel,
			ExpectedInflow:  inflow,
			ExpectedOutflow: outflow,
			NetFlow:         netFlow,
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
