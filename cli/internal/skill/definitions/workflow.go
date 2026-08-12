package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initWorkflowSkills() {
	skill.Register(skill.SkillDefinition{
		Name:           "workflow_definition_create",
		Description:    "创建审批工作流定义",
		Category:       "workflow",
		APIEndpoint:    "/api/v1/workflow-definitions",
		Method:         "POST",
		OpeningMessage: "欢迎使用审批工作流管理，您可以定义和执行审批流程。",
		RoleOpenings: map[string]skill.RoleOpening{
			"owner":    {OpeningText: "您可以创建工作流定义、提交和审批所有流程。", AvailableActions: "create,submit,approve,reject,transfer"},
			"manager":  {OpeningText: "您可以提交和审批工作流。", AvailableActions: "submit,approve,reject"},
			"employee": {OpeningText: "您可以提交审批和查看审批历史。", AvailableActions: "submit,history"},
		},
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "工作流名称"},
			{Name: "description", Type: "string", Required: false, Description: "工作流描述"},
			{Name: "flow_config", Type: "string", Required: true, Description: "流程配置（JSON）"},
			{Name: "category", Type: "string", Required: false, Description: "适用业务类型"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_definition_list",
		Description: "查询审批工作流定义列表",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflow-definitions",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_definition_get",
		Description: "查询审批工作流定义详情",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflow-definitions/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工作流定义ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_submit",
		Description: "提交审批",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "definition_id", Type: "string", Required: true, Description: "工作流定义ID"},
			{Name: "business_id", Type: "string", Required: true, Description: "业务单据ID"},
			{Name: "business_type", Type: "string", Required: true, Description: "业务类型"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_pending_list",
		Description: "查询待审批列表",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows/pending",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_approve",
		Description: "审批通过",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows/{id}/approve",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "审批实例ID"},
			{Name: "comment", Type: "string", Required: false, Description: "审批意见"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_reject",
		Description: "审批拒绝",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows/{id}/reject",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "审批实例ID"},
			{Name: "comment", Type: "string", Required: false, Description: "拒绝原因"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_history",
		Description: "查询审批历史",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows/{id}/history",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "审批实例ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_transfer",
		Description: "转交审批给他人",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows/{id}/transfer",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "审批实例ID"},
			{Name: "to_approver_id", Type: "string", Required: true, Description: "目标审批人ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_return",
		Description: "退回审批给申请人",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows/{id}/return",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "审批实例ID"},
			{Name: "reason", Type: "string", Required: false, Description: "退回原因"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "workflow_resubmit",
		Description: "重新提交被退回的审批",
		Category:    "workflow",
		APIEndpoint: "/api/v1/workflows/{id}/resubmit",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "审批实例ID"},
		},
	})
}
