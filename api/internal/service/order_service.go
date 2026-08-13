package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
	rc "github.com/panxiangyu1995/AI-Automated-office/api/pkg/redis"
)

type OrderService struct {
	orderRepo    repository.OrderRepository
	invRepo      repository.InventoryRepository
	matRepo      repository.MaterialRepository
	whRepo       repository.WarehouseRepository
	supRepo      repository.SupplierRepository
	custRepo     repository.CustomerRepository
	qiRepo       repository.QualityInspectionRepository
	lockProvider *rc.LockProvider
}

var salesOrderTransitions = map[string][]string{
	"draft":     {"confirmed", "cancelled"},
	"confirmed": {"shipped", "cancelled"},
	"shipped":   {"completed"},
	"completed": {},
	"cancelled": {},
}

func validSalesTransition(from, to string) bool {
	next, ok := salesOrderTransitions[from]
	if !ok {
		return false
	}
	for _, s := range next {
		if s == to {
			return true
		}
	}
	return false
}

func validSalesOrderStatus(status string) bool {
	_, ok := salesOrderTransitions[status]
	return ok
}

type OrderItemInput struct {
	MaterialID string  `json:"material_id"`
	Quantity   int     `json:"quantity"`
	UnitPrice  float64 `json:"unit_price"`
}

func NewOrderService(orderRepo repository.OrderRepository, invRepo repository.InventoryRepository, matRepo repository.MaterialRepository, whRepo repository.WarehouseRepository, supRepo repository.SupplierRepository, custRepo repository.CustomerRepository, qiRepo repository.QualityInspectionRepository, lockProvider *rc.LockProvider) *OrderService {
	return &OrderService{orderRepo, invRepo, matRepo, whRepo, supRepo, custRepo, qiRepo, lockProvider}
}

func generateOrderNo(prefix string) string {
	return fmt.Sprintf("%s-%s", prefix, uuid.New().String()[:8])
}

func (s *OrderService) CreatePurchaseOrder(eid, supplierID, notes string, items []OrderItemInput) (*model.PurchaseOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	if _, err := uuid.Parse(supplierID); err != nil {
		return nil, apperrors.NewValidationError("supplier_id", "供应商ID无效")
	}
	supUUID, _ := uuid.Parse(supplierID)
	sup, _ := s.supRepo.FindByID(supUUID, id)
	if sup == nil {
		return nil, apperrors.ErrNotFound.WithDetail("供应商不存在")
	}

	for i, item := range items {
		if _, err := uuid.Parse(item.MaterialID); err != nil {
			return nil, apperrors.NewValidationError("items["+fmt.Sprintf("%d", i)+"].material_id", "物料ID无效")
		}
	}

	po := &model.PurchaseOrder{OrderNo: generateOrderNo("PO"), SupplierID: supplierID, Status: "draft", Notes: notes}
	po.EnterpriseID = id
	if err := s.orderRepo.CreatePurchaseOrder(po); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建采购订单失败")
	}

	var total float64
	for _, item := range items {
		poItem := model.PurchaseOrderItem{OrderID: po.ID.String(), MaterialID: item.MaterialID, Quantity: item.Quantity, UnitPrice: item.UnitPrice}
		total += item.UnitPrice * float64(item.Quantity)
		if err := s.orderRepo.CreatePurchaseOrderItem(&poItem); err != nil {
			return nil, apperrors.ErrInternal.WithDetail("创建订单明细失败")
		}
	}
	if err := s.orderRepo.UpdatePurchaseOrderTotalAmount(po.ID, id, total); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新采购订单总额失败")
	}
	return po, nil
}

func (s *OrderService) ReceivePurchase(poID, whID string, requireInspection bool) (*model.PurchaseOrder, *apperrors.AppError) {
	_, err := uuid.Parse(poID)
	if err != nil {
		return nil, apperrors.NewValidationError("po_id", "无效")
	}
	po, dbErr := s.orderRepo.FindPurchaseOrderByIDNoEnterprise(poID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询采购订单失败")
	}
	if po == nil {
		return nil, apperrors.ErrNotFound.WithDetail("采购订单不存在")
	}

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
		if qty <= 0 {
			continue
		}
		matID, _ := uuid.Parse(item.MaterialID)
		whIDparsed, err := uuid.Parse(whID)
		if err != nil {
			return nil, apperrors.NewValidationError("warehouse_id", "仓库ID无效")
		}
		lock, acquired := s.lockProvider.AcquireInventoryLock(context.Background(), whIDparsed.String(), matID.String())
		if !acquired {
			return nil, apperrors.ErrBadRequest.WithDetail(fmt.Sprintf("物料 %s 库存操作冲突，请稍后重试", item.MaterialID))
		}
		adjErr := s.invRepo.AdjustQuantity(po.EnterpriseID, whIDparsed, matID, qty)
		lock.Release(context.Background())
		if adjErr != nil {
			return nil, apperrors.ErrInternal.WithDetail("更新库存失败")
		}
		s.orderRepo.UpdatePurchaseOrderItemReceivedQty(item.ID, po.EnterpriseID, item.ReceivedQty+qty)
	}

	po.Status = "received"
	s.orderRepo.UpdatePurchaseOrder(po)
	return po, nil
}

func (s *OrderService) CreateSalesOrder(eid, customerID, notes, orderNo, status string, totalAmount float64, items []OrderItemInput) (*model.SalesOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	if customerID != "" {
		if _, err := uuid.Parse(customerID); err != nil {
			return nil, apperrors.NewValidationError("customer_id", "客户ID无效")
		}
	} else {
		customerID = "00000000-0000-0000-0000-000000000000"
	}
	for i, item := range items {
		if _, err := uuid.Parse(item.MaterialID); err != nil {
			return nil, apperrors.NewValidationError("items["+fmt.Sprintf("%d", i)+"].material_id", "物料ID无效")
		}
	}
	if orderNo == "" {
		orderNo = generateOrderNo("SO")
	}
	if status == "" {
		status = "draft"
	}
	if !validSalesOrderStatus(status) {
		return nil, apperrors.NewValidationError("status", "无效的订单状态")
	}

	so := &model.SalesOrder{OrderNo: orderNo, CustomerID: customerID, Status: status, Notes: notes, TotalAmount: totalAmount}
	so.EnterpriseID = id
	if err := s.orderRepo.CreateSalesOrder(so); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建销售订单失败")
	}

	var total float64
	for _, item := range items {
		soItem := model.SalesOrderItem{OrderID: so.ID.String(), MaterialID: item.MaterialID, Quantity: item.Quantity, UnitPrice: item.UnitPrice}
		total += item.UnitPrice * float64(item.Quantity)
		if err := s.orderRepo.CreateSalesOrderItem(&soItem); err != nil {
			return nil, apperrors.ErrInternal.WithDetail("创建订单明细失败")
		}
	}
	if len(items) > 0 {
		s.orderRepo.UpdateSalesOrderTotalAmount(so.ID, id, total)
	}
	return so, nil
}

func (s *OrderService) ShipSalesOrder(soID, whID string) (*model.SalesOrder, *apperrors.AppError) {
	_, err := uuid.Parse(soID)
	if err != nil {
		return nil, apperrors.NewValidationError("so_id", "无效")
	}
	so, dbErr := s.orderRepo.FindSalesOrderByIDNoEnterprise(soID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询销售订单失败")
	}
	if so == nil {
		return nil, apperrors.ErrNotFound.WithDetail("销售订单不存在")
	}

	items, _ := s.orderRepo.ListSalesOrderItems(soID)

	for _, item := range items {
		qty := item.Quantity - item.ShippedQty
		if qty <= 0 {
			continue
		}
		whIDparsed, err := uuid.Parse(whID)
		if err != nil {
			return nil, apperrors.NewValidationError("warehouse_id", "仓库ID无效")
		}
		matID, err := uuid.Parse(item.MaterialID)
		if err != nil {
			return nil, apperrors.NewValidationError("material_id", "物料ID无效")
		}
		lock, acquired := s.lockProvider.AcquireInventoryLock(context.Background(), whIDparsed.String(), matID.String())
		if !acquired {
			return nil, apperrors.ErrBadRequest.WithDetail(fmt.Sprintf("物料 %s 库存操作冲突，请稍后重试", item.MaterialID))
		}
		adjErr := s.invRepo.AdjustQuantityWithCheck(so.EnterpriseID, whIDparsed, matID, -qty)
		lock.Release(context.Background())
		if adjErr != nil {
			return nil, apperrors.ErrBadRequest.WithDetail(fmt.Sprintf("物料 %s 库存不足", item.MaterialID))
		}
		s.orderRepo.UpdateSalesOrderItemShippedQty(item.ID, so.EnterpriseID, item.ShippedQty+qty)
	}

	so.Status = "shipped"
	s.orderRepo.UpdateSalesOrder(so)
	return so, nil
}

func (s *OrderService) CreateTransfer(eid, srcWh, tgtWh, matID string, qty int) (*model.TransferOrder, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	to := &model.TransferOrder{OrderNo: generateOrderNo("TO"), SourceWhID: srcWh, TargetWhID: tgtWh, MaterialID: matID, Quantity: qty, Status: "draft"}
	to.EnterpriseID = id
	if err := s.orderRepo.CreateTransferOrder(to); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建调拨单失败")
	}
	return to, nil
}

func (s *OrderService) ExecuteTransfer(toID string) (*model.TransferOrder, *apperrors.AppError) {
	tid, err := uuid.Parse(toID)
	if err != nil {
		return nil, apperrors.NewValidationError("to_id", "无效")
	}
	_ = tid
	to, dbErr := s.orderRepo.FindTransferOrderByIDNoEnterprise(toID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询调拨单失败")
	}
	if to == nil {
		return nil, apperrors.ErrNotFound.WithDetail("调拨单不存在")
	}

	srcWh, err := uuid.Parse(to.SourceWhID)
	if err != nil {
		return nil, apperrors.NewValidationError("source_wh_id", "源仓库ID无效")
	}
	tgtWh, err := uuid.Parse(to.TargetWhID)
	if err != nil {
		return nil, apperrors.NewValidationError("target_wh_id", "目标仓库ID无效")
	}
	matID, err := uuid.Parse(to.MaterialID)
	if err != nil {
		return nil, apperrors.NewValidationError("material_id", "物料ID无效")
	}

	lock, acquired := s.lockProvider.AcquireInventoryLock(context.Background(), srcWh.String(), matID.String())
	if !acquired {
		return nil, apperrors.ErrBadRequest.WithDetail("源仓库库存操作冲突，请稍后重试")
	}
	srcErr := s.invRepo.AdjustQuantityWithCheck(to.EnterpriseID, srcWh, matID, -to.Quantity)
	if srcErr != nil {
		lock.Release(context.Background())
		return nil, apperrors.ErrBadRequest.WithDetail("源仓库库存不足")
	}
	tgtLock, tgtAcquired := s.lockProvider.AcquireInventoryLock(context.Background(), tgtWh.String(), matID.String())
	if !tgtAcquired {
		s.invRepo.AdjustQuantity(to.EnterpriseID, srcWh, matID, to.Quantity)
		lock.Release(context.Background())
		return nil, apperrors.ErrBadRequest.WithDetail("目标仓库库存操作冲突，请稍后重试")
	}
	s.invRepo.AdjustQuantity(to.EnterpriseID, tgtWh, matID, to.Quantity)
	tgtLock.Release(context.Background())
	lock.Release(context.Background())

	to.Status = "completed"
	to.ReceivedQty = to.Quantity
	s.orderRepo.UpdateTransferOrder(to)
	return to, nil
}

func (s *OrderService) CreateRequisition(eid, applicantID, whID, matID string, qty int, notes string) (*model.Requisition, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, apperrors.NewValidationError("enterprise_id", "无效")
	}
	if applicantID == "" {
		return nil, apperrors.NewValidationError("applicant_id", "申请人ID不能为空")
	}
	if whID == "" {
		return nil, apperrors.NewValidationError("warehouse_id", "仓库ID不能为空")
	}
	if matID == "" {
		return nil, apperrors.NewValidationError("material_id", "物料ID不能为空")
	}
	if qty <= 0 {
		return nil, apperrors.NewValidationError("quantity", "领用数量必须大于0")
	}
	req := &model.Requisition{RequisitionNo: generateOrderNo("RQ"), ApplicantID: applicantID, WarehouseID: whID, MaterialID: matID, Quantity: qty, Status: "pending", Notes: notes}
	req.EnterpriseID = id
	if err := s.orderRepo.CreateRequisition(req); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建领用申请失败")
	}
	return req, nil
}

func (s *OrderService) IssueRequisition(reqID string, issuedQty int) (*model.Requisition, *apperrors.AppError) {
	rid, err := uuid.Parse(reqID)
	if err != nil {
		return nil, apperrors.NewValidationError("req_id", "无效")
	}
	req, dbErr := s.orderRepo.FindRequisitionByIDNoEnterprise(reqID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询领用申请失败")
	}
	if req == nil {
		return nil, apperrors.ErrNotFound.WithDetail("领用申请不存在")
	}

	whID, err := uuid.Parse(req.WarehouseID)
	if err != nil {
		return nil, apperrors.NewValidationError("warehouse_id", "仓库ID无效")
	}
	matID, err := uuid.Parse(req.MaterialID)
	if err != nil {
		return nil, apperrors.NewValidationError("material_id", "物料ID无效")
	}
	lock, acquired := s.lockProvider.AcquireInventoryLock(context.Background(), whID.String(), matID.String())
	if !acquired {
		return nil, apperrors.ErrBadRequest.WithDetail("库存操作冲突，请稍后重试")
	}
	adjErr := s.invRepo.AdjustQuantityWithCheck(req.EnterpriseID, whID, matID, -issuedQty)
	lock.Release(context.Background())
	if adjErr != nil {
		return nil, apperrors.ErrBadRequest.WithDetail("库存不足")
	}

	if err := s.orderRepo.UpdateRequisitionFields(rid, req.EnterpriseID, map[string]interface{}{"status": "issued", "issued_qty": issuedQty}); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新领用申请失败")
	}
	req.Status = "issued"
	req.IssuedQty = issuedQty
	return req, nil
}

func (s *OrderService) ListOrders(eid, orderType string, p, ps int) (interface{}, int64, *apperrors.AppError) {
	id, err := uuid.Parse(eid)
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	if p < 1 {
		p = 1
	}
	if ps < 1 || ps > 100 {
		ps = 20
	}

	switch orderType {
	case "purchase":
		orders, total, dbErr := s.orderRepo.ListPurchaseOrders(id, p, ps)
		if dbErr != nil {
			return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
		}
		return orders, total, nil
	case "sales":
		orders, total, dbErr := s.orderRepo.ListSalesOrders(id, p, ps)
		if dbErr != nil {
			return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
		}
		return orders, total, nil
	case "transfer":
		orders, total, dbErr := s.orderRepo.ListTransferOrders(id, p, ps)
		if dbErr != nil {
			return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
		}
		return orders, total, nil
	case "requisition":
		orders, total, dbErr := s.orderRepo.ListRequisitions(id, p, ps)
		if dbErr != nil {
			return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
		}
		return orders, total, nil
	}
	return nil, 0, apperrors.NewValidationError("order_type", "无效的订单类型")
}

func (s *OrderService) ChangeSalesOrderStatus(soID, newStatus string) (*model.SalesOrder, *apperrors.AppError) {
	_, err := uuid.Parse(soID)
	if err != nil {
		return nil, apperrors.NewValidationError("so_id", "无效")
	}
	so, dbErr := s.orderRepo.FindSalesOrderByIDNoEnterprise(soID)
	if dbErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询销售订单失败")
	}
	if so == nil {
		return nil, apperrors.ErrNotFound.WithDetail("销售订单不存在")
	}
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
	if err != nil {
		return nil, 0, apperrors.NewValidationError("enterprise_id", "无效")
	}
	if p < 1 {
		p = 1
	}
	if ps < 1 || ps > 100 {
		ps = 20
	}
	flows, total, dbErr := s.orderRepo.ListStockFlows(id, whID, matID, p, ps)
	if dbErr != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询失败")
	}
	return flows, total, nil
}
