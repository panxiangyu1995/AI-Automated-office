package service

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type PurchaseOrderStatusAdapter struct {
	Repo repository.OrderRepository
}

func (a *PurchaseOrderStatusAdapter) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	return a.Repo.UpdatePurchaseOrderStatus(id, enterpriseID, status)
}

type SalesOrderStatusAdapter struct {
	Repo repository.OrderRepository
}

func (a *SalesOrderStatusAdapter) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	return a.Repo.UpdateSalesOrderStatus(id, enterpriseID, status)
}
