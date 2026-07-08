package service

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/ai-office/api/internal/model"
	"github.com/ai-office/api/internal/repository"
	apperrors "github.com/ai-office/api/pkg/errors"
)

type FlowStep struct {
	Name      string   `json:"name"`
	Type      string   `json:"type"`
	Approvers []string `json:"approvers"`
}

type FlowConfig struct {
	Steps []FlowStep `json:"steps"`
}

type WorkflowEngine struct {
	repo repository.WorkflowRepository
}

func NewWorkflowEngine(repo repository.WorkflowRepository) *WorkflowEngine {
	return &WorkflowEngine{repo: repo}
}

func (e *WorkflowEngine) ParseFlowConfig(configJSON string) (*FlowConfig, error) {
	var config FlowConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return nil, fmt.Errorf("invalid flow config: %w", err)
	}
	if len(config.Steps) == 0 {
		return nil, fmt.Errorf("flow config must have at least one step")
	}
	return &config, nil
}

func (e *WorkflowEngine) CreateInstance(definitionID uuid.UUID, enterpriseID uuid.UUID, businessID, businessType, initiatorID string) (*model.WfInstance, *apperrors.AppError) {
	def, err := e.repo.FindDefinitionByID(definitionID)
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

func (e *WorkflowEngine) AdvanceStep(instanceID uuid.UUID, action, approverID, comment string) (*model.WfInstance, *apperrors.AppError) {
	inst, err := e.repo.FindInstanceByID(instanceID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询流程实例失败")
	}
	if inst == nil {
		return nil, apperrors.ErrNotFound.WithDetail("流程实例不存在")
	}
	if inst.Status != "pending" {
		return nil, apperrors.ErrInvalidStatus.WithDetail("流程实例状态不允许操作")
	}

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
		def, findErr := e.repo.FindDefinitionByID(inst.DefinitionID)
		if findErr != nil || def == nil {
			return nil, apperrors.ErrInternal.WithDetail("查询流程定义失败")
		}

		config, parseErr := e.ParseFlowConfig(def.FlowConfig)
		if parseErr != nil {
			return nil, apperrors.ErrInternal.WithDetail("流程配置无效")
		}

		if inst.CurrentStep+1 >= len(config.Steps) {
			inst.Status = "approved"
			now := time.Now()
			inst.CompletedAt = &now
		} else {
			inst.CurrentStep = inst.CurrentStep + 1
		}
	}

	if err := e.repo.UpdateInstance(inst); err != nil {
		return nil, apperrors.ErrInternal.WithDetail("更新流程实例失败")
	}

	return inst, nil
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

func (s *WorkflowService) GetDefinition(id uuid.UUID) (*model.WfDefinition, *apperrors.AppError) {
	def, err := s.repo.FindDefinitionByID(id)
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

func (s *WorkflowService) ListPending(enterpriseID uuid.UUID, approverID string, page, pageSize int) ([]model.WfInstance, int64, *apperrors.AppError) {
	insts, total, err := s.repo.ListPendingInstances(enterpriseID, approverID, page, pageSize)
	if err != nil {
		return nil, 0, apperrors.ErrInternal.WithDetail("查询待审批列表失败")
	}
	return insts, total, nil
}

func (s *WorkflowService) Approve(instanceID uuid.UUID, approverID, comment string) (*model.WfInstance, *apperrors.AppError) {
	return s.engine.AdvanceStep(instanceID, "approve", approverID, comment)
}

func (s *WorkflowService) Reject(instanceID uuid.UUID, approverID, comment string) (*model.WfInstance, *apperrors.AppError) {
	return s.engine.AdvanceStep(instanceID, "reject", approverID, comment)
}

func (s *WorkflowService) GetHistory(instanceID uuid.UUID) ([]model.WfApproval, *apperrors.AppError) {
	approvals, err := s.repo.ListApprovalsByInstance(instanceID)
	if err != nil {
		return nil, apperrors.ErrInternal.WithDetail("查询审批记录失败")
	}
	return approvals, nil
}
