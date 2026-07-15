package repository

import (
	"github.com/google/uuid"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type QualityInspectionRepository interface {
	Create(inspection *model.QualityInspection) error
	FindByID(id, enterpriseID uuid.UUID) (*model.QualityInspection, error)
	ListByPurchaseOrder(purchaseOrderID uuid.UUID, page, pageSize int) ([]model.QualityInspection, int64, error)
	UpdateStatus(id, enterpriseID uuid.UUID, status string) error
	Update(inspection *model.QualityInspection) error
	CreateItem(item *model.QualityInspectionItem) error
	ListItems(inspectionID uuid.UUID) ([]model.QualityInspectionItem, error)
}
