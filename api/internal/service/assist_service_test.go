package service

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type assistWfRepo struct {
	mock.Mock
}

func (m *assistWfRepo) CreateDefinition(def *model.WfDefinition) error {
	args := m.Called(def)
	return args.Error(0)
}

func (m *assistWfRepo) FindDefinitionByID(id, enterpriseID uuid.UUID) (*model.WfDefinition, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.WfDefinition), args.Error(1)
}

func (m *assistWfRepo) ListDefinitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.WfDefinition, int64, error) {
	args := m.Called(enterpriseID, page, pageSize)
	return args.Get(0).([]model.WfDefinition), args.Get(1).(int64), args.Error(2)
}

func (m *assistWfRepo) UpdateDefinition(def *model.WfDefinition) error {
	args := m.Called(def)
	return args.Error(0)
}

func (m *assistWfRepo) DeleteDefinition(id, enterpriseID uuid.UUID) error {
	args := m.Called(id, enterpriseID)
	return args.Error(0)
}

func (m *assistWfRepo) CreateInstance(inst *model.WfInstance) error {
	args := m.Called(inst)
	return args.Error(0)
}

func (m *assistWfRepo) FindInstanceByID(id, enterpriseID uuid.UUID) (*model.WfInstance, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.WfInstance), args.Error(1)
}

func (m *assistWfRepo) ListPendingInstances(enterpriseID uuid.UUID, approverID string, page, pageSize int) ([]model.WfInstance, int64, error) {
	args := m.Called(enterpriseID, approverID, page, pageSize)
	return args.Get(0).([]model.WfInstance), args.Get(1).(int64), args.Error(2)
}

func (m *assistWfRepo) UpdateInstance(inst *model.WfInstance) error {
	args := m.Called(inst)
	return args.Error(0)
}

func (m *assistWfRepo) CreateApproval(approval *model.WfApproval) error {
	args := m.Called(approval)
	return args.Error(0)
}

func (m *assistWfRepo) ListApprovalsByInstance(instanceID uuid.UUID) ([]model.WfApproval, error) {
	args := m.Called(instanceID)
	return args.Get(0).([]model.WfApproval), args.Error(1)
}

func (m *assistWfRepo) PluckActiveBusinessTypes(enterpriseID uuid.UUID, userID string) ([]string, error) {
	args := m.Called(enterpriseID, userID)
	return args.Get(0).([]string), args.Error(1)
}

type assistMsgRepo struct {
	mock.Mock
}

func (m *assistMsgRepo) Create(msg *model.Message) error {
	args := m.Called(msg)
	return args.Error(0)
}

func (m *assistMsgRepo) FindByID(id, enterpriseID uuid.UUID) (*model.Message, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Message), args.Error(1)
}

func (m *assistMsgRepo) ListByReceiver(enterpriseID uuid.UUID, receiverID string, page, pageSize int) ([]model.Message, int64, error) {
	args := m.Called(enterpriseID, receiverID, page, pageSize)
	return args.Get(0).([]model.Message), args.Get(1).(int64), args.Error(2)
}

func (m *assistMsgRepo) CountUnread(enterpriseID uuid.UUID, receiverID string) (int64, error) {
	args := m.Called(enterpriseID, receiverID)
	return args.Get(0).(int64), args.Error(1)
}

func (m *assistMsgRepo) MarkRead(id, enterpriseID uuid.UUID) error {
	args := m.Called(id, enterpriseID)
	return args.Error(0)
}

func (m *assistMsgRepo) ListByEnterprise(enterpriseID uuid.UUID, page, pageSize int) ([]model.Message, int64, error) {
	args := m.Called(enterpriseID, page, pageSize)
	return args.Get(0).([]model.Message), args.Get(1).(int64), args.Error(2)
}

type assistAuditLogRepo struct {
	mock.Mock
}

func (m *assistAuditLogRepo) Create(log *model.AuditLog) error {
	args := m.Called(log)
	return args.Error(0)
}

func (m *assistAuditLogRepo) FindByID(id, enterpriseID uuid.UUID) (*model.AuditLog, error) {
	args := m.Called(id, enterpriseID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.AuditLog), args.Error(1)
}

func (m *assistAuditLogRepo) List(query model.AuditLogQuery) ([]model.AuditLog, int64, error) {
	args := m.Called(query)
	return args.Get(0).([]model.AuditLog), args.Get(1).(int64), args.Error(2)
}

func (m *assistAuditLogRepo) QueryOperatorActions(page, pageSize int, action, userID, startTime, endTime string) ([]map[string]interface{}, int64, error) {
	args := m.Called(page, pageSize, action, userID, startTime, endTime)
	return args.Get(0).([]map[string]interface{}), args.Get(1).(int64), args.Error(2)
}

func (m *assistAuditLogRepo) DeleteOldByEnterprise(enterpriseID uuid.UUID, cutoff time.Time) (int64, error) {
	args := m.Called(enterpriseID, cutoff)
	return args.Get(0).(int64), args.Error(1)
}

func TestGetTodoAggregation(t *testing.T) {
	wfRepo := new(assistWfRepo)
	msgRepo := new(assistMsgRepo)
	auditRepo := new(assistAuditLogRepo)

	svc := NewAssistService(wfRepo, msgRepo, auditRepo)

	entID := uuid.New()
	userID := uuid.New().String()

	pending := []model.WfInstance{
		{BusinessType: "contract", Status: "pending"},
	}

	wfRepo.On("ListPendingInstances", entID, userID, 1, 50).Return(pending, int64(1), nil)
	msgRepo.On("CountUnread", entID, userID).Return(int64(3), nil)
	wfRepo.On("PluckActiveBusinessTypes", entID, userID).Return([]string{"contract"}, nil)

	result, err := svc.GetTodoAggregation(entID, userID)
	assert.Nil(t, err)
	assert.Equal(t, 1, len(result.PendingApprovals))
	assert.Equal(t, 3, result.UnreadMessages)
}

func TestGetProcessGuide_Contract(t *testing.T) {
	svc := NewAssistService(nil, nil, nil)

	guide, err := svc.GetProcessGuide("contract")
	assert.Nil(t, err)
	assert.NotNil(t, guide)
	assert.Equal(t, "contract", guide.ProcessType)
	assert.Equal(t, 4, len(guide.Steps))
	assert.Equal(t, "创建合同", guide.Steps[0].Title)
	assert.Equal(t, "contract_create", guide.Steps[0].SkillName)
}

func TestGetProcessGuide_Expense(t *testing.T) {
	svc := NewAssistService(nil, nil, nil)

	guide, err := svc.GetProcessGuide("expense")
	assert.Nil(t, err)
	assert.NotNil(t, guide)
	assert.Equal(t, "expense", guide.ProcessType)
	assert.Equal(t, 3, len(guide.Steps))
}

func TestGetProcessGuide_UnknownType(t *testing.T) {
	svc := NewAssistService(nil, nil, nil)

	guide, err := svc.GetProcessGuide("unknown")
	assert.Nil(t, err)
	assert.Nil(t, guide)
}

func TestGenerateWorkReport(t *testing.T) {
	wfRepo := new(assistWfRepo)
	msgRepo := new(assistMsgRepo)
	auditRepo := new(assistAuditLogRepo)

	svc := NewAssistService(wfRepo, msgRepo, auditRepo)

	entID := uuid.New()
	userID := uuid.New().String()
	now := time.Now()
	startDate := now.AddDate(0, -1, 0)
	endDate := now

	logs := []model.AuditLog{
		{ResourceType: "contract", Action: "create"},
		{ResourceType: "contract", Action: "approve"},
		{ResourceType: "customer", Action: "update"},
	}

	auditRepo.On("List", mock.MatchedBy(func(q model.AuditLogQuery) bool {
		return q.UserID == userID
	})).Return(logs, int64(3), nil)

	report, err := svc.GenerateWorkReport(entID, userID, startDate, endDate)
	assert.Nil(t, err)
	assert.NotNil(t, report)
	assert.Equal(t, 1, report.ApprovalsCount)
	assert.Equal(t, 2, report.BusinessStats["contract"])
	assert.Equal(t, 1, report.BusinessStats["customer"])
}
