package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ServiceOrderRepository interface {
	Create(order *model.ServiceOrder) error
	FindByID(id, enterpriseID uuid.UUID) (*model.ServiceOrder, error)
	Save(order *model.ServiceOrder) error
	Delete(order *model.ServiceOrder, enterpriseID uuid.UUID) error
	List(enterpriseID uuid.UUID, orderType, status string, page, pageSize int) ([]model.ServiceOrder, int64, error)
	ListByCustomer(customerID, enterpriseID uuid.UUID) ([]model.ServiceOrder, error)
	UpdateStatus(id, enterpriseID uuid.UUID, status string) error
	CreateFileMetadata(meta *model.FileMetadata) error
	ListFileMetadata(refType, refID string) ([]model.FileMetadata, error)
}
