package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type PaymentRequestRepository interface {
	Create(r *model.PaymentRequest) error
	FindByID(id, enterpriseID uuid.UUID) (*model.PaymentRequest, error)
	List(enterpriseID uuid.UUID, status string, page, pageSize int) ([]model.PaymentRequest, int64, error)
	UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.PaymentRequest, error)
	Delete(r *model.PaymentRequest, enterpriseID uuid.UUID) error
	Save(r *model.PaymentRequest) error
}
