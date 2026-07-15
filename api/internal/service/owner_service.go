package service

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type OwnerService struct{ repo repository.OwnerRepository }

func NewOwnerService(repo repository.OwnerRepository) *OwnerService { return &OwnerService{repo} }

type Signal struct {
	Name   string `json:"name"`
	Status string `json:"status"`
	Value  string `json:"value"`
	Detail string `json:"detail"`
}

type SignalsReport struct {
	EnterpriseID string   `json:"enterprise_id"`
	Signals      []Signal `json:"signals"`
}

type KPIReport struct {
	EnterpriseID    string  `json:"enterprise_id"`
	Period          string  `json:"period"`
	TotalRevenue    float64 `json:"total_revenue"`
	RevenueGrowth   float64 `json:"revenue_growth"`
	CollectionRate  float64 `json:"collection_rate"`
	LowStockCount   int64   `json:"low_stock_count"`
	ActiveEmployees int64   `json:"active_employees"`
	NewCustomers    int64   `json:"new_customers"`
}

func (s *OwnerService) GetSignals(eid string) (*SignalsReport, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	report := &SignalsReport{EnterpriseID: eid}

	totalRevenue, _ := s.repo.SumSalesOrderRevenue(id, []string{"confirmed", "shipped", "completed"})
	if totalRevenue >= 100000 {
		report.Signals = append(report.Signals, Signal{Name: "销售健康度", Status: "green", Value: "高", Detail: "总营收达标"})
	} else if totalRevenue >= 50000 {
		report.Signals = append(report.Signals, Signal{Name: "销售健康度", Status: "yellow", Value: "中", Detail: "总营收一般"})
	} else {
		report.Signals = append(report.Signals, Signal{Name: "销售健康度", Status: "red", Value: "低", Detail: "总营收较低"})
	}

	collected, _ := s.repo.SumCollections(id)
	receivable, _ := s.repo.SumPayments(id)
	collectedRate := 0.0
	if receivable > 0 {
		collectedRate = collected / receivable * 100
	}
	if collectedRate >= 80 {
		report.Signals = append(report.Signals, Signal{Name: "财务健康度", Status: "green", Value: "良好", Detail: "回款率高"})
	} else if collectedRate >= 60 {
		report.Signals = append(report.Signals, Signal{Name: "财务健康度", Status: "yellow", Value: "一般", Detail: "回款率中等"})
	} else {
		report.Signals = append(report.Signals, Signal{Name: "财务健康度", Status: "red", Value: "差", Detail: "回款率低"})
	}

	lowStock, _ := s.repo.CountLowStock(id)
	totalSKU, _ := s.repo.CountTotalSKU(id)
	if totalSKU > 0 && float64(lowStock)/float64(totalSKU) < 0.05 {
		report.Signals = append(report.Signals, Signal{Name: "库存健康度", Status: "green", Value: "正常", Detail: "缺货率低"})
	} else if totalSKU > 0 && float64(lowStock)/float64(totalSKU) < 0.15 {
		report.Signals = append(report.Signals, Signal{Name: "库存健康度", Status: "yellow", Value: "注意", Detail: "部分物料低库存"})
	} else {
		report.Signals = append(report.Signals, Signal{Name: "库存健康度", Status: "red", Value: "警告", Detail: "多物料低库存"})
	}

	activeCount, _ := s.repo.CountEmployeesByStatus(id, "active")
	resignedCount, _ := s.repo.CountEmployeesByStatus(id, "resigned")
	totalEmp := activeCount + resignedCount
	if totalEmp > 0 && float64(resignedCount)/float64(totalEmp) < 0.05 {
		report.Signals = append(report.Signals, Signal{Name: "人事健康度", Status: "green", Value: "稳定", Detail: "离职率低"})
	} else if totalEmp > 0 && float64(resignedCount)/float64(totalEmp) < 0.1 {
		report.Signals = append(report.Signals, Signal{Name: "人事健康度", Status: "yellow", Value: "注意", Detail: "离职率中等"})
	} else {
		report.Signals = append(report.Signals, Signal{Name: "人事健康度", Status: "red", Value: "警告", Detail: "离职率高"})
	}

	return report, nil
}

func (s *OwnerService) GetKPI(eid, period string) (*KPIReport, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	report := &KPIReport{EnterpriseID: eid, Period: period}

	totalRevenue, _ := s.repo.SumSalesOrderRevenue(id, []string{"confirmed", "shipped", "completed"})
	report.TotalRevenue = totalRevenue

	collected, _ := s.repo.SumCollections(id)
	receivable, _ := s.repo.SumPayments(id)
	if receivable > 0 {
		report.CollectionRate = collected / receivable * 100
	}

	lowStock, _ := s.repo.CountLowStock(id)
	report.LowStockCount = lowStock

	activeEmp, _ := s.repo.CountEmployeesByStatus(id, "active")
	report.ActiveEmployees = activeEmp

	custCount, _ := s.repo.CountCustomers(id)
	report.NewCustomers = custCount

	return report, nil
}

func (s *OwnerService) CreateAlertRule(eid, dimension, metric, operator string, threshold float64) (*model.AlertRule, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	rule := &model.AlertRule{Dimension: dimension, Metric: metric, Operator: operator, Threshold: threshold, Enabled: true}
	rule.EnterpriseID = id
	if err := s.repo.CreateAlertRule(rule); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建预警规则失败")
	}
	return rule, nil
}

func (s *OwnerService) UpdateAlertRule(id, enterpriseID string, input map[string]interface{}) (*model.AlertRule, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	eid, err := uuid.Parse(enterpriseID)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	rule, dbErr := s.repo.FindAlertRuleByID(pid, eid)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询预警规则失败")
	}
	if rule == nil {
		return nil, apperrors.ErrNotFound.WithDetail("预警规则不存在")
	}
	updated, dbErr := s.repo.UpdateAlertRule(pid, eid, input)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新预警规则失败")
	}
	return updated, nil
}

func (s *OwnerService) ListAlertRules(eid string) ([]model.AlertRule, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	rules, dbErr := s.repo.ListAlertRules(id)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询预警规则失败")
	}
	return rules, nil
}
