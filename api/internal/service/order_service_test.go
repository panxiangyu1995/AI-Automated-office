package service

import (
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockOrderRepo struct {
	purchaseOrders map[string]*model.PurchaseOrder
	salesOrders    map[string]*model.SalesOrder
	transferOrders map[string]*model.TransferOrder
	requisitions   map[string]*model.Requisition
}

func newMockOrderRepo() *mockOrderRepo {
	return &mockOrderRepo{
		purchaseOrders: make(map[string]*model.PurchaseOrder),
		salesOrders:    make(map[string]*model.SalesOrder),
		transferOrders: make(map[string]*model.TransferOrder),
		requisitions:   make(map[string]*model.Requisition),
	}
}

func (m *mockOrderRepo) CreatePurchaseOrder(po *model.PurchaseOrder) error {
	if po.ID == uuid.Nil {
		po.ID = uuid.New()
	}
	m.purchaseOrders[po.ID.String()] = po
	return nil
}
func (m *mockOrderRepo) CreatePurchaseOrderItem(item *model.PurchaseOrderItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	return nil
}
func (m *mockOrderRepo) UpdatePurchaseOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error {
	if po, ok := m.purchaseOrders[id.String()]; ok {
		po.TotalAmount = total
	}
	return nil
}
func (m *mockOrderRepo) FindPurchaseOrderByID(id, enterpriseID uuid.UUID) (*model.PurchaseOrder, error) {
	po, ok := m.purchaseOrders[id.String()]
	if !ok {
		return nil, nil
	}
	return po, nil
}
func (m *mockOrderRepo) UpdatePurchaseOrder(po *model.PurchaseOrder) error {
	m.purchaseOrders[po.ID.String()] = po
	return nil
}
func (m *mockOrderRepo) ListPurchaseOrderItems(orderID string) ([]model.PurchaseOrderItem, error) {
	return nil, nil
}
func (m *mockOrderRepo) UpdatePurchaseOrderItemReceivedQty(id, enterpriseID uuid.UUID, receivedQty int) error {
	return nil
}
func (m *mockOrderRepo) IncrementPurchaseOrderItemReceivedQty(id string, delta int) error {
	return nil
}
func (m *mockOrderRepo) UpdatePurchaseOrderStatusByOrderID(orderID string, status string) error {
	if po, ok := m.purchaseOrders[orderID]; ok {
		po.Status = status
	}
	return nil
}
func (m *mockOrderRepo) ListPurchaseOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.PurchaseOrder, int64, error) {
	var result []model.PurchaseOrder
	for _, po := range m.purchaseOrders {
		if po.EnterpriseID == enterpriseID {
			result = append(result, *po)
		}
	}
	return result, int64(len(result)), nil
}
func (m *mockOrderRepo) CreateSalesOrder(so *model.SalesOrder) error {
	if so.ID == uuid.Nil {
		so.ID = uuid.New()
	}
	m.salesOrders[so.ID.String()] = so
	return nil
}
func (m *mockOrderRepo) CreateSalesOrderItem(item *model.SalesOrderItem) error {
	if item.ID == uuid.Nil {
		item.ID = uuid.New()
	}
	return nil
}
func (m *mockOrderRepo) UpdateSalesOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error {
	if so, ok := m.salesOrders[id.String()]; ok {
		so.TotalAmount = total
	}
	return nil
}
func (m *mockOrderRepo) FindSalesOrderByID(id, enterpriseID uuid.UUID) (*model.SalesOrder, error) {
	so, ok := m.salesOrders[id.String()]
	if !ok {
		return nil, nil
	}
	return so, nil
}
func (m *mockOrderRepo) UpdateSalesOrder(so *model.SalesOrder) error {
	m.salesOrders[so.ID.String()] = so
	return nil
}
func (m *mockOrderRepo) ListSalesOrderItems(orderID string) ([]model.SalesOrderItem, error) {
	return nil, nil
}
func (m *mockOrderRepo) UpdateSalesOrderItemShippedQty(id, enterpriseID uuid.UUID, shippedQty int) error {
	return nil
}
func (m *mockOrderRepo) ListSalesOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.SalesOrder, int64, error) {
	var result []model.SalesOrder
	for _, so := range m.salesOrders {
		if so.EnterpriseID == enterpriseID {
			result = append(result, *so)
		}
	}
	return result, int64(len(result)), nil
}
func (m *mockOrderRepo) CreateTransferOrder(to *model.TransferOrder) error {
	if to.ID == uuid.Nil {
		to.ID = uuid.New()
	}
	m.transferOrders[to.ID.String()] = to
	return nil
}
func (m *mockOrderRepo) FindTransferOrderByID(id, enterpriseID uuid.UUID) (*model.TransferOrder, error) {
	to, ok := m.transferOrders[id.String()]
	if !ok {
		return nil, nil
	}
	return to, nil
}
func (m *mockOrderRepo) UpdateTransferOrder(to *model.TransferOrder) error {
	m.transferOrders[to.ID.String()] = to
	return nil
}
func (m *mockOrderRepo) ListTransferOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.TransferOrder, int64, error) {
	var result []model.TransferOrder
	for _, to := range m.transferOrders {
		if to.EnterpriseID == enterpriseID {
			result = append(result, *to)
		}
	}
	return result, int64(len(result)), nil
}
func (m *mockOrderRepo) CreateRequisition(req *model.Requisition) error {
	if req.ID == uuid.Nil {
		req.ID = uuid.New()
	}
	m.requisitions[req.ID.String()] = req
	return nil
}
func (m *mockOrderRepo) FindRequisitionByID(id, enterpriseID uuid.UUID) (*model.Requisition, error) {
	req, ok := m.requisitions[id.String()]
	if !ok {
		return nil, nil
	}
	return req, nil
}
func (m *mockOrderRepo) UpdateRequisitionFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	req, ok := m.requisitions[id.String()]
	if !ok {
		return nil
	}
	if v, ok := fields["status"]; ok {
		req.Status = v.(string)
	}
	if v, ok := fields["issued_qty"]; ok {
		req.IssuedQty = v.(int)
	}
	return nil
}
func (m *mockOrderRepo) ListRequisitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.Requisition, int64, error) {
	var result []model.Requisition
	for _, req := range m.requisitions {
		if req.EnterpriseID == enterpriseID {
			result = append(result, *req)
		}
	}
	return result, int64(len(result)), nil
}
func (m *mockOrderRepo) ListStockFlows(enterpriseID uuid.UUID, whID, matID string, page, pageSize int) ([]model.StockFlow, int64, error) {
	return nil, 0, nil
}
func (m *mockOrderRepo) FindSalesOrderByIDNoEnterprise(id string) (*model.SalesOrder, error) {
	so, ok := m.salesOrders[id]
	if !ok {
		return nil, nil
	}
	return so, nil
}

func (m *mockOrderRepo) FindPurchaseOrderByIDNoEnterprise(id string) (*model.PurchaseOrder, error) {
	po, ok := m.purchaseOrders[id]
	if !ok {
		return nil, nil
	}
	return po, nil
}

func (m *mockOrderRepo) FindTransferOrderByIDNoEnterprise(id string) (*model.TransferOrder, error) {
	return nil, nil
}

func (m *mockOrderRepo) FindRequisitionByIDNoEnterprise(id string) (*model.Requisition, error) {
	return nil, nil
}

func (m *mockOrderRepo) UpdatePurchaseOrderStatus(id, enterpriseID uuid.UUID, status string) error {
	if po, ok := m.purchaseOrders[id.String()]; ok {
		po.Status = status
	}
	return nil
}
func (m *mockOrderRepo) UpdateSalesOrderStatus(id, enterpriseID uuid.UUID, status string) error {
	if so, ok := m.salesOrders[id.String()]; ok {
		so.Status = status
	}
	return nil
}

type mockSupplierRepoForOrder struct {
	suppliers map[string]*model.Supplier
}

func newMockSupplierRepoForOrder() *mockSupplierRepoForOrder {
	return &mockSupplierRepoForOrder{suppliers: make(map[string]*model.Supplier)}
}

func (m *mockSupplierRepoForOrder) Create(s *model.Supplier) error { return nil }
func (m *mockSupplierRepoForOrder) Update(s *model.Supplier) error { return nil }
func (m *mockSupplierRepoForOrder) Delete(id, enterpriseID uuid.UUID) error { return nil }
func (m *mockSupplierRepoForOrder) FindByID(id, enterpriseID uuid.UUID) (*model.Supplier, error) {
	s, ok := m.suppliers[id.String()]
	if !ok {
		return nil, nil
	}
	return s, nil
}
func (m *mockSupplierRepoForOrder) ListByEnterprise(eid uuid.UUID, p, ps int) ([]model.Supplier, int64, error) {
	return nil, 0, nil
}
func (m *mockSupplierRepoForOrder) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	return 0, nil
}

type mockInvRepoForOrder struct {
	inventory map[string]*model.WarehouseInventory
}

func newMockInvRepoForOrder() *mockInvRepoForOrder {
	return &mockInvRepoForOrder{inventory: make(map[string]*model.WarehouseInventory)}
}

func (m *mockInvRepoForOrder) Upsert(inv *model.WarehouseInventory) error {
	key := inv.WarehouseID.String() + ":" + inv.MaterialID.String()
	m.inventory[key] = inv
	return nil
}
func (m *mockInvRepoForOrder) AdjustQuantity(eid, whID, matID uuid.UUID, delta int) error {
	key := whID.String() + ":" + matID.String()
	inv, ok := m.inventory[key]
	if !ok {
		inv = &model.WarehouseInventory{WarehouseID: whID, MaterialID: matID, Quantity: 0}
	}
	inv.Quantity += delta
	m.inventory[key] = inv
	return nil
}
func (m *mockInvRepoForOrder) AdjustQuantityWithCheck(eid, whID, matID uuid.UUID, delta int) error {
	key := whID.String() + ":" + matID.String()
	inv, ok := m.inventory[key]
	if !ok {
		inv = &model.WarehouseInventory{WarehouseID: whID, MaterialID: matID, Quantity: 0}
	}
	if inv.Quantity+delta < 0 {
		return fmt.Errorf("insufficient stock")
	}
	inv.Quantity += delta
	m.inventory[key] = inv
	return nil
}
func (m *mockInvRepoForOrder) Find(whID, matID uuid.UUID) (*model.WarehouseInventory, error) {
	key := whID.String() + ":" + matID.String()
	inv, ok := m.inventory[key]
	if !ok {
		return nil, nil
	}
	return inv, nil
}
func (m *mockInvRepoForOrder) FindByID(id, enterpriseID uuid.UUID) (*model.WarehouseInventory, error) {
	return nil, nil
}
func (m *mockInvRepoForOrder) ListByWarehouse(whID uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	return nil, 0, nil
}
func (m *mockInvRepoForOrder) ListByMaterial(matID uuid.UUID) ([]model.WarehouseInventory, error) {
	return nil, nil
}
func (m *mockInvRepoForOrder) ListLowStock(eid uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	return nil, 0, nil
}

type noopMatRepo struct{}
type noopWhRepo struct{}
type noopCustRepo struct{}
type noopQIRepo struct{}

func (m *noopMatRepo) Create(mat *model.Material) error                     { return nil }
func (m *noopMatRepo) Update(mat *model.Material) error                     { return nil }
func (m *noopMatRepo) Delete(id, enterpriseID uuid.UUID) error                   { return nil }
func (m *noopMatRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Material, error) {
	return nil, nil
}
func (m *noopMatRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Material, int64, error) {
	return nil, 0, nil
}
func (m *noopMatRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	return 0, nil
}
func (m *noopWhRepo) Create(w *model.Warehouse) error                     { return nil }
func (m *noopWhRepo) Update(w *model.Warehouse) error                     { return nil }
func (m *noopWhRepo) Delete(id, enterpriseID uuid.UUID) error                   { return nil }
func (m *noopWhRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Warehouse, error) {
	return nil, nil
}
func (m *noopWhRepo) ListByEnterprise(eid uuid.UUID, p, ps int) ([]model.Warehouse, int64, error) {
	return nil, 0, nil
}
func (m *noopCustRepo) Create(c *model.Customer) error                     { return nil }
func (m *noopCustRepo) Update(c *model.Customer) error                     { return nil }
func (m *noopCustRepo) Delete(id, enterpriseID uuid.UUID) error                   { return nil }
func (m *noopCustRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Customer, error) {
	return nil, nil
}
func (m *noopCustRepo) FindByName(enterpriseID uuid.UUID, name string) (*model.Customer, error) {
	return nil, nil
}
func (m *noopCustRepo) List(enterpriseID uuid.UUID, page, pageSize int) ([]model.Customer, int64, error) {
	return nil, 0, nil
}
func (m *noopCustRepo) UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	return nil
}
func (m *noopCustRepo) UpdateFieldsByID(id string, fields map[string]interface{}) error {
	return nil
}
func (m *noopCustRepo) RestoreFields(id string, fields map[string]interface{}) error {
	return nil
}
func (m *noopCustRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	return 0, nil
}
func (m *noopCustRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	return nil
}
func (m *noopQIRepo) Create(inspection *model.QualityInspection) error { return nil }
func (m *noopQIRepo) FindByID(id, enterpriseID uuid.UUID) (*model.QualityInspection, error) {
	return nil, nil
}
func (m *noopQIRepo) ListByPurchaseOrder(purchaseOrderID uuid.UUID, page, pageSize int) ([]model.QualityInspection, int64, error) {
	return nil, 0, nil
}
func (m *noopQIRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error { return nil }
func (m *noopQIRepo) Update(inspection *model.QualityInspection) error { return nil }
func (m *noopQIRepo) CreateItem(item *model.QualityInspectionItem) error { return nil }
func (m *noopQIRepo) ListItems(inspectionID uuid.UUID) ([]model.QualityInspectionItem, error) {
	return nil, nil
}

func TestOrderService_CreatePurchaseOrder(t *testing.T) {
	orderRepo := newMockOrderRepo()
	supRepo := newMockSupplierRepoForOrder()
	invRepo := newMockInvRepoForOrder()
	svc := NewOrderService(orderRepo, invRepo, &noopMatRepo{}, &noopWhRepo{}, supRepo, &noopCustRepo{}, &noopQIRepo{}, nil)

	eid := uuid.New().String()
	supID := uuid.New().String()
	sup := &model.Supplier{Name: "供应商A", Status: "active"}
	sup.EnterpriseID = uuid.MustParse(eid)
	sup.ID = uuid.MustParse(supID)
	supRepo.suppliers[supID] = sup

	items := []OrderItemInput{
		{MaterialID: uuid.New().String(), Quantity: 10, UnitPrice: 100},
	}

	po, appErr := svc.CreatePurchaseOrder(eid, supID, "备注", items)
	assert.Nil(t, appErr)
	assert.NotNil(t, po)
	assert.Contains(t, po.OrderNo, "PO-")
	assert.Equal(t, "draft", po.Status)
	assert.Equal(t, 1000.0, po.TotalAmount)
}

func TestOrderService_CreatePurchaseOrder_SupplierNotFound(t *testing.T) {
	orderRepo := newMockOrderRepo()
	supRepo := newMockSupplierRepoForOrder()
	invRepo := newMockInvRepoForOrder()
	svc := NewOrderService(orderRepo, invRepo, &noopMatRepo{}, &noopWhRepo{}, supRepo, &noopCustRepo{}, &noopQIRepo{}, nil)

	eid := uuid.New().String()
	supID := uuid.New().String()

	items := []OrderItemInput{
		{MaterialID: uuid.New().String(), Quantity: 10, UnitPrice: 100},
	}

	po, appErr := svc.CreatePurchaseOrder(eid, supID, "备注", items)
	assert.Nil(t, po)
	assert.NotNil(t, appErr)
	assert.Equal(t, 404, appErr.Status)
}

func TestOrderService_CreateSalesOrder(t *testing.T) {
	orderRepo := newMockOrderRepo()
	supRepo := newMockSupplierRepoForOrder()
	invRepo := newMockInvRepoForOrder()
	svc := NewOrderService(orderRepo, invRepo, &noopMatRepo{}, &noopWhRepo{}, supRepo, &noopCustRepo{}, &noopQIRepo{}, nil)

	eid := uuid.New().String()
	custID := uuid.New().String()

	items := []OrderItemInput{
		{MaterialID: uuid.New().String(), Quantity: 5, UnitPrice: 200},
		{MaterialID: uuid.New().String(), Quantity: 3, UnitPrice: 150},
	}

	so, appErr := svc.CreateSalesOrder(eid, custID, "备注", items)
	assert.Nil(t, appErr)
	assert.NotNil(t, so)
	assert.Contains(t, so.OrderNo, "SO-")
	assert.Equal(t, "draft", so.Status)
	assert.Equal(t, 1450.0, so.TotalAmount)
}

func TestOrderService_CreateTransfer(t *testing.T) {
	orderRepo := newMockOrderRepo()
	invRepo := newMockInvRepoForOrder()
	svc := NewOrderService(orderRepo, invRepo, &noopMatRepo{}, &noopWhRepo{}, newMockSupplierRepoForOrder(), &noopCustRepo{}, &noopQIRepo{}, nil)

	eid := uuid.New().String()
	srcWh := uuid.New().String()
	tgtWh := uuid.New().String()
	matID := uuid.New().String()

	to, appErr := svc.CreateTransfer(eid, srcWh, tgtWh, matID, 100)
	assert.Nil(t, appErr)
	assert.NotNil(t, to)
	assert.Contains(t, to.OrderNo, "TO-")
	assert.Equal(t, "draft", to.Status)
	assert.Equal(t, 100, to.Quantity)
}

func TestOrderService_CreateRequisition(t *testing.T) {
	orderRepo := newMockOrderRepo()
	invRepo := newMockInvRepoForOrder()
	svc := NewOrderService(orderRepo, invRepo, &noopMatRepo{}, &noopWhRepo{}, newMockSupplierRepoForOrder(), &noopCustRepo{}, &noopQIRepo{}, nil)

	eid := uuid.New().String()

	req, appErr := svc.CreateRequisition(eid, uuid.New().String(), uuid.New().String(), uuid.New().String(), 50, "领用备注")
	assert.Nil(t, appErr)
	assert.NotNil(t, req)
	assert.Contains(t, req.RequisitionNo, "RQ-")
	assert.Equal(t, "pending", req.Status)
	assert.Equal(t, 50, req.Quantity)
}

func TestOrderService_ChangeSalesOrderStatus(t *testing.T) {
	orderRepo := newMockOrderRepo()
	invRepo := newMockInvRepoForOrder()
	svc := NewOrderService(orderRepo, invRepo, &noopMatRepo{}, &noopWhRepo{}, newMockSupplierRepoForOrder(), &noopCustRepo{}, &noopQIRepo{}, nil)

	eid := uuid.New().String()
	custID := uuid.New().String()
	items := []OrderItemInput{{MaterialID: uuid.New().String(), Quantity: 1, UnitPrice: 100}}

	so, _ := svc.CreateSalesOrder(eid, custID, "", items)

	result, appErr := svc.ChangeSalesOrderStatus(so.ID.String(), "confirmed")
	assert.Nil(t, appErr)
	assert.Equal(t, "confirmed", result.Status)
}

func TestOrderService_ChangeSalesOrderStatus_InvalidTransition(t *testing.T) {
	orderRepo := newMockOrderRepo()
	invRepo := newMockInvRepoForOrder()
	svc := NewOrderService(orderRepo, invRepo, &noopMatRepo{}, &noopWhRepo{}, newMockSupplierRepoForOrder(), &noopCustRepo{}, &noopQIRepo{}, nil)

	eid := uuid.New().String()
	custID := uuid.New().String()
	items := []OrderItemInput{{MaterialID: uuid.New().String(), Quantity: 1, UnitPrice: 100}}

	so, _ := svc.CreateSalesOrder(eid, custID, "", items)

	result, appErr := svc.ChangeSalesOrderStatus(so.ID.String(), "completed")
	assert.Nil(t, result)
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}
