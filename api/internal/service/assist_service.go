package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/panxiangyu1995/AI-Automated-office/api/internal/model"
	"github.com/panxiangyu1995/AI-Automated-office/api/internal/repository"
)

type TodoAggregation struct {
	PendingApprovals []model.WfInstance `json:"pending_approvals"`
	UnreadMessages   int                `json:"unread_messages"`
	ActiveTasks      []string           `json:"active_tasks"`
}

type GuideStep struct {
	StepNumber int    `json:"step_number"`
	Title      string `json:"title"`
	SkillName  string `json:"skill_name"`
}

type ProcessGuide struct {
	ProcessType         string      `json:"process_type"`
	Steps               []GuideStep `json:"steps"`
	RequiredPermissions []string    `json:"required_permissions"`
}

type WorkReport struct {
	Period         string         `json:"period"`
	Summary        string         `json:"summary"`
	ApprovalsCount int            `json:"approvals_count"`
	BusinessStats  map[string]int `json:"business_stats"`
}

type AssistService struct {
	workflowRepo repository.WorkflowRepository
	messageRepo  repository.MessageRepository
	auditLogRepo repository.AuditLogRepository
}

func NewAssistService(
	workflowRepo repository.WorkflowRepository,
	messageRepo repository.MessageRepository,
	auditLogRepo repository.AuditLogRepository,
) *AssistService {
	return &AssistService{
		workflowRepo: workflowRepo,
		messageRepo:  messageRepo,
		auditLogRepo: auditLogRepo,
	}
}

func (s *AssistService) GetTodoAggregation(enterpriseID uuid.UUID, userID string) (*TodoAggregation, error) {
	pending, _, err := s.workflowRepo.ListPendingInstances(enterpriseID, userID, 1, 50)
	if err != nil {
		return nil, fmt.Errorf("查询待审批失败: %w", err)
	}

	unreadCount, err := s.messageRepo.CountUnread(enterpriseID, userID)
	if err != nil {
		unreadCount = 0
	}

	activeTasks, _ := s.workflowRepo.PluckActiveBusinessTypes(enterpriseID, userID)

	return &TodoAggregation{
		PendingApprovals: pending,
		UnreadMessages:   int(unreadCount),
		ActiveTasks:      activeTasks,
	}, nil
}

var processGuideMap = map[string]ProcessGuide{
	"contract": {
		ProcessType: "contract",
		Steps: []GuideStep{
			{StepNumber: 1, Title: "创建合同", SkillName: "contract_create"},
			{StepNumber: 2, Title: "提交审批", SkillName: "contract_submit_approval"},
			{StepNumber: 3, Title: "审批通过", SkillName: "contract_approve"},
			{StepNumber: 4, Title: "合同生效", SkillName: "contract_change_status"},
		},
		RequiredPermissions: []string{"contract:write", "workflow:approve"},
	},
	"purchase": {
		ProcessType: "purchase",
		Steps: []GuideStep{
			{StepNumber: 1, Title: "创建采购订单", SkillName: "ims_purchase_order_create"},
			{StepNumber: 2, Title: "提交审批", SkillName: "workflow_submit"},
			{StepNumber: 3, Title: "采购入库", SkillName: "ims_purchase_order_receive"},
		},
		RequiredPermissions: []string{"purchase:write", "inventory:write"},
	},
	"expense": {
		ProcessType: "expense",
		Steps: []GuideStep{
			{StepNumber: 1, Title: "创建报销单", SkillName: "finance_expense_create"},
			{StepNumber: 2, Title: "提交审批", SkillName: "workflow_submit"},
			{StepNumber: 3, Title: "审批通过", SkillName: "finance_expense_approve"},
		},
		RequiredPermissions: []string{"expense:write", "expense:approve"},
	},
	"leave": {
		ProcessType: "leave",
		Steps: []GuideStep{
			{StepNumber: 1, Title: "提交请假申请", SkillName: "workflow_submit"},
			{StepNumber: 2, Title: "主管审批", SkillName: "workflow_approve"},
		},
		RequiredPermissions: []string{"workflow:submit"},
	},
}

func (s *AssistService) GetProcessGuide(processType string) (*ProcessGuide, error) {
	guide, ok := processGuideMap[processType]
	if !ok {
		return nil, nil
	}
	return &guide, nil
}

func (s *AssistService) GenerateWorkReport(enterpriseID uuid.UUID, userID string, startDate, endDate time.Time) (*WorkReport, error) {
	logs, _, err := s.auditLogRepo.List(model.AuditLogQuery{
		EnterpriseID: enterpriseID.String(),
		UserID:       userID,
		StartTime:    startDate.Format(time.RFC3339),
		EndTime:      endDate.Format(time.RFC3339),
		Page:         1,
		PageSize:     1000,
	})
	if err != nil {
		return nil, fmt.Errorf("查询审计日志失败: %w", err)
	}

	businessStats := make(map[string]int)
	approvalsCount := 0
	for _, l := range logs {
		businessStats[l.ResourceType]++
		if l.Action == "approve" {
			approvalsCount++
		}
	}

	period := fmt.Sprintf("%s ~ %s", startDate.Format("2006-01-02"), endDate.Format("2006-01-02"))
	summary := fmt.Sprintf("期间共操作 %d 次，审批 %d 次", len(logs), approvalsCount)

	return &WorkReport{
		Period:         period,
		Summary:        summary,
		ApprovalsCount: approvalsCount,
		BusinessStats:  businessStats,
	}, nil
}
