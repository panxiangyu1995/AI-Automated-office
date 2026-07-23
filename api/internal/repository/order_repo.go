package repository

import (
	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type OrderRepository interface {
	CreatePurchaseOrder(po *model.PurchaseOrder) error
	CreatePurchaseOrderItem(item *model.PurchaseOrderItem) error
	UpdatePurchaseOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error
	FindPurchaseOrderByID(id, enterpriseID uuid.UUID) (*model.PurchaseOrder, error)
	FindPurchaseOrderByIDNoEnterprise(id string) (*model.PurchaseOrder, error)
	UpdatePurchaseOrder(po *model.PurchaseOrder) error
	ListPurchaseOrderItems(orderID string) ([]model.PurchaseOrderItem, error)
	UpdatePurchaseOrderItemReceivedQty(id, enterpriseID uuid.UUID, receivedQty int) error
	IncrementPurchaseOrderItemReceivedQty(id, enterpriseID string, delta int) error
	UpdatePurchaseOrderStatusByOrderID(orderID, enterpriseID string, status string) error
	ListPurchaseOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.PurchaseOrder, int64, error)
	UpdatePurchaseOrderStatus(id, enterpriseID uuid.UUID, status string) error
	CreateSalesOrder(so *model.SalesOrder) error
	CreateSalesOrderItem(item *model.SalesOrderItem) error
	UpdateSalesOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error
	FindSalesOrderByID(id, enterpriseID uuid.UUID) (*model.SalesOrder, error)
	FindSalesOrderByIDNoEnterprise(id string) (*model.SalesOrder, error)
	UpdateSalesOrder(so *model.SalesOrder) error
	ListSalesOrderItems(orderID string) ([]model.SalesOrderItem, error)
	UpdateSalesOrderItemShippedQty(id, enterpriseID uuid.UUID, shippedQty int) error
	ListSalesOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.SalesOrder, int64, error)
	UpdateSalesOrderStatus(id, enterpriseID uuid.UUID, status string) error
	CreateTransferOrder(to *model.TransferOrder) error
	FindTransferOrderByID(id, enterpriseID uuid.UUID) (*model.TransferOrder, error)
	FindTransferOrderByIDNoEnterprise(id string) (*model.TransferOrder, error)
	UpdateTransferOrder(to *model.TransferOrder) error
	ListTransferOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.TransferOrder, int64, error)
	CreateRequisition(req *model.Requisition) error
	FindRequisitionByID(id, enterpriseID uuid.UUID) (*model.Requisition, error)
	FindRequisitionByIDNoEnterprise(id string) (*model.Requisition, error)
	UpdateRequisitionFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error
	ListRequisitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.Requisition, int64, error)
	ListStockFlows(enterpriseID uuid.UUID, whID, matID string, page, pageSize int) ([]model.StockFlow, int64, error)
}
