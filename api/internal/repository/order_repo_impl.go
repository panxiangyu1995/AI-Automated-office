package repository

import (
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type orderRepo struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepo{db: db}
}

// fresh returns a fresh session so that no WHERE/ORDER clauses leak between
// calls on the shared repository instance.
func (r *orderRepo) fresh() *gorm.DB {
	return r.db.Session(&gorm.Session{NewDB: true})
}

func (r *orderRepo) CreatePurchaseOrder(po *model.PurchaseOrder) error {
	return r.fresh().Create(po).Error
}

func (r *orderRepo) CreatePurchaseOrderItem(item *model.PurchaseOrderItem) error {
	return r.fresh().Create(item).Error
}

func (r *orderRepo) UpdatePurchaseOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error {
	return r.fresh().Model(&model.PurchaseOrder{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Update("total_amount", total).Error
}

func (r *orderRepo) FindPurchaseOrderByID(id, enterpriseID uuid.UUID) (*model.PurchaseOrder, error) {
	var po model.PurchaseOrder
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&po).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &po, nil
}

func (r *orderRepo) FindPurchaseOrderByIDNoEnterprise(id string) (*model.PurchaseOrder, error) {
	var po model.PurchaseOrder
	if err := r.fresh().Where("id=?", id).First(&po).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &po, nil
}

func (r *orderRepo) UpdatePurchaseOrder(po *model.PurchaseOrder) error {
	return r.fresh().Save(po).Error
}

func (r *orderRepo) ListPurchaseOrderItems(orderID string) ([]model.PurchaseOrderItem, error) {
	var items []model.PurchaseOrderItem
	if err := r.fresh().Where("order_id=?", orderID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *orderRepo) UpdatePurchaseOrderItemReceivedQty(id, enterpriseID uuid.UUID, receivedQty int) error {
	return r.fresh().Model(&model.PurchaseOrderItem{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Update("received_qty", receivedQty).Error
}

func (r *orderRepo) IncrementPurchaseOrderItemReceivedQty(id, enterpriseID string, delta int) error {
	return r.fresh().Model(&model.PurchaseOrderItem{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).
		Update("received_qty", gorm.Expr("received_qty + ?", delta)).Error
}

func (r *orderRepo) UpdatePurchaseOrderStatusByOrderID(orderID, enterpriseID string, status string) error {
	return r.fresh().Model(&model.PurchaseOrder{}).Where("id = ? AND enterprise_id = ?", orderID, enterpriseID).Update("status", status).Error
}

func (r *orderRepo) ListPurchaseOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.PurchaseOrder, int64, error) {
	var orders []model.PurchaseOrder
	var total int64
	q := r.fresh().Model(&model.PurchaseOrder{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *orderRepo) CreateSalesOrder(so *model.SalesOrder) error {
	return r.fresh().Create(so).Error
}

func (r *orderRepo) CreateSalesOrderItem(item *model.SalesOrderItem) error {
	return r.fresh().Create(item).Error
}

func (r *orderRepo) UpdateSalesOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error {
	return r.fresh().Model(&model.SalesOrder{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Update("total_amount", total).Error
}

func (r *orderRepo) FindSalesOrderByID(id, enterpriseID uuid.UUID) (*model.SalesOrder, error) {
	var so model.SalesOrder
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&so).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &so, nil
}

func (r *orderRepo) FindSalesOrderByIDNoEnterprise(id string) (*model.SalesOrder, error) {
	var so model.SalesOrder
	if err := r.fresh().Where("id=?", id).First(&so).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &so, nil
}

func (r *orderRepo) UpdateSalesOrder(so *model.SalesOrder) error {
	return r.fresh().Save(so).Error
}

func (r *orderRepo) ListSalesOrderItems(orderID string) ([]model.SalesOrderItem, error) {
	var items []model.SalesOrderItem
	if err := r.fresh().Where("order_id=?", orderID).Find(&items).Error; err != nil {
		return nil, err
	}
	return items, nil
}

func (r *orderRepo) UpdateSalesOrderItemShippedQty(id, enterpriseID uuid.UUID, shippedQty int) error {
	return r.fresh().Model(&model.SalesOrderItem{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Update("shipped_qty", shippedQty).Error
}

func (r *orderRepo) ListSalesOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.SalesOrder, int64, error) {
	var orders []model.SalesOrder
	var total int64
	q := r.fresh().Model(&model.SalesOrder{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *orderRepo) CreateTransferOrder(to *model.TransferOrder) error {
	return r.fresh().Create(to).Error
}

func (r *orderRepo) FindTransferOrderByID(id, enterpriseID uuid.UUID) (*model.TransferOrder, error) {
	var to model.TransferOrder
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&to).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &to, nil
}

func (r *orderRepo) FindTransferOrderByIDNoEnterprise(id string) (*model.TransferOrder, error) {
	var to model.TransferOrder
	if err := r.fresh().Where("id=?", id).First(&to).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &to, nil
}

func (r *orderRepo) UpdateTransferOrder(to *model.TransferOrder) error {
	return r.fresh().Save(to).Error
}

func (r *orderRepo) ListTransferOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.TransferOrder, int64, error) {
	var orders []model.TransferOrder
	var total int64
	q := r.fresh().Model(&model.TransferOrder{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *orderRepo) CreateRequisition(req *model.Requisition) error {
	return r.fresh().Create(req).Error
}

func (r *orderRepo) FindRequisitionByID(id, enterpriseID uuid.UUID) (*model.Requisition, error) {
	var req model.Requisition
	if err := r.fresh().Where("id=? AND enterprise_id=?", id, enterpriseID).First(&req).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &req, nil
}

func (r *orderRepo) FindRequisitionByIDNoEnterprise(id string) (*model.Requisition, error) {
	var req model.Requisition
	if err := r.fresh().Where("id=?", id).First(&req).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &req, nil
}

func (r *orderRepo) UpdateRequisitionFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	return r.fresh().Model(&model.Requisition{}).Where("id=? AND enterprise_id=?", id, enterpriseID).Updates(fields).Error
}

func (r *orderRepo) ListRequisitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.Requisition, int64, error) {
	var orders []model.Requisition
	var total int64
	q := r.fresh().Model(&model.Requisition{}).Where("enterprise_id=?", enterpriseID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&orders).Error; err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *orderRepo) ListStockFlows(enterpriseID uuid.UUID, whID, matID string, page, pageSize int) ([]model.StockFlow, int64, error) {
	var flows []model.StockFlow
	var total int64
	q := r.fresh().Model(&model.StockFlow{}).Where("enterprise_id=?", enterpriseID)
	if whID != "" {
		q = q.Where("warehouse_id=?", whID)
	}
	if matID != "" {
		q = q.Where("material_id=?", matID)
	}
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if err := q.Order("flow_time DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&flows).Error; err != nil {
		return nil, 0, err
	}
	return flows, total, nil
}

func (r *orderRepo) UpdatePurchaseOrderStatus(id, enterpriseID uuid.UUID, status string) error {
	return r.fresh().Model(&model.PurchaseOrder{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("status", status).Error
}

func (r *orderRepo) UpdateSalesOrderStatus(id, enterpriseID uuid.UUID, status string) error {
	return r.fresh().Model(&model.SalesOrder{}).Where("id = ? AND enterprise_id = ?", id, enterpriseID).Update("status", status).Error
}
