package repository

import (
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type PaymentPlanRepository interface {
	CreateBatch(plans []model.PaymentPlan) error
	FindByID(id, enterpriseID uuid.UUID) (*model.PaymentPlan, error)
	UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.PaymentPlan, error)
	Delete(id, enterpriseID uuid.UUID) error
	ListByContractID(contractID string) ([]model.PaymentPlan, error)
	ListOverdue(enterpriseID uuid.UUID, status string, before time.Time) ([]model.PaymentPlan, error)
	FindPendingUnreminded(before time.Time) ([]model.PaymentPlan, error)
	UpdatePlanFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error
	UpdatePlanReminderSent(id, enterpriseID uuid.UUID) error
}
