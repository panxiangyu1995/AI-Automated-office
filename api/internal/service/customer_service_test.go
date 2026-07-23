package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockCustomerRepo struct {
	customers map[string]*model.Customer
}

func newMockCustomerRepo() *mockCustomerRepo {
	return &mockCustomerRepo{customers: make(map[string]*model.Customer)}
}

func (m *mockCustomerRepo) Create(c *model.Customer) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	m.customers[c.ID.String()] = c
	return nil
}

func (m *mockCustomerRepo) Update(c *model.Customer) error {
	m.customers[c.ID.String()] = c
	return nil
}

func (m *mockCustomerRepo) Delete(id, enterpriseID uuid.UUID) error {
	delete(m.customers, id.String())
	return nil
}

func (m *mockCustomerRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Customer, error) {
	c, ok := m.customers[id.String()]
	if !ok {
		return nil, nil
	}
	return c, nil
}

func (m *mockCustomerRepo) FindByName(enterpriseID uuid.UUID, name string) (*model.Customer, error) {
	for _, c := range m.customers {
		if c.EnterpriseID == enterpriseID && c.Name == name {
			return c, nil
		}
	}
	return nil, nil
}

func (m *mockCustomerRepo) List(enterpriseID uuid.UUID, page, pageSize int) ([]model.Customer, int64, error) {
	var result []model.Customer
	for _, c := range m.customers {
		if c.EnterpriseID == enterpriseID {
			result = append(result, *c)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockCustomerRepo) UpdateFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) error {
	return nil
}

func (m *mockCustomerRepo) UpdateFieldsByID(id, enterpriseID string, fields map[string]interface{}) error {
	return nil
}

func (m *mockCustomerRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	return nil
}

func (m *mockCustomerRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	_, ok := m.customers[id.String()]
	if !ok {
		return 0, nil
	}
	delete(m.customers, id.String())
	return 1, nil
}

func (m *mockCustomerRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	c, ok := m.customers[id.String()]
	if !ok {
		return nil
	}
	c.Status = status
	return nil
}

func TestCustomerService_Create(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	c, appErr := svc.Create(eid, "测试客户", "科技", "91110000", "北京市", "备注")
	assert.Nil(t, appErr)
	assert.NotNil(t, c)
	assert.Equal(t, "测试客户", c.Name)
	assert.Equal(t, "active", c.Status)
	assert.Equal(t, "普通", c.Level)
}

func TestCustomerService_Create_EmptyName(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	c, appErr := svc.Create(eid, "", "科技", "91110000", "北京市", "备注")
	assert.Nil(t, c)
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}

func TestCustomerService_Create_Duplicate(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	c1, _ := svc.Create(eid, "重复客户", "科技", "", "", "")
	assert.NotNil(t, c1)

	c2, appErr := svc.Create(eid, "重复客户", "科技", "", "", "")
	assert.Nil(t, c2)
	assert.NotNil(t, appErr)
	assert.Equal(t, 409, appErr.Status)
}

func TestCustomerService_Get(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, "查询客户", "科技", "", "", "")

	found, appErr := svc.Get(eid, created.ID.String())
	assert.Nil(t, appErr)
	assert.NotNil(t, found)
	assert.Equal(t, "查询客户", found.Name)
}

func TestCustomerService_Get_NotFound(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	found, appErr := svc.Get(eid, uuid.New().String())
	assert.Nil(t, found)
	assert.NotNil(t, appErr)
	assert.Equal(t, 404, appErr.Status)
}

func TestCustomerService_Update(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, "原始客户", "科技", "", "", "")

	updated, appErr := svc.Update(eid, created.ID.String(), "更新客户", "金融", "", "", "", "VIP")
	assert.Nil(t, appErr)
	assert.NotNil(t, updated)
	assert.Equal(t, "更新客户", updated.Name)
	assert.Equal(t, "金融", updated.Industry)
	assert.Equal(t, "VIP", updated.Level)
}

func TestCustomerService_Delete(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, "删除客户", "科技", "", "", "")

	appErr := svc.Delete(eid, created.ID.String())
	assert.Nil(t, appErr)

	found, _ := svc.Get(eid, created.ID.String())
	assert.Nil(t, found)
}

func TestCustomerService_List(t *testing.T) {
	repo := newMockCustomerRepo()
	svc := NewCustomerService(repo)
	eid := uuid.New().String()

	svc.Create(eid, "客户A", "科技", "", "", "")
	svc.Create(eid, "客户B", "金融", "", "", "")

	customers, total, appErr := svc.List(eid, 1, 10)
	assert.Nil(t, appErr)
	assert.Equal(t, int64(2), total)
	assert.Len(t, customers, 2)
}
