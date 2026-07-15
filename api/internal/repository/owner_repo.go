package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type OwnerRepository interface {
	SumSalesOrderRevenue(enterpriseID uuid.UUID, statuses []string) (float64, error)
	SumCollections(enterpriseID uuid.UUID) (float64, error)
	SumPayments(enterpriseID uuid.UUID) (float64, error)
	CountLowStock(enterpriseID uuid.UUID) (int64, error)
	CountTotalSKU(enterpriseID uuid.UUID) (int64, error)
	CountEmployeesByStatus(enterpriseID uuid.UUID, status string) (int64, error)
	CountCustomers(enterpriseID uuid.UUID) (int64, error)
	CreateAlertRule(rule *model.AlertRule) error
	FindAlertRuleByID(id, enterpriseID uuid.UUID) (*model.AlertRule, error)
	UpdateAlertRule(id, enterpriseID uuid.UUID, input map[string]interface{}) (*model.AlertRule, error)
	ListAlertRules(enterpriseID uuid.UUID) ([]model.AlertRule, error)
}
