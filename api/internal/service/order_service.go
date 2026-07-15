package service

import (
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type OrderService struct {
	orderRepo repository.OrderRepository
	invRepo   repository.InventoryRepository
	matRepo   repository.MaterialRepository
	whRepo    repository.WarehouseRepository
	supRepo   repository.SupplierRepository
	custRepo  repository.CustomerRepository
	qiRepo    repository.QualityInspectionRepository
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

func NewOrderService(orderRepo repository.OrderRepository, invRepo repository.InventoryRepository, matRepo repository.MaterialRepository, whRepo repository.WarehouseRepository, supRepo repository.SupplierRepository, custRepo repository.CustomerRepository, qiRepo repository.QualityInspectionRepository) *OrderService {
	return &OrderService{orderRepo, invRepo, matRepo, whRepo, supRepo, custRepo, qiRepo}
}

func generateOrderNo(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, uuid.New().String()[:8])
}

func (s *OrderService) CreatePurchaseOrder(eid, supplierID, notes string, items []OrderItemInput) (*model.PurchaseOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	if _, err := uuid.Parse(supplierID); err != nil {
		return nil, apperrors.NewValidationError("supplier_id", "供应商ID无效")
	}
	sup, _ := s.supRepo.FindByID(uuid.MustParse(supplierID), id)
	if sup == nil { return nil, apperrors.ErrNotFound.WithDetail("供应商不存在") }

	for i, item := range items {
		if _, err := uuid.Parse(item.MaterialID); err != nil {
			return nil, apperrors.NewValidationError("items["+fmt.Sprintf("%d", i)+"].material_id", "物料ID无效")
		}
	}

	po := &model.PurchaseOrder{OrderNo: generateOrderNo("PO"), SupplierID: supplierID, Status: "draft", Notes: notes}
	po.EnterpriseID = id
	if err := s.orderRepo.CreatePurchaseOrder(po); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建采购订单失败") }

	var total float64
	for _, item := range items {
		poItem := model.PurchaseOrderItem{OrderID: po.ID.String(), MaterialID: item.MaterialID, Quantity: item.Quantity, UnitPrice: item.UnitPrice}
		total += item.UnitPrice * float64(item.Quantity)
		if err := s.orderRepo.CreatePurchaseOrderItem(&poItem); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建订单明细失败") }
	}
	s.orderRepo.UpdatePurchaseOrderTotalAmount(po.ID, id, total)
	return po, nil
}

func (s *OrderService) ReceivePurchase(poID, whID string, requireInspection bool) (*model.PurchaseOrder, *apperrors.AppError) {
	pid, err := uuid.Parse(poID); if err != nil { return nil, apperrors.NewValidationError("po_id", "无效") }
	po, dbErr := s.orderRepo.FindPurchaseOrderByID(pid, uuid.Nil)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询采购订单失败") }
	if po == nil { return nil, apperrors.ErrNotFound.WithDetail("采购订单不存在") }

	if requireInspection {
		qi := &model.QualityInspection{
			PurchaseOrderID: poID,
			InspectionNo:    generateOrderNo("QI"),
			Status:          "pending",
		}
		qi.EnterpriseID = po.EnterpriseID
		if err := s.qiRepo.Create(qi); err != nil {
			return nil, apperrors.ErrInternal.WithDetail("创建质检单失败")
		}
		po.Status = "inspecting"
		s.orderRepo.UpdatePurchaseOrder(po)
		return po, nil
	}

	items, _ := s.orderRepo.ListPurchaseOrderItems(poID)

	for _, item := range items {
		qty := item.Quantity - item.ReceivedQty
		if qty <= 0 { continue }
		matID, _ := uuid.Parse(item.MaterialID)
		s.invRepo.Upsert(&model.WarehouseInventory{
			WarehouseID: uuid.MustParse(whID), MaterialID: matID, Quantity: qty,
		})
		s.orderRepo.UpdatePurchaseOrderItemReceivedQty(item.ID, po.EnterpriseID, item.ReceivedQty+qty)
	}

	po.Status = "received"
	s.orderRepo.UpdatePurchaseOrder(po)
	return po, nil
}

func (s *OrderService) CreateSalesOrder(eid, customerID, notes string, items []OrderItemInput) (*model.SalesOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	if _, err := uuid.Parse(customerID); err != nil {
		return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
	}
	for i, item := range items {
		if _, err := uuid.Parse(item.MaterialID); err != nil {
			return nil, apperrors.NewValidationError("items["+fmt.Sprintf("%d", i)+"].material_id", "物料ID无效")
		}
	}

	so := &model.SalesOrder{OrderNo: generateOrderNo("SO"), CustomerID: customerID, Status: "draft", Notes: notes}
	so.EnterpriseID = id
	if err := s.orderRepo.CreateSalesOrder(so); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建销售订单失败") }

	var total float64
	for _, item := range items {
		soItem := model.SalesOrderItem{OrderID: so.ID.String(), MaterialID: item.MaterialID, Quantity: item.Quantity, UnitPrice: item.UnitPrice}
		total += item.UnitPrice * float64(item.Quantity)
		if err := s.orderRepo.CreateSalesOrderItem(&soItem); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建订单明细失败") }
	}
	s.orderRepo.UpdateSalesOrderTotalAmount(so.ID, id, total)
	return so, nil
}

func (s *OrderService) ShipSalesOrder(soID, whID string) (*model.SalesOrder, *apperrors.AppError) {
	sid, err := uuid.Parse(soID); if err != nil { return nil, apperrors.NewValidationError("so_id", "无效") }
	so, dbErr := s.orderRepo.FindSalesOrderByID(sid, uuid.Nil)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询销售订单失败") }
	if so == nil { return nil, apperrors.ErrNotFound.WithDetail("销售订单不存在") }

	items, _ := s.orderRepo.ListSalesOrderItems(soID)

	for _, item := range items {
		qty := item.Quantity - item.ShippedQty
		if qty <= 0 { continue }
		whIDparsed := uuid.MustParse(whID)
		matID := uuid.MustParse(item.MaterialID)
		inv, _ := s.invRepo.Find(whIDparsed, matID)
		if inv == nil || inv.Quantity < qty { return nil, apperrors.ErrBadRequest.WithDetail(fmt.Sprintf("物料 %s 库存不足", item.MaterialID)) }
		inv.Quantity -= qty
		s.invRepo.Upsert(inv)
		s.orderRepo.UpdateSalesOrderItemShippedQty(item.ID, so.EnterpriseID, item.ShippedQty+qty)
	}

	so.Status = "shipped"
	s.orderRepo.UpdateSalesOrder(so)
	return so, nil
}

func (s *OrderService) CreateTransfer(eid, srcWh, tgtWh, matID string, qty int) (*model.TransferOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	to := &model.TransferOrder{OrderNo: generateOrderNo("TO"), SourceWhID: srcWh, TargetWhID: tgtWh, MaterialID: matID, Quantity: qty, Status: "draft"}
	to.EnterpriseID = id
	if err := s.orderRepo.CreateTransferOrder(to); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建调拨单失败") }
	return to, nil
}

func (s *OrderService) ExecuteTransfer(toID string) (*model.TransferOrder, *apperrors.AppError) {
	tid, err := uuid.Parse(toID); if err != nil { return nil, apperrors.NewValidationError("to_id", "无效") }
	to, dbErr := s.orderRepo.FindTransferOrderByID(tid, uuid.Nil)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询调拨单失败") }
	if to == nil { return nil, apperrors.ErrNotFound.WithDetail("调拨单不存在") }

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
	s.orderRepo.UpdateTransferOrder(to)
	return to, nil
}

func (s *OrderService) CreateRequisition(eid, applicantID, whID, matID string, qty int, notes string) (*model.Requisition, *apperrors.AppError) {
	id, err := uuid.Parse(eid); if err != nil { return nil, apperrors.NewValidationError("enterprise_id", "无效") }
	req := &model.Requisition{RequisitionNo: generateOrderNo("RQ"), ApplicantID: applicantID, WarehouseID: whID, MaterialID: matID, Quantity: qty, Status: "pending", Notes: notes}
	req.EnterpriseID = id
	if err := s.orderRepo.CreateRequisition(req); err != nil { return nil, apperrors.ErrInternal.WithDetail("创建领用申请失败") }
	return req, nil
}

func (s *OrderService) IssueRequisition(reqID string, issuedQty int) (*model.Requisition, *apperrors.AppError) {
	rid, err := uuid.Parse(reqID); if err != nil { return nil, apperrors.NewValidationError("req_id", "无效") }
	req, dbErr := s.orderRepo.FindRequisitionByID(rid, uuid.Nil)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询领用申请失败") }
	if req == nil { return nil, apperrors.ErrNotFound.WithDetail("领用申请不存在") }

	whID := uuid.MustParse(req.WarehouseID)
	matID := uuid.MustParse(req.MaterialID)
	inv, _ := s.invRepo.Find(whID, matID)
	if inv == nil || inv.Quantity < issuedQty { return nil, apperrors.ErrBadRequest.WithDetail("库存不足") }
	inv.Quantity -= issuedQty
	s.invRepo.Upsert(inv)

	if err := s.orderRepo.UpdateRequisitionFields(rid, req.EnterpriseID, map[string]interface{}{"status": "issued", "issued_qty": issuedQty}); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新领用申请失败")
	}
	req.Status = "issued"
	req.IssuedQty = issuedQty
	return req, nil
}

func (s *OrderService) ListOrders(eid, orderType string, p, ps int) (interface{}, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }

	switch orderType {
	case "purchase":
		orders, total, dbErr := s.orderRepo.ListPurchaseOrders(id, p, ps)
		if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
		return orders, total, nil
	case "sales":
		orders, total, dbErr := s.orderRepo.ListSalesOrders(id, p, ps)
		if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
		return orders, total, nil
	case "transfer":
		orders, total, dbErr := s.orderRepo.ListTransferOrders(id, p, ps)
		if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
		return orders, total, nil
	case "requisition":
		orders, total, dbErr := s.orderRepo.ListRequisitions(id, p, ps)
		if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
		return orders, total, nil
	}
	return nil, 0, apperrors.NewValidationError("order_type", "无效的订单类型")
}

func (s *OrderService) ChangeSalesOrderStatus(soID, newStatus string) (*model.SalesOrder, *apperrors.AppError) {
	sid, err := uuid.Parse(soID)
	if err != nil { return nil, apperrors.NewValidationError("so_id", "无效") }
	so, dbErr := s.orderRepo.FindSalesOrderByID(sid, uuid.Nil)
	if dbErr != nil { return nil, apperrors.ErrInternal.WithDetail("查询销售订单失败") }
	if so == nil { return nil, apperrors.ErrNotFound.WithDetail("销售订单不存在") }
	if !validSalesTransition(so.Status, newStatus) {
		return nil, &apperrors.AppError{Code: "SALE_INVALID_STATUS", Message: "非法状态流转", Status: 400,
			Detail: fmt.Sprintf("不能从 %s 转换到 %s", so.Status, newStatus)}
	}
	so.Status = newStatus
	s.orderRepo.UpdateSalesOrder(so)
	return so, nil
}

func (s *OrderService) ListStockFlows(eid, whID, matID string, p, ps int) ([]model.StockFlow, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil { return nil, 0, apperrors.NewValidationError("enterprise_id", "无效") }
	if p < 1 { p = 1 }; if ps < 1 || ps > 100 { ps = 20 }
	flows, total, dbErr := s.orderRepo.ListStockFlows(id, whID, matID, p, ps)
	if dbErr != nil { return nil, 0, apperrors.ErrInternal.WithDetail("查询失败") }
	return flows, total, nil
}
