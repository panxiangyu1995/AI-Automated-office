package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type mockQIRepo struct {
	mock.Mock
}

func (m *mockQIRepo) Create(inspection *model.QualityInspection) error {
	args := m.Called(inspection)
	return args.Error(0)
}

func (m *mockQIRepo) FindByID(id, enterpriseID uuid.UUID) (*model.QualityInspection, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.QualityInspection), args.Error(1)
}

func (m *mockQIRepo) ListByPurchaseOrder(purchaseOrderID uuid.UUID, page, pageSize int) ([]model.QualityInspection, int64, error) {
	args := m.Called(purchaseOrderID, page, pageSize)
	return args.Get(0).([]model.QualityInspection), args.Get(1).(int64), args.Error(2)
}

func (m *mockQIRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	args := m.Called(id, enterpriseID, status)
	return args.Error(0)
}

func (m *mockQIRepo) Update(inspection *model.QualityInspection) error {
	args := m.Called(inspection)
	return args.Error(0)
}

func (m *mockQIRepo) CreateItem(item *model.QualityInspectionItem) error {
	args := m.Called(item)
	return args.Error(0)
}

func (m *mockQIRepo) ListItems(inspectionID uuid.UUID) ([]model.QualityInspectionItem, error) {
	args := m.Called(inspectionID)
	return args.Get(0).([]model.QualityInspectionItem), args.Error(1)
}

type mockInvRepo struct {
	mock.Mock
}

func (m *mockInvRepo) Upsert(inv *model.WarehouseInventory) error {
	args := m.Called(inv)
	return args.Error(0)
}

func (m *mockInvRepo) AdjustQuantity(eid, whID, matID uuid.UUID, delta int) error {
	args := m.Called(eid, whID, matID, delta)
	return args.Error(0)
}

func (m *mockInvRepo) AdjustQuantityWithCheck(eid, whID, matID uuid.UUID, delta int) error {
	args := m.Called(eid, whID, matID, delta)
	return args.Error(0)
}

func (m *mockInvRepo) Find(whID, matID uuid.UUID) (*model.WarehouseInventory, error) {
	args := m.Called(whID, matID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.WarehouseInventory), args.Error(1)
}

func (m *mockInvRepo) FindByID(id, enterpriseID uuid.UUID) (*model.WarehouseInventory, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.WarehouseInventory), args.Error(1)
}

func (m *mockInvRepo) ListByWarehouse(whID uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	args := m.Called(whID, p, ps)
	return args.Get(0).([]model.WarehouseInventory), args.Get(1).(int64), args.Error(2)
}

func (m *mockInvRepo) ListByMaterial(matID uuid.UUID) ([]model.WarehouseInventory, error) {
	args := m.Called(matID)
	return args.Get(0).([]model.WarehouseInventory), args.Error(1)
}

func (m *mockInvRepo) ListLowStock(eid uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	args := m.Called(eid, p, ps)
	return args.Get(0).([]model.WarehouseInventory), args.Get(1).(int64), args.Error(2)
}

type mockOrdRepo struct {
	mock.Mock
}

func (m *mockOrdRepo) CreatePurchaseOrder(po *model.PurchaseOrder) error {
	args := m.Called(po)
	return args.Error(0)
}

func (m *mockOrdRepo) CreatePurchaseOrderItem(item *model.PurchaseOrderItem) error {
	args := m.Called(item)
	return args.Error(0)
}

func (m *mockOrdRepo) UpdatePurchaseOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error {
	args := m.Called(id, enterpriseID, total)
	return args.Error(0)
}

func (m *mockOrdRepo) FindPurchaseOrderByID(id, enterpriseID uuid.UUID) (*model.PurchaseOrder, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PurchaseOrder), args.Error(1)
}

func (m *mockOrdRepo) FindPurchaseOrderByIDNoEnterprise(id string) (*model.PurchaseOrder, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PurchaseOrder), args.Error(1)
}

func (m *mockOrdRepo) UpdatePurchaseOrder(po *model.PurchaseOrder) error {
	args := m.Called(po)
	return args.Error(0)
}

func (m *mockOrdRepo) ListPurchaseOrderItems(orderID string) ([]model.PurchaseOrderItem, error) {
	args := m.Called(orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]model.PurchaseOrderItem), args.Error(1)
}

func (m *mockOrdRepo) UpdatePurchaseOrderItemReceivedQty(id, enterpriseID uuid.UUID, receivedQty int) error {
	args := m.Called(id, enterpriseID, receivedQty)
	return args.Error(0)
}

func (m *mockOrdRepo) IncrementPurchaseOrderItemReceivedQty(id string, delta int) error {
	args := m.Called(id, delta)
	return args.Error(0)
}

func (m *mockOrdRepo) UpdatePurchaseOrderStatusByOrderID(orderID string, status string) error {
	args := m.Called(orderID, status)
	return args.Error(0)
}

func (m *mockOrdRepo) ListPurchaseOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.PurchaseOrder, int64, error) {
	args := m.Called(enterpriseID, page, pageSize)
	return args.Get(0).([]model.PurchaseOrder), args.Get(1).(int64), args.Error(2)
}

func (m *mockOrdRepo) UpdatePurchaseOrderStatus(id, enterpriseID uuid.UUID, status string) error {
	args := m.Called(id, enterpriseID, status)
	return args.Error(0)
}

func (m *mockOrdRepo) CreateSalesOrder(so *model.SalesOrder) error {
	args := m.Called(so)
	return args.Error(0)
}

func (m *mockOrdRepo) CreateSalesOrderItem(item *model.SalesOrderItem) error {
	args := m.Called(item)
	return args.Error(0)
}

func (m *mockOrdRepo) UpdateSalesOrderTotalAmount(id, enterpriseID uuid.UUID, total float64) error {
	args := m.Called(id, enterpriseID, total)
	return args.Error(0)
}

func (m *mockOrdRepo) FindSalesOrderByID(id, enterpriseID uuid.UUID) (*model.SalesOrder, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.SalesOrder), args.Error(1)
}

func (m *mockOrdRepo) FindSalesOrderByIDNoEnterprise(id string) (*model.SalesOrder, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.SalesOrder), args.Error(1)
}

func (m *mockOrdRepo) UpdateSalesOrder(so *model.SalesOrder) error {
	args := m.Called(so)
	return args.Error(0)
}

func (m *mockOrdRepo) ListSalesOrderItems(orderID string) ([]model.SalesOrderItem, error) {
	args := m.Called(orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]model.SalesOrderItem), args.Error(1)
}

func (m *mockOrdRepo) UpdateSalesOrderItemShippedQty(id, enterpriseID uuid.UUID, shippedQty int) error {
	args := m.Called(id, enterpriseID, shippedQty)
	return args.Error(0)
}

func (m *mockOrdRepo) ListSalesOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.SalesOrder, int64, error) {
	args := m.Called(enterpriseID, page, pageSize)
	return args.Get(0).([]model.SalesOrder), args.Get(1).(int64), args.Error(2)
}

func (m *mockOrdRepo) UpdateSalesOrderStatus(id, enterpriseID uuid.UUID, status string) error {
	args := m.Called(id, enterpriseID, status)
	return args.Error(0)
}

func (m *mockOrdRepo) CreateTransferOrder(to *model.TransferOrder) error {
	args := m.Called(to)
	return args.Error(0)
}

func (m *mockOrdRepo) FindTransferOrderByID(id, enterpriseID uuid.UUID) (*model.TransferOrder, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.TransferOrder), args.Error(1)
}

func (m *mockOrdRepo) FindTransferOrderByIDNoEnterprise(id string) (*model.TransferOrder, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.TransferOrder), args.Error(1)
}

func (m *mockOrdRepo) UpdateTransferOrder(to *model.TransferOrder) error {
	args := m.Called(to)
	return args.Error(0)
}

func (m *mockOrdRepo) ListTransferOrders(enterpriseID uuid.UUID, page, pageSize int) ([]model.TransferOrder, int64, error) {
	args := m.Called(enterpriseID, page, pageSize)
	return args.Get(0).([]model.TransferOrder), args.Get(1).(int64), args.Error(2)
}

func (m *mockOrdRepo) CreateRequisition(req *model.Requisition) error {
	args := m.Called(req)
	return args.Error(0)
}

func (m *mockOrdRepo) FindRequisitionByID(id, enterpriseID uuid.UUID) (*model.Requisition, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Requisition), args.Error(1)
}

func (m *mockOrdRepo) FindRequisitionByIDNoEnterprise(id string) (*model.Requisition, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Requisition), args.Error(1)
}

func (m *mockOrdRepo) UpdateRequisitionFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	args := m.Called(id, enterpriseID, fields)
	return args.Error(0)
}

func (m *mockOrdRepo) ListRequisitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.Requisition, int64, error) {
	args := m.Called(enterpriseID, page, pageSize)
	return args.Get(0).([]model.Requisition), args.Get(1).(int64), args.Error(2)
}

func (m *mockOrdRepo) ListStockFlows(enterpriseID uuid.UUID, whID, matID string, page, pageSize int) ([]model.StockFlow, int64, error) {
	args := m.Called(enterpriseID, whID, matID, page, pageSize)
	return args.Get(0).([]model.StockFlow), args.Get(1).(int64), args.Error(2)
}

func TestCompleteInspection_AllPass_Qualified(t *testing.T) {
	repo := new(mockQIRepo)
	invRepo := new(mockInvRepo)
	ordRepo := new(mockOrdRepo)
	svc := NewQualityInspectionService(repo, invRepo, ordRepo, nil)

	qiID := uuid.New()
	qi := &model.QualityInspection{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: qiID}},
		Status:      "pending",
	}

	repo.On("FindByID", qiID, mock.AnythingOfType("uuid.UUID")).Return(qi, nil)
	repo.On("ListItems", qiID).Return([]model.QualityInspectionItem{
		{InspectionID: qiID.String(), MaterialID: uuid.New().String(), CheckItem: "外观", Result: "pass"},
		{InspectionID: qiID.String(), MaterialID: uuid.New().String(), CheckItem: "尺寸", Result: "pass"},
	}, nil)
	repo.On("Update", mock.AnythingOfType("*model.QualityInspection")).Return(nil)

	result, appErr := svc.CompleteInspection(qiID, uuid.New(), "inspector-1")
	assert.Nil(t, appErr)
	assert.Equal(t, "qualified", result.Status)
	repo.AssertExpectations(t)
}

func TestCompleteInspection_OneFail_Unqualified(t *testing.T) {
	repo := new(mockQIRepo)
	invRepo := new(mockInvRepo)
	ordRepo := new(mockOrdRepo)
	svc := NewQualityInspectionService(repo, invRepo, ordRepo, nil)

	qiID := uuid.New()
	qi := &model.QualityInspection{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: qiID}},
		Status:      "pending",
	}

	repo.On("FindByID", qiID, mock.AnythingOfType("uuid.UUID")).Return(qi, nil)
	repo.On("ListItems", qiID).Return([]model.QualityInspectionItem{
		{InspectionID: qiID.String(), MaterialID: uuid.New().String(), CheckItem: "外观", Result: "pass"},
		{InspectionID: qiID.String(), MaterialID: uuid.New().String(), CheckItem: "强度", Result: "fail"},
	}, nil)
	repo.On("Update", mock.AnythingOfType("*model.QualityInspection")).Return(nil)

	result, appErr := svc.CompleteInspection(qiID, uuid.New(), "inspector-1")
	assert.Nil(t, appErr)
	assert.Equal(t, "unqualified", result.Status)
	repo.AssertExpectations(t)
}

func TestQualifiedAutoReceive_Unqualified_Error(t *testing.T) {
	repo := new(mockQIRepo)
	invRepo := new(mockInvRepo)
	ordRepo := new(mockOrdRepo)
	svc := NewQualityInspectionService(repo, invRepo, ordRepo, nil)

	qiID := uuid.New()
	qi := &model.QualityInspection{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: qiID}},
		Status:      "unqualified",
	}

	repo.On("FindByID", qiID, mock.AnythingOfType("uuid.UUID")).Return(qi, nil)

	appErr := svc.QualifiedAutoReceive(qiID, uuid.New(), uuid.New().String())
	assert.NotNil(t, appErr)
	assert.Equal(t, "BIZ_INVALID_STATUS", appErr.Code)
	repo.AssertExpectations(t)
}

func TestCreateInspection_SetsDefaults(t *testing.T) {
	repo := new(mockQIRepo)
	invRepo := new(mockInvRepo)
	ordRepo := new(mockOrdRepo)
	svc := NewQualityInspectionService(repo, invRepo, ordRepo, nil)

	qi := &model.QualityInspection{
		PurchaseOrderID: uuid.New().String(),
	}
	repo.On("Create", mock.AnythingOfType("*model.QualityInspection")).Return(nil)

	appErr := svc.CreateInspection(qi)
	assert.Nil(t, appErr)
	assert.NotEmpty(t, qi.InspectionNo)
	assert.Equal(t, "pending", qi.Status)
	assert.Contains(t, qi.InspectionNo, "QI-")
	repo.AssertExpectations(t)
}

func TestCompleteInspection_NotFound(t *testing.T) {
	repo := new(mockQIRepo)
	invRepo := new(mockInvRepo)
	ordRepo := new(mockOrdRepo)
	svc := NewQualityInspectionService(repo, invRepo, ordRepo, nil)

	qiID := uuid.New()
	repo.On("FindByID", qiID, mock.AnythingOfType("uuid.UUID")).Return(nil, nil)

	_, appErr := svc.CompleteInspection(qiID, uuid.New(), "inspector-1")
	assert.NotNil(t, appErr)
	assert.Equal(t, "RES_NOT_FOUND", appErr.Code)
	repo.AssertExpectations(t)
}

func TestCompleteInspection_NoItems_Error(t *testing.T) {
	repo := new(mockQIRepo)
	invRepo := new(mockInvRepo)
	ordRepo := new(mockOrdRepo)
	svc := NewQualityInspectionService(repo, invRepo, ordRepo, nil)

	qiID := uuid.New()
	qi := &model.QualityInspection{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: qiID}},
		Status:      "pending",
	}

	repo.On("FindByID", qiID, mock.AnythingOfType("uuid.UUID")).Return(qi, nil)
	repo.On("ListItems", qiID).Return([]model.QualityInspectionItem{}, nil)

	_, appErr := svc.CompleteInspection(qiID, uuid.New(), "inspector-1")
	assert.NotNil(t, appErr)
	assert.Equal(t, "VAL_INVALID_PARAMS", appErr.Code)
	repo.AssertExpectations(t)
}

var _ repository.QualityInspectionRepository = (*mockQIRepo)(nil)
var _ repository.InventoryRepository = (*mockInvRepo)(nil)
var _ repository.OrderRepository = (*mockOrdRepo)(nil)
