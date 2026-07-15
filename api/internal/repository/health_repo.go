package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type HealthRepository interface {
	CountActiveEmployees(enterpriseID uuid.UUID) (int64, error)
	CountCustomers(enterpriseID uuid.UUID) (int64, error)
	CountContracts(enterpriseID uuid.UUID) (int64, error)
	CountSalesOrders(enterpriseID uuid.UUID) (int64, error)
	ListAllEnterprises() ([]model.Enterprise, error)
}
