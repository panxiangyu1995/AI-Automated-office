package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initDataExportSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "data_export_create",
		Description: "创建数据导出任务（支持单实体/跨实体/员工维度/员工审计/对话式导出）",
		Category:    "export",
		APIEndpoint: "/api/v1/data-export",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "export_type", Type: "string", Required: true, Default: "single", Description: "导出类型(single/cross_entity/employee_dimension/employee_audit/conversational)"},
			{Name: "entity_type", Type: "string", Required: true, Description: "实体类型"},
			{Name: "entity_id", Type: "string", Required: false, Description: "实体ID"},
			{Name: "format", Type: "string", Required: false, Default: "xlsx", Description: "导出格式(xlsx/csv)"},
		},
		Actions: map[string]skill.ActionDef{
			"single": {
				Endpoint: "/api/v1/data-export",
				Method:   "POST",
				Params: []skill.ParamDef{
					{Name: "export_type", Type: "string", Required: true, Default: "single", Description: "导出类型"},
					{Name: "entity_type", Type: "string", Required: true, Description: "实体类型 (employee/customer/contract/order/payment/expense/invoice/material/supplier/warehouse/service_order/contact/opportunity)"},
					{Name: "entity_id", Type: "string", Required: false, Description: "实体ID（单实体导出时必填）"},
					{Name: "format", Type: "string", Required: false, Default: "xlsx", Description: "导出格式 (xlsx/csv)"},
					{Name: "fields", Type: "array", Required: false, Description: "指定导出字段列表"},
					{Name: "filters", Type: "object", Required: false, Description: "过滤条件"},
				},
			},
			"cross_entity": {
				Endpoint: "/api/v1/data-export",
				Method:   "POST",
				Params: []skill.ParamDef{
					{Name: "export_type", Type: "string", Required: true, Default: "cross_entity", Description: "跨实体导出"},
					{Name: "entity_type", Type: "string", Required: true, Default: "customer", Description: "锚点实体类型"},
					{Name: "entity_id", Type: "string", Required: true, Description: "锚点实体ID"},
					{Name: "format", Type: "string", Required: false, Default: "xlsx", Description: "导出格式"},
				},
			},
			"employee_dimension": {
				Endpoint: "/api/v1/data-export",
				Method:   "POST",
				Params: []skill.ParamDef{
					{Name: "export_type", Type: "string", Required: true, Default: "employee_dimension", Description: "员工维度导出"},
					{Name: "entity_type", Type: "string", Required: true, Default: "employee", Description: "实体类型"},
					{Name: "entity_id", Type: "string", Required: true, Description: "员工ID"},
					{Name: "format", Type: "string", Required: false, Default: "xlsx", Description: "导出格式"},
				},
			},
			"employee_audit": {
				Endpoint: "/api/v1/data-export",
				Method:   "POST",
				Params: []skill.ParamDef{
					{Name: "export_type", Type: "string", Required: true, Default: "employee_audit", Description: "员工审计日志导出"},
					{Name: "entity_type", Type: "string", Required: true, Default: "employee", Description: "实体类型"},
					{Name: "entity_id", Type: "string", Required: true, Description: "员工ID"},
					{Name: "format", Type: "string", Required: false, Default: "xlsx", Description: "导出格式"},
				},
			},
			"conversational": {
				Endpoint: "/api/v1/data-export",
				Method:   "POST",
				Params: []skill.ParamDef{
					{Name: "export_type", Type: "string", Required: true, Default: "conversational", Description: "对话式导出"},
					{Name: "entity_type", Type: "string", Required: true, Description: "实体类型"},
					{Name: "format", Type: "string", Required: false, Default: "xlsx", Description: "导出格式"},
					{Name: "filters", Type: "object", Required: false, Description: "自然语言转化的过滤条件"},
				},
			},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "data_export_list",
		Description: "查询导出任务列表",
		Category:    "export",
		APIEndpoint: "/api/v1/data-export",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "data_export_get",
		Description: "查询导出任务详情",
		Category:    "export",
		APIEndpoint: "/api/v1/data-export/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "导出任务ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "data_export_download",
		Description: "下载导出文件",
		Category:    "export",
		APIEndpoint: "/api/v1/data-export/{id}/download",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "导出任务ID"},
		},
	})
}
