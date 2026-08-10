package service

import (
	"encoding/json"
	"testing"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
)

type mockWorkflowRepo struct {
	definitions map[uuid.UUID]*model.WfDefinition
	instances   map[uuid.UUID]*model.WfInstance
	approvals   []model.WfApproval
}

func newMockWorkflowRepo() *mockWorkflowRepo {
	return &mockWorkflowRepo{
		definitions: make(map[uuid.UUID]*model.WfDefinition),
		instances:   make(map[uuid.UUID]*model.WfInstance),
	}
}

func (m *mockWorkflowRepo) CreateDefinition(def *model.WfDefinition) error {
	if def.ID == uuid.Nil {
		def.ID = uuid.New()
	}
	m.definitions[def.ID] = def
	return nil
}

func (m *mockWorkflowRepo) FindDefinitionByID(id, enterpriseID uuid.UUID) (*model.WfDefinition, error) {
	return m.definitions[id], nil
}

func (m *mockWorkflowRepo) ListDefinitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.WfDefinition, int64, error) {
	var result []model.WfDefinition
	for _, d := range m.definitions {
		if d.EnterpriseID == enterpriseID {
			result = append(result, *d)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockWorkflowRepo) UpdateDefinition(def *model.WfDefinition) error {
	m.definitions[def.ID] = def
	return nil
}

func (m *mockWorkflowRepo) DeleteDefinition(id, enterpriseID uuid.UUID) error {
	delete(m.definitions, id)
	return nil
}

func (m *mockWorkflowRepo) CreateInstance(inst *model.WfInstance) error {
	if inst.ID == uuid.Nil {
		inst.ID = uuid.New()
	}
	m.instances[inst.ID] = inst
	return nil
}

func (m *mockWorkflowRepo) FindInstanceByID(id, enterpriseID uuid.UUID) (*model.WfInstance, error) {
	return m.instances[id], nil
}

func (m *mockWorkflowRepo) ListPendingInstances(enterpriseID uuid.UUID, approverID string, page, pageSize int) ([]model.WfInstance, int64, error) {
	var result []model.WfInstance
	for _, inst := range m.instances {
		if inst.EnterpriseID == enterpriseID && inst.Status == "pending" {
			result = append(result, *inst)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockWorkflowRepo) UpdateInstance(inst *model.WfInstance) error {
	m.instances[inst.ID] = inst
	return nil
}

func (m *mockWorkflowRepo) CreateApproval(approval *model.WfApproval) error {
	if approval.ID == uuid.Nil {
		approval.ID = uuid.New()
	}
	m.approvals = append(m.approvals, *approval)
	return nil
}

func (m *mockWorkflowRepo) ListApprovalsByInstance(instanceID uuid.UUID) ([]model.WfApproval, error) {
	var result []model.WfApproval
	for _, a := range m.approvals {
		if a.InstanceID == instanceID {
			result = append(result, a)
		}
	}
	return result, nil
}

func (m *mockWorkflowRepo) PluckActiveBusinessTypes(enterpriseID uuid.UUID, userID string) ([]string, error) {
	return nil, nil
}

func TestParseFlowConfig_SerialStep(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	config := `{"steps":[{"name":"manager","type":"serial","approvers":["u1"]}]}`
	fc, err := engine.ParseFlowConfig(config)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(fc.Steps) != 1 {
		t.Fatalf("expected 1 step, got %d", len(fc.Steps))
	}
	if fc.Steps[0].Type != "serial" {
		t.Errorf("expected type serial, got %s", fc.Steps[0].Type)
	}
}

func TestParseFlowConfig_DefaultType(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	config := `{"steps":[{"name":"manager","approvers":["u1"]}]}`
	fc, err := engine.ParseFlowConfig(config)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if fc.Steps[0].Type != "serial" {
		t.Errorf("expected default type serial, got %s", fc.Steps[0].Type)
	}
}

func TestParseFlowConfig_ParallelStep(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	config := `{"steps":[{"name":"parallel_review","type":"parallel","parallel":{"branches":[{"name":"finance","approvers":["u1"]},{"name":"legal","approvers":["u2"]}]}}]}`
	fc, err := engine.ParseFlowConfig(config)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if fc.Steps[0].Type != "parallel" {
		t.Errorf("expected type parallel, got %s", fc.Steps[0].Type)
	}
	if len(fc.Steps[0].Parallel.Branches) != 2 {
		t.Errorf("expected 2 branches, got %d", len(fc.Steps[0].Parallel.Branches))
	}
}

func TestParseFlowConfig_ParallelStep_LessThan2Branches(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	config := `{"steps":[{"name":"bad","type":"parallel","parallel":{"branches":[{"name":"only","approvers":["u1"]}]}}]}`
	_, err := engine.ParseFlowConfig(config)
	if err == nil {
		t.Fatal("expected error for parallel with <2 branches")
	}
}

func TestParseFlowConfig_ConditionStep(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	config := `{"steps":[{"name":"check_amount","type":"condition","condition":{"field":"amount","operator":"gt","value":10000,"then_step":"director","else_step":"end"}}]}`
	fc, err := engine.ParseFlowConfig(config)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if fc.Steps[0].Type != "condition" {
		t.Errorf("expected type condition, got %s", fc.Steps[0].Type)
	}
	if fc.Steps[0].Condition.Field != "amount" {
		t.Errorf("expected field amount, got %s", fc.Steps[0].Condition.Field)
	}
}

func TestParseFlowConfig_ConditionStep_MissingField(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	config := `{"steps":[{"name":"bad","type":"condition","condition":{"operator":"gt","value":10000,"then_step":"director"}}]}`
	_, err := engine.ParseFlowConfig(config)
	if err == nil {
		t.Fatal("expected error for condition missing field")
	}
}

func TestParseFlowConfig_UnknownType(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	config := `{"steps":[{"name":"bad","type":"unknown","approvers":["u1"]}]}`
	_, err := engine.ParseFlowConfig(config)
	if err == nil {
		t.Fatal("expected error for unknown type")
	}
}

func TestEvaluateConditionRoute_GT(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	step := &FlowStep{
		Name: "check",
		Type: "condition",
		Condition: &ConditionRoute{
			Field:    "amount",
			Operator: "gt",
			Value:    float64(10000),
			ThenStep: "director",
			ElseStep: "end",
		},
	}

	result, err := engine.evaluateConditionRoute(step, map[string]interface{}{"amount": float64(15000)})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "director" {
		t.Errorf("expected director, got %s", result)
	}

	result, err = engine.evaluateConditionRoute(step, map[string]interface{}{"amount": float64(5000)})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "end" {
		t.Errorf("expected end, got %s", result)
	}
}

func TestEvaluateConditionRoute_MissingField(t *testing.T) {
	engine := NewWorkflowEngine(nil)
	step := &FlowStep{
		Name: "check",
		Type: "condition",
		Condition: &ConditionRoute{
			Field:    "amount",
			Operator: "gt",
			Value:    float64(10000),
			ThenStep: "director",
			ElseStep: "end",
		},
	}

	result, err := engine.evaluateConditionRoute(step, map[string]interface{}{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result != "end" {
		t.Errorf("expected else_step when field missing, got %s", result)
	}
}

func TestCompareValues_AllOperators(t *testing.T) {
	tests := []struct {
		actual   interface{}
		operator string
		expected interface{}
		want     bool
	}{
		{float64(10), "eq", float64(10), true},
		{float64(10), "eq", float64(20), false},
		{float64(10), "ne", float64(20), true},
		{float64(10), "ne", float64(10), false},
		{float64(20), "gt", float64(10), true},
		{float64(5), "gt", float64(10), false},
		{float64(10), "gte", float64(10), true},
		{float64(5), "gte", float64(10), false},
		{float64(5), "lt", float64(10), true},
		{float64(15), "lt", float64(10), false},
		{float64(10), "lte", float64(10), true},
		{float64(15), "lte", float64(10), false},
		{int(10), "eq", float64(10), true},
		{int64(10), "gt", float64(5), true},
	}
	for _, tt := range tests {
		got, err := compareValues(tt.actual, tt.operator, tt.expected)
		if err != nil {
			t.Errorf("compareValues(%v, %s, %v) error: %v", tt.actual, tt.operator, tt.expected, err)
			continue
		}
		if got != tt.want {
			t.Errorf("compareValues(%v, %s, %v) = %v, want %v", tt.actual, tt.operator, tt.expected, got, tt.want)
		}
	}
}

func TestParallelApproval_BothBranchesApprove_Advance(t *testing.T) {
	repo := newMockWorkflowRepo()
	svc := NewWorkflowService(repo)

	entID := uuid.New()
	defID := uuid.New()
	instID := uuid.New()

	flowConfig := `{"steps":[{"name":"parallel_review","type":"parallel","parallel":{"branches":[{"name":"finance","approvers":["u1"]},{"name":"legal","approvers":["u2"]}]}},{"name":"final","type":"serial","approvers":["u3"]}]}`
	repo.definitions[defID] = &model.WfDefinition{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: defID}, EnterpriseID: entID},
		FlowConfig:  flowConfig,
	}
	repo.instances[instID] = &model.WfInstance{
		TenantModel:    model.TenantModel{BaseModel: model.BaseModel{ID: instID}, EnterpriseID: entID},
		DefinitionID:   defID,
		BusinessID:     "biz-1",
		BusinessType:   "contract",
		Status:         "pending",
		CurrentStep:    0,
		InitiatorID:    "initiator",
		ParallelStatus: "{}",
	}

	inst, appErr := svc.Approve(instID, entID, "u1", "ok", "finance")
	if appErr != nil {
		t.Fatalf("first approve error: %v", appErr)
	}
	if inst.Status != "pending" {
		t.Errorf("after 1st branch approve, status should still be pending, got %s", inst.Status)
	}
	if inst.CurrentStep != 0 {
		t.Errorf("after 1st branch approve, should still be on step 0, got %d", inst.CurrentStep)
	}

	inst, appErr = svc.Approve(instID, entID, "u2", "ok", "legal")
	if appErr != nil {
		t.Fatalf("second approve error: %v", appErr)
	}
	if inst.CurrentStep != 1 {
		t.Errorf("after both branches approve, should advance to step 1, got %d", inst.CurrentStep)
	}
	if inst.Status != "pending" {
		t.Errorf("after both branches approve, status should still be pending (more steps), got %s", inst.Status)
	}
}

func TestParallelApproval_OneBranchPending_NoAdvance(t *testing.T) {
	repo := newMockWorkflowRepo()
	svc := NewWorkflowService(repo)

	entID := uuid.New()
	defID := uuid.New()
	instID := uuid.New()

	flowConfig := `{"steps":[{"name":"parallel_review","type":"parallel","parallel":{"branches":[{"name":"finance","approvers":["u1"]},{"name":"legal","approvers":["u2"]}]}},{"name":"final","type":"serial","approvers":["u3"]}]}`
	repo.definitions[defID] = &model.WfDefinition{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: defID}, EnterpriseID: entID},
		FlowConfig:  flowConfig,
	}
	repo.instances[instID] = &model.WfInstance{
		TenantModel:    model.TenantModel{BaseModel: model.BaseModel{ID: instID}, EnterpriseID: entID},
		DefinitionID:   defID,
		BusinessID:     "biz-1",
		BusinessType:   "contract",
		Status:         "pending",
		CurrentStep:    0,
		InitiatorID:    "initiator",
		ParallelStatus: "{}",
	}

	inst, appErr := svc.Approve(instID, entID, "u1", "ok", "finance")
	if appErr != nil {
		t.Fatalf("approve error: %v", appErr)
	}
	if inst.CurrentStep != 0 {
		t.Errorf("should not advance with only 1 branch approved, got step %d", inst.CurrentStep)
	}

	var statuses []model.ParallelBranchStatus
	json.Unmarshal([]byte(inst.ParallelStatus), &statuses)
	financeApproved := false
	for _, s := range statuses {
		if s.BranchName == "finance" && s.Status == "approved" {
			financeApproved = true
		}
	}
	if !financeApproved {
		t.Error("finance branch should be approved")
	}
}

func TestConditionRoute_AmountGT10000(t *testing.T) {
	repo := newMockWorkflowRepo()
	svc := NewWorkflowService(repo)

	entID := uuid.New()
	defID := uuid.New()
	instID := uuid.New()

	flowConfig := `{"steps":[{"name":"manager","type":"serial","approvers":["u1"]},{"name":"check_amount","type":"condition","condition":{"field":"amount","operator":"gt","value":10000,"then_step":"director","else_step":"end"}},{"name":"director","type":"serial","approvers":["u2"]},{"name":"end","type":"serial","approvers":["u3"]}]}`
	repo.definitions[defID] = &model.WfDefinition{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: defID}, EnterpriseID: entID},
		FlowConfig:  flowConfig,
	}
	repo.instances[instID] = &model.WfInstance{
		TenantModel:    model.TenantModel{BaseModel: model.BaseModel{ID: instID}, EnterpriseID: entID},
		DefinitionID:   defID,
		BusinessID:     "biz-1",
		BusinessType:   "contract",
		Status:         "pending",
		CurrentStep:    0,
		InitiatorID:    "initiator",
		ParallelStatus: "{}",
	}

	inst, appErr := svc.Approve(instID, entID, "u1", "ok", "")
	if appErr != nil {
		t.Fatalf("approve error: %v", appErr)
	}
	if inst.CurrentStep != 1 {
		t.Fatalf("should be on condition step 1, got %d", inst.CurrentStep)
	}

	svc.engine.LoadBusinessData = func(inst *model.WfInstance) map[string]interface{} {
		return map[string]interface{}{"amount": float64(15000)}
	}

	inst, appErr = svc.Approve(instID, entID, "u1", "evaluate condition", "")
	if appErr != nil {
		t.Fatalf("condition approve error: %v", appErr)
	}
	if inst.CurrentStep != 2 {
		t.Errorf("amount > 10000 should route to director (step 2), got step %d", inst.CurrentStep)
	}
}

func TestConditionRoute_AmountLTE10000(t *testing.T) {
	repo := newMockWorkflowRepo()
	svc := NewWorkflowService(repo)

	entID := uuid.New()
	defID := uuid.New()
	instID := uuid.New()

	flowConfig := `{"steps":[{"name":"manager","type":"serial","approvers":["u1"]},{"name":"check_amount","type":"condition","condition":{"field":"amount","operator":"gt","value":10000,"then_step":"director","else_step":"end"}},{"name":"director","type":"serial","approvers":["u2"]},{"name":"end","type":"serial","approvers":["u3"]}]}`
	repo.definitions[defID] = &model.WfDefinition{
		TenantModel: model.TenantModel{BaseModel: model.BaseModel{ID: defID}, EnterpriseID: entID},
		FlowConfig:  flowConfig,
	}
	repo.instances[instID] = &model.WfInstance{
		TenantModel:    model.TenantModel{BaseModel: model.BaseModel{ID: instID}, EnterpriseID: entID},
		DefinitionID:   defID,
		BusinessID:     "biz-1",
		BusinessType:   "contract",
		Status:         "pending",
		CurrentStep:    0,
		InitiatorID:    "initiator",
		ParallelStatus: "{}",
	}

	inst, appErr := svc.Approve(instID, entID, "u1", "ok", "")
	if appErr != nil {
		t.Fatalf("approve error: %v", appErr)
	}

	svc.engine.LoadBusinessData = func(inst *model.WfInstance) map[string]interface{} {
		return map[string]interface{}{"amount": float64(5000)}
	}

	inst, appErr = svc.Approve(instID, entID, "u1", "evaluate condition", "")
	if appErr != nil {
		t.Fatalf("condition approve error: %v", appErr)
	}
	// "end" 表示流程直接结束（无需人工审批 end 步骤）
	if inst.Status != "approved" {
		t.Errorf("amount <= 10000 should end the workflow (approved), got status %s", inst.Status)
	}
}
