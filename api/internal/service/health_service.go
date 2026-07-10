package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type HealthService struct{ db *gorm.DB }

func NewHealthService(db *gorm.DB) *HealthService { return &HealthService{db} }

type EnterpriseHealth struct {
	EnterpriseID string  `json:"enterprise_id"`
	Score        int     `json:"score"`
	Level        string  `json:"level"`
	DailyActive  int64   `json:"daily_active"`
	DataComplete float64 `json:"data_complete"`
	GrowthTrend  string  `json:"growth_trend"`
}

type HealthDashboard struct {
	TotalEnterprises int64               `json:"total_enterprises"`
	HealthyCount     int64               `json:"healthy_count"`
	AtRiskCount      int64               `json:"at_risk_count"`
	ChurnRiskList    []ChurnRiskEnterprise `json:"churn_risk_list"`
}

type ChurnRiskEnterprise struct {
	EnterpriseID string `json:"enterprise_id"`
	RiskLevel    string `json:"risk_level"`
	LastActive   string `json:"last_active"`
}

func (s *HealthService) GetEnterpriseHealth(eid string) (*EnterpriseHealth, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	health := &EnterpriseHealth{EnterpriseID: eid}

	var employeeCount int64
	s.db.Model(&model.Employee{}).Where("enterprise_id=? AND status=?", id, "active").
		Count(&employeeCount)
	health.DailyActive = employeeCount

	var customerCount int64
	s.db.Model(&model.Customer{}).Where("enterprise_id=?", id).Count(&customerCount)
	var contractCount int64
	s.db.Model(&model.Contract{}).Where("enterprise_id=?", id).Count(&contractCount)

	dataComplete := 100.0
	if employeeCount == 0 {
		dataComplete = 0
	} else if customerCount == 0 {
		dataComplete = 30
	} else if contractCount == 0 {
		dataComplete = 60
	}
	health.DataComplete = dataComplete

	var newOrders int64
	s.db.Model(&model.SalesOrder{}).Where("enterprise_id=?", id).Count(&newOrders)
	if newOrders > 0 {
		health.GrowthTrend = "growing"
	} else {
		health.GrowthTrend = "stable"
	}

	score := int(dataComplete*0.4 + float64(employeeCount)*0.3 + float64(newOrders)*0.3)
	if score > 100 {
		score = 100
	}
	health.Score = score

	if score >= 70 {
		health.Level = "healthy"
	} else if score >= 40 {
		health.Level = "warning"
	} else {
		health.Level = "at_risk"
	}

	return health, nil
}

func (s *HealthService) GetDashboard() (*HealthDashboard, *apperrors.AppError) {
	dashboard := &HealthDashboard{}

	var enterprises []model.Enterprise
	s.db.Find(&enterprises)
	dashboard.TotalEnterprises = int64(len(enterprises))

	for _, ent := range enterprises {
		health, err := s.GetEnterpriseHealth(ent.ID.String())
		if err != nil {
			continue
		}
		if health.Level == "healthy" {
			dashboard.HealthyCount++
		} else if health.Level == "at_risk" {
			dashboard.AtRiskCount++
			dashboard.ChurnRiskList = append(dashboard.ChurnRiskList, ChurnRiskEnterprise{
				EnterpriseID: ent.ID.String(),
				RiskLevel:    "high",
				LastActive:   ent.UpdatedAt.Format("2006-01-02"),
			})
		}
	}

	return dashboard, nil
}
