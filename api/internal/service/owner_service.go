package service

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type OwnerService struct{ db *gorm.DB }

func NewOwnerService(db *gorm.DB) *OwnerService { return &OwnerService{db} }

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
	EnterpriseID     string  `json:"enterprise_id"`
	Period           string  `json:"period"`
	TotalRevenue     float64 `json:"total_revenue"`
	RevenueGrowth    float64 `json:"revenue_growth"`
	CollectionRate   float64 `json:"collection_rate"`
	LowStockCount    int64   `json:"low_stock_count"`
	ActiveEmployees  int64   `json:"active_employees"`
	NewCustomers     int64   `json:"new_customers"`
}

func (s *OwnerService) GetSignals(eid string) (*SignalsReport, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}

	report := &SignalsReport{EnterpriseID: eid}

	var totalRevenue float64
	s.db.Model(&model.SalesOrder{}).Where("enterprise_id=? AND status IN ?",
		id, []string{"confirmed", "shipped", "completed"}).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalRevenue)
	if totalRevenue >= 100000 {
		report.Signals = append(report.Signals, Signal{Name: "销售健康度", Status: "green", Value: "高", Detail: "总营收达标"})
	} else if totalRevenue >= 50000 {
		report.Signals = append(report.Signals, Signal{Name: "销售健康度", Status: "yellow", Value: "中", Detail: "总营收一般"})
	} else {
		report.Signals = append(report.Signals, Signal{Name: "销售健康度", Status: "red", Value: "低", Detail: "总营收较低"})
	}

	var collected, receivable float64
	s.db.Model(&model.CollectionRecord{}).Where("enterprise_id=?", id).
		Select("COALESCE(SUM(amount), 0)").Scan(&collected)
	s.db.Model(&model.PaymentRecord{}).Where("enterprise_id=?", id).
		Select("COALESCE(SUM(amount), 0)").Scan(&receivable)
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

	var lowStock int64
	s.db.Model(&model.WarehouseInventory{}).Where("enterprise_id=? AND quantity <= safety_stock AND safety_stock > 0", id).
		Count(&lowStock)
	var totalSKU int64
	s.db.Model(&model.WarehouseInventory{}).Where("enterprise_id=?", id).Count(&totalSKU)
	if totalSKU > 0 && float64(lowStock)/float64(totalSKU) < 0.05 {
		report.Signals = append(report.Signals, Signal{Name: "库存健康度", Status: "green", Value: "正常", Detail: "缺货率低"})
	} else if totalSKU > 0 && float64(lowStock)/float64(totalSKU) < 0.15 {
		report.Signals = append(report.Signals, Signal{Name: "库存健康度", Status: "yellow", Value: "注意", Detail: "部分物料低库存"})
	} else {
		report.Signals = append(report.Signals, Signal{Name: "库存健康度", Status: "red", Value: "警告", Detail: "多物料低库存"})
	}

	var activeCount int64
	s.db.Model(&model.Employee{}).Where("enterprise_id=? AND status=?", id, "active").Count(&activeCount)
	var resignedCount int64
	s.db.Model(&model.Employee{}).Where("enterprise_id=? AND status=?", id, "resigned").Count(&resignedCount)
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

	s.db.Model(&model.SalesOrder{}).Where("enterprise_id=? AND status IN ?",
		id, []string{"confirmed", "shipped", "completed"}).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&report.TotalRevenue)

	var collected float64
	s.db.Model(&model.CollectionRecord{}).Where("enterprise_id=?", id).
		Select("COALESCE(SUM(amount), 0)").Scan(&collected)
	var receivable float64
	s.db.Model(&model.PaymentRecord{}).Where("enterprise_id=?", id).
		Select("COALESCE(SUM(amount), 0)").Scan(&receivable)
	if receivable > 0 {
		report.CollectionRate = collected / receivable * 100
	}

	s.db.Model(&model.WarehouseInventory{}).Where("enterprise_id=? AND quantity <= safety_stock AND safety_stock > 0", id).
		Count(&report.LowStockCount)

	s.db.Model(&model.Employee{}).Where("enterprise_id=? AND status=?", id, "active").
		Count(&report.ActiveEmployees)

	s.db.Model(&model.Customer{}).Where("enterprise_id=?", id).Count(&report.NewCustomers)

	return report, nil
}

func (s *OwnerService) CreateAlertRule(eid, dimension, metric, operator string, threshold float64) (*model.AlertRule, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	rule := &model.AlertRule{Dimension: dimension, Metric: metric, Operator: operator, Threshold: threshold, Enabled: true}
	rule.EnterpriseID = id
	if err := s.db.Create(rule).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建预警规则失败")
	}
	return rule, nil
}

func (s *OwnerService) UpdateAlertRule(id string, input map[string]interface{}) (*model.AlertRule, *apperrors.AppError) {
	pid, err := uuid.Parse(id)
	if err != nil {
		return nil, apperrors.NewValidationError("id", "无效")
	}
	var rule model.AlertRule
	if err := s.db.Where("id=?", pid).First(&rule).Error; err != nil {
		return nil, apperrors.ErrNotFound.WithDetail("预警规则不存在")
	}
	if err := s.db.Model(&rule).Updates(input).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新预警规则失败")
	}
	s.db.Where("id=?", pid).First(&rule)
	return &rule, nil
}

func (s *OwnerService) ListAlertRules(eid string) ([]model.AlertRule, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	var rules []model.AlertRule
	if err := s.db.Where("enterprise_id=?", id).Find(&rules).Error; err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询预警规则失败")
	}
	return rules, nil
}
