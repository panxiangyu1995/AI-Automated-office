package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockInvRepoForSvc struct {
	inventory map[string]*model.WarehouseInventory
}

func newMockInvRepoForSvc() *mockInvRepoForSvc {
	return &mockInvRepoForSvc{inventory: make(map[string]*model.WarehouseInventory)}
}

func (m *mockInvRepoForSvc) Upsert(inv *model.WarehouseInventory) error {
	if inv.ID == uuid.Nil {
		inv.ID = uuid.New()
	}
	key := inv.WarehouseID.String() + ":" + inv.MaterialID.String()
	m.inventory[key] = inv
	return nil
}

func (m *mockInvRepoForSvc) Find(whID, matID uuid.UUID) (*model.WarehouseInventory, error) {
	key := whID.String() + ":" + matID.String()
	inv, ok := m.inventory[key]
	if !ok {
		return nil, nil
	}
	return inv, nil
}

func (m *mockInvRepoForSvc) FindByID(id, enterpriseID uuid.UUID) (*model.WarehouseInventory, error) {
	for _, inv := range m.inventory {
		if inv.ID == id {
			return inv, nil
		}
	}
	return nil, nil
}

func (m *mockInvRepoForSvc) ListByWarehouse(whID uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	var result []model.WarehouseInventory
	for _, inv := range m.inventory {
		if inv.WarehouseID == whID {
			result = append(result, *inv)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockInvRepoForSvc) ListByMaterial(matID uuid.UUID) ([]model.WarehouseInventory, error) {
	var result []model.WarehouseInventory
	for _, inv := range m.inventory {
		if inv.MaterialID == matID {
			result = append(result, *inv)
		}
	}
	return result, nil
}

func (m *mockInvRepoForSvc) ListLowStock(eid uuid.UUID, p, ps int) ([]model.WarehouseInventory, int64, error) {
	var result []model.WarehouseInventory
	for _, inv := range m.inventory {
		if inv.EnterpriseID == eid && inv.Quantity < inv.SafetyStock {
			result = append(result, *inv)
		}
	}
	return result, int64(len(result)), nil
}

func TestInventoryService_Set(t *testing.T) {
	invRepo := newMockInvRepoForSvc()
	svc := NewInventoryService(invRepo, &noopMatRepo{}, &noopWhRepo{})

	eid := uuid.New().String()
	whID := uuid.New().String()
	matID := uuid.New().String()

	inv, appErr := svc.Set(eid, whID, matID, 100, 20, 5)
	assert.Nil(t, appErr)
	assert.NotNil(t, inv)
	assert.Equal(t, 100, inv.Quantity)
	assert.Equal(t, 20, inv.SafetyStock)
	assert.Equal(t, 5, inv.InTransit)
}

func TestInventoryService_Set_InvalidEnterpriseID(t *testing.T) {
	invRepo := newMockInvRepoForSvc()
	svc := NewInventoryService(invRepo, &noopMatRepo{}, &noopWhRepo{})

	inv, appErr := svc.Set("invalid", uuid.New().String(), uuid.New().String(), 100, 20, 5)
	assert.Nil(t, inv)
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}

func TestInventoryService_QueryByWarehouse(t *testing.T) {
	invRepo := newMockInvRepoForSvc()
	svc := NewInventoryService(invRepo, &noopMatRepo{}, &noopWhRepo{})

	eid := uuid.New().String()
	whID := uuid.New().String()

	svc.Set(eid, whID, uuid.New().String(), 100, 20, 0)
	svc.Set(eid, whID, uuid.New().String(), 50, 10, 0)

	items, total, appErr := svc.QueryByWarehouse(whID, 1, 10)
	assert.Nil(t, appErr)
	assert.Equal(t, int64(2), total)
	assert.Len(t, items, 2)
}

func TestInventoryService_QueryByMaterial(t *testing.T) {
	invRepo := newMockInvRepoForSvc()
	svc := NewInventoryService(invRepo, &noopMatRepo{}, &noopWhRepo{})

	eid := uuid.New().String()
	matID := uuid.New().String()

	svc.Set(eid, uuid.New().String(), matID, 100, 20, 0)

	items, appErr := svc.QueryByMaterial(matID)
	assert.Nil(t, appErr)
	assert.Len(t, items, 1)
	assert.Equal(t, 100, items[0].Quantity)
}

func TestInventoryService_LowStockAlerts(t *testing.T) {
	invRepo := newMockInvRepoForSvc()
	svc := NewInventoryService(invRepo, &noopMatRepo{}, &noopWhRepo{})

	eid := uuid.New().String()

	svc.Set(eid, uuid.New().String(), uuid.New().String(), 5, 20, 0)
	svc.Set(eid, uuid.New().String(), uuid.New().String(), 100, 20, 0)

	items, total, appErr := svc.LowStockAlerts(eid, 1, 10)
	assert.Nil(t, appErr)
	assert.Equal(t, int64(1), total)
	assert.Len(t, items, 1)
	assert.Equal(t, 5, items[0].Quantity)
}

func TestInventoryService_Upsert_Overwrite(t *testing.T) {
	invRepo := newMockInvRepoForSvc()
	svc := NewInventoryService(invRepo, &noopMatRepo{}, &noopWhRepo{})

	eid := uuid.New().String()
	whID := uuid.New().String()
	matID := uuid.New().String()

	inv1, _ := svc.Set(eid, whID, matID, 100, 20, 0)
	assert.Equal(t, 100, inv1.Quantity)

	inv2, appErr := svc.Set(eid, whID, matID, 200, 30, 10)
	assert.Nil(t, appErr)
	assert.Equal(t, 200, inv2.Quantity)
	assert.Equal(t, 30, inv2.SafetyStock)
	assert.Equal(t, 10, inv2.InTransit)
}
