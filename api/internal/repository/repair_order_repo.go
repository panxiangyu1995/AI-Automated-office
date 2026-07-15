package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type RepairOrderRepository interface {
	BeginTx() interface{}
	CreateWithTx(tx interface{}, order *model.RepairOrder) error
	UpdateServiceOrderStatus(tx interface{}, serviceOrderID string, enterpriseID uuid.UUID, status string) error
	FindByID(id, enterpriseID uuid.UUID) (*model.RepairOrder, error)
	Update(id, enterpriseID uuid.UUID, input map[string]interface{}) (*model.RepairOrder, error)
	FindByServiceOrderID(serviceOrderID string) (*model.RepairOrder, error)
	CommitTx(tx interface{})
	RollbackTx(tx interface{})
}
