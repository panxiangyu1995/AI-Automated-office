package service

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockContractRepo struct {
	contracts  map[string]*model.Contract
	refs       []model.ContractReference
	attachRefs []model.ContractAttachment
}

func newMockContractRepo() *mockContractRepo {
	return &mockContractRepo{contracts: make(map[string]*model.Contract)}
}

func (m *mockContractRepo) Create(c *model.Contract) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	m.contracts[c.ID.String()] = c
	return nil
}

func (m *mockContractRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Contract, error) {
	c, ok := m.contracts[id.String()]
	if !ok {
		return nil, nil
	}
	return c, nil
}

func (m *mockContractRepo) List(enterpriseID uuid.UUID, status string, page, pageSize int) ([]model.Contract, int64, error) {
	var result []model.Contract
	for _, c := range m.contracts {
		if c.EnterpriseID == enterpriseID {
			if status == "" || c.Status == status {
				result = append(result, *c)
			}
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockContractRepo) Update(c *model.Contract) error {
	m.contracts[c.ID.String()] = c
	return nil
}

func (m *mockContractRepo) Delete(c *model.Contract, enterpriseID uuid.UUID) error {
	delete(m.contracts, c.ID.String())
	return nil
}

func (m *mockContractRepo) PatchFields(id, enterpriseID uuid.UUID, fields map[string]interface{}) (*model.Contract, error) {
	c, ok := m.contracts[id.String()]
	if !ok {
		return nil, nil
	}
	if v, ok := fields["name"]; ok {
		c.Name = v.(string)
	}
	if v, ok := fields["amount"]; ok {
		c.Amount = v.(float64)
	}
	return c, nil
}

func (m *mockContractRepo) CreateAttachment(att *model.ContractAttachment) error {
	if att.ID == uuid.Nil {
		att.ID = uuid.New()
	}
	m.attachRefs = append(m.attachRefs, *att)
	return nil
}

func (m *mockContractRepo) CreateReference(cr *model.ContractReference) error {
	if cr.ID == uuid.Nil {
		cr.ID = uuid.New()
	}
	m.refs = append(m.refs, *cr)
	return nil
}

func (m *mockContractRepo) ListReferences(contractID uuid.UUID) ([]model.ContractReference, error) {
	var result []model.ContractReference
	for _, r := range m.refs {
		if r.ContractID == contractID.String() {
			result = append(result, r)
		}
	}
	return result, nil
}

func (m *mockContractRepo) FindByIDNoEnterprise(id string) (*model.Contract, error) {
	c, ok := m.contracts[id]
	if !ok {
		return nil, nil
	}
	return c, nil
}

func (m *mockContractRepo) ListByCustomer(customerID, enterpriseID uuid.UUID) ([]model.Contract, error) {
	var result []model.Contract
	for _, c := range m.contracts {
		if c.CustomerID == customerID.String() && c.EnterpriseID == enterpriseID {
			result = append(result, *c)
		}
	}
	return result, nil
}

func (m *mockContractRepo) DeleteByID(id, enterpriseID uuid.UUID) (int64, error) {
	_, ok := m.contracts[id.String()]
	if !ok {
		return 0, nil
	}
	delete(m.contracts, id.String())
	return 1, nil
}

func (m *mockContractRepo) UpdateFields(id, enterpriseID string, fields map[string]interface{}) error {
	c, ok := m.contracts[id]
	if !ok {
		return nil
	}
	if v, ok := fields["name"]; ok {
		c.Name = v.(string)
	}
	return nil
}

func (m *mockContractRepo) RestoreFields(id, enterpriseID string, fields map[string]interface{}) error {
	return m.UpdateFields(id, enterpriseID, fields)
}

func (m *mockContractRepo) UpdateStatus(id, enterpriseID uuid.UUID, status string) error {
	c, ok := m.contracts[id.String()]
	if !ok {
		return nil
	}
	c.Status = status
	return nil
}

func TestContractService_Create(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	c, appErr := svc.Create(eid, uuid.New().String(), "测试合同", "合同内容", "备注", 10000)
	assert.Nil(t, appErr)
	assert.NotNil(t, c)
	assert.Equal(t, "测试合同", c.Name)
	assert.Equal(t, "draft", c.Status)
	assert.Contains(t, c.ContractNo, "CT-")
}

func TestContractService_Create_EmptyName(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	c, appErr := svc.Create(eid, uuid.New().String(), "", "", "", 0)
	assert.Nil(t, c)
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}

func TestContractService_Get(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "查询合同", "", "", 5000)

	found, appErr := svc.Get(eid, created.ID.String())
	assert.Nil(t, appErr)
	assert.NotNil(t, found)
	assert.Equal(t, "查询合同", found.Name)
}

func TestContractService_Update_Draft(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "草稿合同", "内容", "", 1000)

	updated, appErr := svc.Update(eid, created.ID.String(), "更新合同", "新内容", "备注", 2000)
	assert.Nil(t, appErr)
	assert.NotNil(t, updated)
	assert.Equal(t, "更新合同", updated.Name)
	assert.Equal(t, 2000.0, updated.Amount)
}

func TestContractService_Update_NonDraft_Rejected(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "合同", "", "", 1000)
	created.Status = "active"
	repo.contracts[created.ID.String()] = created

	updated, appErr := svc.Update(eid, created.ID.String(), "尝试更新", "", "", 0)
	assert.Nil(t, updated)
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}

func TestContractService_ChangeStatus_DraftToPendingApproval(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "审批合同", "", "", 5000)

	result, appErr := svc.ChangeStatus(eid, created.ID.String(), "pending_approval")
	assert.Nil(t, appErr)
	assert.NotNil(t, result)
	assert.Equal(t, "pending_approval", result.Status)
}

func TestContractService_ChangeStatus_PendingToActive(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "生效合同", "", "", 5000)
	created.Status = "pending_approval"
	repo.contracts[created.ID.String()] = created

	result, appErr := svc.ChangeStatus(eid, created.ID.String(), "active")
	assert.Nil(t, appErr)
	assert.Equal(t, "active", result.Status)
	assert.NotNil(t, result.EffectiveAt)
}

func TestContractService_ChangeStatus_InvalidTransition(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "非法转换", "", "", 5000)

	result, appErr := svc.ChangeStatus(eid, created.ID.String(), "active")
	assert.Nil(t, result)
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}

func TestContractService_SubmitApproval(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "提交审批", "", "", 5000)

	result, appErr := svc.SubmitApproval(eid, created.ID.String())
	assert.Nil(t, appErr)
	assert.Equal(t, "pending_approval", result.Status)
}

func TestContractService_Approve(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "审批通过", "", "", 5000)
	created.Status = "pending_approval"
	repo.contracts[created.ID.String()] = created

	result, appErr := svc.Approve(eid, created.ID.String())
	assert.Nil(t, appErr)
	assert.Equal(t, "active", result.Status)
}

func TestContractService_Delete_Draft(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "删除草稿", "", "", 1000)

	appErr := svc.Delete(eid, created.ID.String())
	assert.Nil(t, appErr)
}

func TestContractService_Delete_NonDraft_Rejected(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	created, _ := svc.Create(eid, uuid.New().String(), "非草稿合同", "", "", 1000)
	created.Status = "active"
	repo.contracts[created.ID.String()] = created

	appErr := svc.Delete(eid, created.ID.String())
	assert.NotNil(t, appErr)
	assert.Equal(t, 400, appErr.Status)
}

func TestContractService_List(t *testing.T) {
	repo := newMockContractRepo()
	svc := NewContractService(repo)
	eid := uuid.New().String()

	svc.Create(eid, uuid.New().String(), "合同A", "", "", 1000)
	svc.Create(eid, uuid.New().String(), "合同B", "", "", 2000)

	contracts, total, appErr := svc.List(eid, 1, 10, "")
	assert.Nil(t, appErr)
	assert.Equal(t, int64(2), total)
	assert.Len(t, contracts, 2)
}
