package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initServiceSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "service_order_create",
		Description: "创建售后工单",
		Category:    "service",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/service-orders",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "contract_id", Type: "string", Required: false, Description: "关联合同ID"},
			{Name: "order_type", Type: "string", Required: false, Description: "工单类型 (paid/free)"},
			{Name: "description", Type: "string", Required: false, Description: "问题描述"},
			{Name: "amount", Type: "number", Required: false, Description: "金额（收费工单）"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_list",
		Description: "查询售后工单列表",
		Category:    "service",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/service-orders",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
			{Name: "type", Type: "string", Required: false, Description: "按工单类型筛选"},
			{Name: "status", Type: "string", Required: false, Description: "按状态筛选"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_get",
		Description: "查询售后工单详情",
		Category:    "service",
		APIEndpoint: "/api/v1/service-orders/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_quote",
		Description: "售后工单报价",
		Category:    "service",
		APIEndpoint: "/api/v1/service-orders/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工单ID"},
			{Name: "amount", Type: "number", Required: false, Description: "报价金额"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_delete",
		Description: "删除售后工单",
		Category:    "service",
		APIEndpoint: "/api/v1/service-orders/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_change_status",
		Description: "修改售后工单状态",
		Category:    "service",
		APIEndpoint: "/api/v1/service-orders/{id}/status",
		Method:      "PATCH",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工单ID"},
			{Name: "status", Type: "string", Required: true, Description: "状态 (created/quoting/confirmed/repairing/pending_sign/completed)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_sign",
		Description: "客户签字确认工单",
		Category:    "service",
		APIEndpoint: "/api/v1/service-orders/{id}/sign",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_upload_attachment",
		Description: "上传工单附件",
		Category:    "service",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/service-orders/{id}/attachments",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工单ID"},
			{Name: "file", Type: "file", Required: true, Description: "附件文件"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_order_list_attachments",
		Description: "查询工单附件列表",
		Category:    "service",
		APIEndpoint: "/api/v1/service-orders/{id}/attachments",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "工单ID"},
		},
	})
}
