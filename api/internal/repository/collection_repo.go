package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type CollectionRepository interface {
	CreateWithTx(r *model.CollectionRecord, invoiceID *string, amount float64, enterpriseID uuid.UUID) (*model.CollectionRecord, error)
	FindByID(id, enterpriseID uuid.UUID) (*model.CollectionRecord, error)
	List(enterpriseID uuid.UUID, page, pageSize int) ([]model.CollectionRecord, int64, error)
}
