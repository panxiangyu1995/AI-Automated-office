package service

import (
	"fmt"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type OrderService struct {
	db        *gorm.DB
	invRepo   repository.InventoryRepository
	matRepo   repository.MaterialRepository
	whRepo    repository.WarehouseRepository
	supRepo   repository.SupplierRepository
	custRepo  repository.CustomerRepository
}

var salesOrderTransitions = map[string][]string{
	"draft": {"confirmed", "cancelled"},
	"confirmed": {"shipped", "cancelled"},
	"shipped": {"completed"},
	"completed": {},
	"cancelled": {},
}

func validSalesTransition(from, to string) bool {
	next, ok := salesOrderTransitions[from]
	if !ok { return false }
	for _, s := range next { if s == to { return true } }
	return false
}

type OrderItemInput struct {
	MaterialID string  `json:"material_id"`
	Quantity   int     `json:"quantity"`
	UnitPrice  float64 `json:"unit_price"`
}

func NewOrderService(db *gorm.DB, invRepo repository.InventoryRepository, matRepo repository.MaterialRepository, whRepo repository.WarehouseRepository, supRepo repository.SupplierRepository, custRepo repository.CustomerRepository) *OrderService {
	return &OrderService{db, invRepo, matRepo, whRepo, supRepo, custRepo}
}

func generateOrderNo(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, uuid.New().String()[:8])
}

func (s *OrderService) CreatePurchaseOrder(eid, supplierID, notes string, items []OrderItemInput) (*model.PurchaseOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	sup, _ := s.supRepo.FindByID(uuid.MustParse(supplierID))
	if sup == nil { return nil, apperrors.ErrNotFound.WithDetail("供应商不存在") }

	po := &model.PurchaseOrder{OrderNo: generateOrderNo("PO"), SupplierID: supplierID, Status: "draft", Notes: notes}
	po.EnterpriseID = id
	if err := s.db.Create(po).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建采购订单失败: "+err.Error()) }

	var total float64
	for _, item := range items {
		poItem := model.PurchaseOrderItem{OrderID: po.ID.String(), MaterialID: item.MaterialID, Quantity: item.Quantity, UnitPrice: item.UnitPrice}
		total += item.UnitPrice * float64(item.Quantity)
		if err := s.db.Create(&poItem).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建订单明细失败: "+err.Error()) }
	}
	s.db.Model(po).Update("total_amount", total)
	return po, nil
}

func (s *OrderService) ReceivePurchase(poID, whID string) (*model.PurchaseOrder, *apperrors.AppError) {
	pid, err := uuid.Parse(poID); if err != nil { return nil, apperrors.NewValidationError("po_id", "无效") }
	var po model.PurchaseOrder
	if err := s.db.Where("id=?", pid).First(&po).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("采购订单不存在") }

	var items []model.PurchaseOrderItem
	s.db.Where("order_id=?", poID).Find(&items)

	for _, item := range items {
		qty := item.Quantity - item.ReceivedQty
		if qty <= 0 { continue }
		matID, _ := uuid.Parse(item.MaterialID)
		s.invRepo.Upsert(&model.WarehouseInventory{
			WarehouseID: uuid.MustParse(whID), MaterialID: matID, Quantity: qty,
		})
		s.db.Model(&item).Update("received_qty", item.ReceivedQty+qty)
	}

	po.Status = "received"
	s.db.Save(&po)
	return &po, nil
}

func (s *OrderService) CreateSalesOrder(eid, customerID, notes string, items []OrderItemInput) (*model.SalesOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	so := &model.SalesOrder{OrderNo: generateOrderNo("SO"), CustomerID: customerID, Status: "draft", Notes: notes}
	so.EnterpriseID = id
	if err := s.db.Create(so).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建销售订单失败: "+err.Error()) }

	var total float64
	for _, item := range items {
		soItem := model.SalesOrderItem{OrderID: so.ID.String(), MaterialID: item.MaterialID, Quantity: item.Quantity, UnitPrice: item.UnitPrice}
		total += item.UnitPrice * float64(item.Quantity)
		if err := s.db.Create(&soItem).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建订单明细失败: "+err.Error()) }
	}
	s.db.Model(so).Update("total_amount", total)
	return so, nil
}

func (s *OrderService) ShipSalesOrder(soID, whID string) (*model.SalesOrder, *apperrors.AppError) {
	sid, err := uuid.Parse(soID); if err != nil { return nil, apperrors.NewValidationError("so_id", "无效") }
	var so model.SalesOrder
	if err := s.db.Where("id=?", sid).First(&so).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("销售订单不存在") }

	var items []model.SalesOrderItem
	s.db.Where("order_id=?", soID).Find(&items)

	for _, item := range items {
		qty := item.Quantity - item.ShippedQty
		if qty <= 0 { continue }
		whIDparsed := uuid.MustParse(whID)
		matID := uuid.MustParse(item.MaterialID)
		inv, _ := s.invRepo.Find(whIDparsed, matID)
		if inv == nil || inv.Quantity < qty { return nil, apperrors.ErrBadRequest.WithDetail(fmt.Sprintf("物料 %s 库存不足", item.MaterialID)) }
		inv.Quantity -= qty
		s.invRepo.Upsert(inv)
		s.db.Model(&item).Update("shipped_qty", item.ShippedQty+qty)
	}

	so.Status = "shipped"
	s.db.Save(&so)
	return &so, nil
}

func (s *OrderService) CreateTransfer(eid, srcWh, tgtWh, matID string, qty int) (*model.TransferOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	to := &model.TransferOrder{OrderNo: generateOrderNo("TO"), SourceWhID: srcWh, TargetWhID: tgtWh, MaterialID: matID, Quantity: qty, Status: "draft"}
	to.EnterpriseID = id
	if err := s.db.Create(to).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建调拨单失败: "+err.Error()) }
	return to, nil
}

func (s *OrderService) ExecuteTransfer(toID string) (*model.TransferOrder, *apperrors.AppError) {
	tid, err := uuid.Parse(toID); if err != nil { return nil, apperrors.NewValidationError("to_id", "无效") }
	var to model.TransferOrder
	if err := s.db.Where("id=?", tid).First(&to).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("调拨单不存在") }

	srcWh := uuid.MustParse(to.SourceWhID)
	tgtWh := uuid.MustParse(to.TargetWhID)
	matID := uuid.MustParse(to.MaterialID)

	inv, _ := s.invRepo.Find(srcWh, matID)
	if inv == nil || inv.Quantity < to.Quantity { return nil, apperrors.ErrBadRequest.WithDetail("源仓库库存不足") }
	inv.Quantity -= to.Quantity
	s.invRepo.Upsert(inv)
	s.invRepo.Upsert(&model.WarehouseInventory{WarehouseID: tgtWh, MaterialID: matID, Quantity: to.Quantity})

	to.Status = "completed"
	to.ReceivedQty = to.Quantity
	s.db.Save(&to)
	return &to, nil
}

func (s *OrderService) CreateRequisition(eid, applicantID, whID, matID string, qty int, notes string) (*model.Requisition, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	req := &model.Requisition{RequisitionNo: generateOrderNo("RQ"), ApplicantID: applicantID, WarehouseID: whID, MaterialID: matID, Quantity: qty, Status: "pending", Notes: notes}
	req.EnterpriseID = id
	if err := s.db.Create(req).Error; err != nil { return nil, apperrors.ErrInternal.WithDetail("创建领用申请失败: "+err.Error()) }
	return req, nil
}

func (s *OrderService) IssueRequisition(reqID string, issuedQty int) (*model.Requisition, *apperrors.AppError) {
	rid, err := uuid.Parse(reqID); if err != nil { return nil, apperrors.NewValidationError("req_id", "无效") }
	var req model.Requisition
	if err := s.db.Where("id=?", rid).First(&req).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("领用申请不存在") }

	whID := uuid.MustParse(req.WarehouseID)
	matID := uuid.MustParse(req.MaterialID)
	inv, _ := s.invRepo.Find(whID, matID)
	if inv == nil || inv.Quantity < issuedQty { return nil, apperrors.ErrBadRequest.WithDetail("库存不足") }
	inv.Quantity -= issuedQty
	s.invRepo.Upsert(inv)

	req.Status = "issued"
	req.IssuedQty = issuedQty
	s.db.Model(&req).Updates(map[string]interface{}{"status": "issued", "issued_qty": issuedQty})
	return &req, nil
}

func (s *OrderService) ListOrders(eid, orderType string, p, ps int) (interface{}, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }

	switch orderType {
	case "purchase":
		var orders []model.PurchaseOrder; var total int64
		s.db.Model(&model.PurchaseOrder{}).Where("enterprise_id=?", id).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&orders)
		return orders, total, nil
	case "sales":
		var orders []model.SalesOrder; var total int64
		s.db.Model(&model.SalesOrder{}).Where("enterprise_id=?", id).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&orders)
		return orders, total, nil
	case "transfer":
		var orders []model.TransferOrder; var total int64
		s.db.Model(&model.TransferOrder{}).Where("enterprise_id=?", id).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&orders)
		return orders, total, nil
	case "requisition":
		var orders []model.Requisition; var total int64
		s.db.Model(&model.Requisition{}).Where("enterprise_id=?", id).Count(&total).Order("created_at DESC").Offset((p-1)*ps).Limit(ps).Find(&orders)
		return orders, total, nil
	}
	return nil, 0, apperrors.NewValidationError("order_type", "无效的订单类型")
}

func (s *OrderService) ChangeSalesOrderStatus(soID, newStatus string) (*model.SalesOrder, *apperrors.AppError) {
	sid, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("so_id", "无效") }
	var so model.SalesOrder
	if err := s.db.Where("id=?", sid).First(&so).Error; err != nil { return nil, apperrors.ErrNotFound.WithDetail("销售订单不存在") }
	if !validSalesTransition(so.Status, newStatus) {
		return nil, &apperrors.AppError{Code: "SALE_INVALID_STATUS", Message: "非法状态流转", Status: 400,
			Detail: fmt.Sprintf("不能从 %s 转换到 %s", so.Status, newStatus)}
	}
	so.Status = newStatus
	s.db.Save(&so)
	return &so, nil
}

func (s *OrderService) ListStockFlows(eid, whID, matID string, p, ps int) ([]model.StockFlow, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	var flows []model.StockFlow; var total int64
	q := s.db.Model(&model.StockFlow{}).Where("enterprise_id=?", id)
	if whID != "" { q = q.Where("warehouse_id=?", whID) }
	if matID != "" { q = q.Where("material_id=?", matID) }
	q.Count(&total).Order("flow_time DESC").Offset((p-1)*ps).Limit(ps).Find(&flows)
	return flows, total, nil
}
