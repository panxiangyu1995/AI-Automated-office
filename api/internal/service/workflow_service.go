package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
	apperrors "github.com/panxiangyu1995/AI-Automated-office/api/pkg/errors"
)

type FlowStep struct {
	Name      string          `json:"name"`
	Type      string          `json:"type"`
	Approvers []string        `json:"approvers"`
	Condition *ConditionRoute `json:"condition,omitempty"`
	Parallel  *ParallelConfig `json:"parallel,omitempty"`
}

type ConditionRoute struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"`
	Value    interface{} `json:"value"`
	ThenStep string      `json:"then_step"`
	ElseStep string      `json:"else_step"`
}

type ParallelConfig struct {
	Branches []ParallelBranch `json:"branches"`
}

type ParallelBranch struct {
	Name      string   `json:"name"`
	Approvers []string `json:"approvers"`
}

type FlowConfig struct {
	Steps []FlowStep `json:"steps"`
}

type WorkflowEngine struct {
	repo             repository.WorkflowRepository
	LoadBusinessData func(inst *model.WfInstance) map[string]interface{}
}

func NewWorkflowEngine(repo repository.WorkflowRepository) *WorkflowEngine {
	return &WorkflowEngine{
		repo:             repo,
		LoadBusinessData: func(inst *model.WfInstance) map[string]interface{} { return nil },
	}
}

func (e *WorkflowEngine) ParseFlowConfig(configJSON string) (*FlowConfig, error) {
	var config FlowConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return nil, fmt.Errorf("invalid flow config: %w", err)
	}
	if len(config.Steps) == 0 {
		return nil, fmt.Errorf("flow config must have at least one step")
	}
	for i := range config.Steps {
		step := &config.Steps[i]
		if step.Type == "" {
			step.Type = "serial"
		}
		switch step.Type {
		case "serial":
			if len(step.Approvers) == 0 {
				return nil, fmt.Errorf("step %d (%s): serial step must have at least one approver", i, step.Name)
			}
		case "parallel":
			if step.Parallel == nil || len(step.Parallel.Branches) < 2 {
				return nil, fmt.Errorf("step %d (%s): parallel step must have at least 2 branches", i, step.Name)
			}
			for j, b := range step.Parallel.Branches {
				if b.Name == "" {
					return nil, fmt.Errorf("step %d (%s): branch %d must have a name", i, step.Name, j)
				}
				if len(b.Approvers) == 0 {
					return nil, fmt.Errorf("step %d (%s): branch %d (%s) must have at least one approver", i, step.Name, j, b.Name)
				}
			}
		case "condition":
			if step.Condition == nil {
				return nil, fmt.Errorf("step %d (%s): condition step must have condition config", i, step.Name)
			}
			if step.Condition.Field == "" || step.Condition.Operator == "" || step.Condition.ThenStep == "" {
				return nil, fmt.Errorf("step %d (%s): condition must have field, operator, and then_step", i, step.Name)
			}
		default:
			return nil, fmt.Errorf("step %d (%s): unknown type %q, must be serial/parallel/condition", i, step.Name, step.Type)
		}
	}
	return &config, nil
}

func (e *WorkflowEngine) CreateInstance(definitionID uuid.UUID, enterpriseID uuid.UUID, businessID, businessType, initiatorID string) (*model.WfInstance, *apperrors.AppError) {
	def, err := e.repo.FindDefinitionByID(definitionID, enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询流程定义失败")
	}
	if def == nil {
		return nil, apperrors.ErrNotFound.WithDetail("流程定义不存在")
	}

	_, parseErr := e.ParseFlowConfig(def.FlowConfig)
	if parseErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("流程配置无效: " + parseErr.Error())
	}

	inst := &model.WfInstance{
		DefinitionID: definitionID,
		BusinessID:   businessID,
		BusinessType: businessType,
		Status:       "pending",
		CurrentStep:  0,
		InitiatorID:  initiatorID,
	}
	inst.EnterpriseID = enterpriseID

	if err := e.repo.CreateInstance(inst); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("创建流程实例失败")
	}

	return inst, nil
}

func (e *WorkflowEngine) AdvanceStep(instanceID, enterpriseID uuid.UUID, action, approverID, comment string, branchName string) (*model.WfInstance, *apperrors.AppError) {
	inst, err := e.repo.FindInstanceByID(instanceID, enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询流程实例失败")
	}
	if inst == nil {
		return nil, apperrors.ErrNotFound.WithDetail("流程实例不存在")
	}
	if inst.Status != "pending" {
		return nil, apperrors.ErrInvalidStatus.WithDetail("流程实例状态不允许操作")
	}

	def, findErr := e.repo.FindDefinitionByID(inst.DefinitionID, enterpriseID)
	if findErr != nil || def == nil {
		return nil, apperrors.ErrInternal.WithDetail("查询流程定义失败")
	}
	config, parseErr := e.ParseFlowConfig(def.FlowConfig)
	if parseErr != nil {
		return nil, apperrors.ErrInternal.WithDetail("流程配置无效")
	}

	if inst.CurrentStep >= len(config.Steps) {
		return nil, apperrors.ErrInvalidStatus.WithDetail("流程已无更多步骤")
	}

	currentFlowStep := &config.Steps[inst.CurrentStep]

	approval := &model.WfApproval{
		InstanceID: instanceID,
		StepIndex:  inst.CurrentStep,
		ApproverID: approverID,
		Action:     action,
		Comment:    comment,
	}
	approval.ApprovedAt = time.Now()

	if err := e.repo.CreateApproval(approval); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("记录审批操作失败")
	}

	if action == "reject" {
		inst.Status = "rejected"
		now := time.Now()
		inst.CompletedAt = &now
	} else if action == "approve" {
		switch currentFlowStep.Type {
		case "parallel":
			e.updateParallelBranchStatus(inst, currentFlowStep, branchName, approverID, "approved")
			if e.allParallelBranchesApproved(inst, currentFlowStep) {
				inst.ParallelStatus = "{}"
				if inst.CurrentStep+1 >= len(config.Steps) {
					inst.Status = "approved"
					now := time.Now()
					inst.CompletedAt = &now
				} else {
					inst.CurrentStep = inst.CurrentStep + 1
				}
			}
		case "condition":
			businessData := e.LoadBusinessData(inst)
			nextStepName, evalErr := e.evaluateConditionRoute(currentFlowStep, businessData)
			if evalErr != nil {
				return nil, apperrors.ErrInternal.WithDetail("条件评估失败: " + evalErr.Error())
			}
			nextIdx := e.findStepIndexByName(config, nextStepName)
			if nextIdx < 0 {
				return nil, apperrors.ErrInternal.WithDetail("条件指向的步骤不存在: " + nextStepName)
			}
			inst.CurrentStep = nextIdx
		default:
			if inst.CurrentStep+1 >= len(config.Steps) {
				inst.Status = "approved"
				now := time.Now()
				inst.CompletedAt = &now
			} else {
				inst.CurrentStep = inst.CurrentStep + 1
			}
		}
	}

	if err := e.repo.UpdateInstance(inst); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新流程实例失败")
	}

	return inst, nil
}

func (e *WorkflowEngine) evaluateConditionRoute(step *FlowStep, businessData map[string]interface{}) (string, error) {
	if step.Condition == nil {
		return "", fmt.Errorf("step %s has no condition config", step.Name)
	}
	cond := step.Condition
	fieldVal, exists := businessData[cond.Field]
	if !exists {
		return cond.ElseStep, nil
	}
	passed, err := compareValues(fieldVal, cond.Operator, cond.Value)
	if err != nil {
		return "", err
	}
	if passed {
		return cond.ThenStep, nil
	}
	return cond.ElseStep, nil
}

func compareValues(actual interface{}, operator string, expected interface{}) (bool, error) {
	actualFloat, ok := toFloat64(actual)
	if !ok {
		return false, fmt.Errorf("cannot convert actual value %v to number", actual)
	}
	expectedFloat, ok := toFloat64(expected)
	if !ok {
		return false, fmt.Errorf("cannot convert expected value %v to number", expected)
	}
	switch operator {
	case "eq":
		return actualFloat == expectedFloat, nil
	case "ne":
		return actualFloat != expectedFloat, nil
	case "gt":
		return actualFloat > expectedFloat, nil
	case "gte":
		return actualFloat >= expectedFloat, nil
	case "lt":
		return actualFloat < expectedFloat, nil
	case "lte":
		return actualFloat <= expectedFloat, nil
	default:
		return false, fmt.Errorf("unknown operator: %s", operator)
	}
}

func toFloat64(v interface{}) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case float32:
		return float64(val), true
	case int:
		return float64(val), true
	case int32:
		return float64(val), true
	case int64:
		return float64(val), true
	case json.Number:
		f, err := val.Float64()
		return f, err == nil
	default:
		return 0, false
	}
}

func (e *WorkflowEngine) findStepIndexByName(config *FlowConfig, name string) int {
	for i, s := range config.Steps {
		if s.Name == name {
			return i
		}
	}
	return -1
}

func (e *WorkflowEngine) updateParallelBranchStatus(inst *model.WfInstance, step *FlowStep, branchName, approverID, status string) {
	var statuses []model.ParallelBranchStatus
	if inst.ParallelStatus != "" && inst.ParallelStatus != "{}" {
		json.Unmarshal([]byte(inst.ParallelStatus), &statuses)
	}
	if statuses == nil {
		statuses = []model.ParallelBranchStatus{}
		for _, b := range step.Parallel.Branches {
			statuses = append(statuses, model.ParallelBranchStatus{
				BranchName: b.Name,
				Status:     "pending",
			})
		}
	}
	found := false
	for i := range statuses {
		if statuses[i].BranchName == branchName {
			statuses[i].ApproverID = approverID
			statuses[i].Status = status
			found = true
			break
		}
	}
	if !found {
		statuses = append(statuses, model.ParallelBranchStatus{
			BranchName: branchName,
			ApproverID: approverID,
			Status:     status,
		})
	}
	data, _ := json.Marshal(statuses)
	inst.ParallelStatus = string(data)
}

func (e *WorkflowEngine) allParallelBranchesApproved(inst *model.WfInstance, step *FlowStep) bool {
	var statuses []model.ParallelBranchStatus
	if inst.ParallelStatus == "" || inst.ParallelStatus == "{}" {
		return false
	}
	json.Unmarshal([]byte(inst.ParallelStatus), &statuses)
	if len(statuses) == 0 {
		return false
	}
	for _, b := range step.Parallel.Branches {
		approved := false
		for _, s := range statuses {
			if s.BranchName == b.Name && s.Status == "approved" {
				approved = true
				break
			}
		}
		if !approved {
			return false
		}
	}
	return true
}

type WorkflowService struct {
	engine *WorkflowEngine
	repo   repository.WorkflowRepository
}

func NewWorkflowService(repo repository.WorkflowRepository) *WorkflowService {
	return &WorkflowService{
		engine: NewWorkflowEngine(repo),
		repo:   repo,
	}
}

func (s *WorkflowService) CreateDefinition(def *model.WfDefinition) *apperrors.AppError {
	if def.Name == "" {
		return apperrors.NewValidationError("name", "流程名称不能为空")
	}
	if def.FlowConfig == "" {
		return apperrors.NewValidationError("flow_config", "流程配置不能为空")
	}
	if _, err := s.engine.ParseFlowConfig(def.FlowConfig); err != nil {
		return apperrors.NewValidationError("flow_config", "流程配置无效: "+err.Error())
	}
	if err := s.repo.CreateDefinition(def); err != nil {
		return apperrors.ErrInternal.WithDetail("创建流程定义失败")
	}
	return nil
}

func (s *WorkflowService) ListDefinitions(enterpriseID uuid.UUID, page, pageSize int) ([]model.WfDefinition, int64, *apperrors.AppError) {
	defs, total, err := s.repo.ListDefinitions(enterpriseID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询流程定义列表失败")
	}
	return defs, total, nil
}

func (s *WorkflowService) GetDefinition(id, enterpriseID uuid.UUID) (*model.WfDefinition, *apperrors.AppError) {
	def, err := s.repo.FindDefinitionByID(id, enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询流程定义失败")
	}
	if def == nil {
		return nil, apperrors.ErrNotFound.WithDetail("流程定义不存在")
	}
	return def, nil
}

func (s *WorkflowService) SubmitWorkflow(definitionID, enterpriseID uuid.UUID, businessID, businessType, initiatorID string) (*model.WfInstance, *apperrors.AppError) {
	return s.engine.CreateInstance(definitionID, enterpriseID, businessID, businessType, initiatorID)
}

func (s *WorkflowService) GetInstance(instanceID, enterpriseID uuid.UUID) (*model.WfInstance, *apperrors.AppError) {
	inst, err := s.repo.FindInstanceByID(instanceID, enterpriseID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询流程实例失败")
	}
	if inst == nil {
		return nil, apperrors.ErrNotFound.WithDetail("流程实例不存在")
	}
	return inst, nil
}

func (s *WorkflowService) ListPending(enterpriseID uuid.UUID, approverID string, page, pageSize int) ([]model.WfInstance, int64, *apperrors.AppError) {
	insts, total, err := s.repo.ListPendingInstances(enterpriseID, approverID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询待审批列表失败")
	}
	return insts, total, nil
}

func (s *WorkflowService) Approve(instanceID, enterpriseID uuid.UUID, approverID, comment, branchName string) (*model.WfInstance, *apperrors.AppError) {
	return s.engine.AdvanceStep(instanceID, enterpriseID, "approve", approverID, comment, branchName)
}

func (s *WorkflowService) Reject(instanceID, enterpriseID uuid.UUID, approverID, comment string) (*model.WfInstance, *apperrors.AppError) {
	return s.engine.AdvanceStep(instanceID, enterpriseID, "reject", approverID, comment, "")
}

func (s *WorkflowService) GetHistory(instanceID uuid.UUID) ([]model.WfApproval, *apperrors.AppError) {
	approvals, err := s.repo.ListApprovalsByInstance(instanceID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询审批记录失败")
	}
	return approvals, nil
}

func (s *WorkflowService) Transfer(instanceID, enterpriseID uuid.UUID, fromApproverID, toApproverID string) *apperrors.AppError {
	inst, err := s.repo.FindInstanceByID(instanceID, enterpriseID)
	if err != nil || inst == nil {
		return apperrors.ErrNotFound.WithDetail("流程实例不存在")
	}
	if inst.Status != "pending" {
		return apperrors.ErrInvalidStatus.WithDetail("仅审理中的流程可转交")
	}
	approval := &model.WfApproval{
		InstanceID: instanceID,
		StepIndex:  inst.CurrentStep,
		ApproverID: fromApproverID,
		Action:     "transfer",
		Comment:    fmt.Sprintf("转交给 %s", toApproverID),
	}
	approval.ApprovedAt = time.Now()
	if err := s.repo.CreateApproval(approval); err != nil {
		return apperrors.ErrInternal.WithDetail("记录转交操作失败")
	}
	return nil
}

func (s *WorkflowService) ReturnToApplicant(instanceID, enterpriseID uuid.UUID, approverID, reason string) *apperrors.AppError {
	inst, err := s.repo.FindInstanceByID(instanceID, enterpriseID)
	if err != nil || inst == nil {
		return apperrors.ErrNotFound.WithDetail("流程实例不存在")
	}
	if inst.Status != "pending" {
		return apperrors.ErrInvalidStatus.WithDetail("仅审理中的流程可退回")
	}
	inst.Status = "returned"
	inst.ReturnReason = reason
	inst.ReturnedBy = strPtr(approverID)
	if updateErr := s.repo.UpdateInstance(inst); updateErr != nil {
		return apperrors.ErrInternal.WithDetail("更新流程状态失败")
	}
	approval := &model.WfApproval{
		InstanceID: instanceID,
		StepIndex:  inst.CurrentStep,
		ApproverID: approverID,
		Action:     "return",
		Comment:    reason,
	}
	approval.ApprovedAt = time.Now()
	if err := s.repo.CreateApproval(approval); err != nil {
		return apperrors.ErrInternal.WithDetail("记录退回操作失败")
	}
	return nil
}

func (s *WorkflowService) Resubmit(instanceID, enterpriseID uuid.UUID) *apperrors.AppError {
	inst, err := s.repo.FindInstanceByID(instanceID, enterpriseID)
	if err != nil || inst == nil {
		return apperrors.ErrNotFound.WithDetail("流程实例不存在")
	}
	if inst.Status != "returned" {
		return apperrors.ErrInvalidStatus.WithDetail("仅已退回的流程可重新提交")
	}
	inst.Status = "pending"
	inst.ReturnReason = ""
	inst.ReturnedBy = nil
	if updateErr := s.repo.UpdateInstance(inst); updateErr != nil {
		return apperrors.ErrInternal.WithDetail("重新提交失败")
	}
	return nil
}

func (s *WorkflowService) GetParallelStatus(instanceID, enterpriseID uuid.UUID) ([]model.ParallelBranchStatus, *apperrors.AppError) {
	inst, err := s.repo.FindInstanceByID(instanceID, enterpriseID)
	if err != nil || inst == nil {
		return nil, apperrors.ErrNotFound.WithDetail("流程实例不存在")
	}
	var statuses []model.ParallelBranchStatus
	if inst.ParallelStatus != "" && inst.ParallelStatus != "{}" {
		json.Unmarshal([]byte(inst.ParallelStatus), &statuses)
	}
	return statuses, nil
}
