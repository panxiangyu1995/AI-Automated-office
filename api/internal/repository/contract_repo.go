package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type ContractRepository interface {
	Create(c *model.Contract) error
	FindByID(id, enterpriseID uuid.UUID) (*model.Contract, error)
	FindByIDNoEnterprise(id string) (*model.Contract, error)
	List(enterpriseID uuid.UUID, status string, page, pageSize int) ([]model.Contract, int64, error)
	ListByCustomer(customerID, enterpriseID uuid.UUID) ([]model.Contract, error)
	Update(c *model.Contract) error
	Delete(c *model.Contract, enterpriseID uuid.UUID) error
	DeleteByID(id, enterpriseID uuid.UUID) (int64, error)
	PatchFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.Contract, error)
	UpdateFields(id, enterpriseID string, fields map[string]interface{}) error
	RestoreFields(id, enterpriseID string, fields map[string]interface{}) error
	UpdateStatus(id, enterpriseID uuid.UUID, status string) error
	CreateAttachment(att *model.ContractAttachment) error
	CreateReference(cr *model.ContractReference) error
	ListReferences(contractID uuid.UUID) ([]model.ContractReference, error)
}
