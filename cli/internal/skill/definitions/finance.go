package definitions

import (
	"github.com/ai-office/cli/internal/skill"
)

func initFinanceSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_create",
		Description: "创建回款记录",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payments",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "contract_id", Type: "string", Required: false, Description: "关联合同ID"},
			{Name: "payment_method", Type: "string", Required: false, Description: "付款方式 (bank_transfer/cash/check/other)"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
			{Name: "amount", Type: "number", Required: true, Description: "回款金额"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_list",
		Description: "查询回款记录列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payments",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_expense_create",
		Description: "创建费用报销",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/expenses",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "category", Type: "string", Required: true, Description: "费用类别"},
			{Name: "description", Type: "string", Required: false, Description: "费用描述"},
			{Name: "submitted_by", Type: "string", Required: true, Description: "提交人ID"},
			{Name: "amount", Type: "number", Required: true, Description: "费用金额"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_expense_list",
		Description: "查询费用报销列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/expenses",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_expense_approve",
		Description: "审批费用报销",
		Category:    "finance",
		APIEndpoint: "/api/v1/expenses/{id}/approve",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "报销单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_invoice_create",
		Description: "创建发票记录",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/invoices",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
			{Name: "amount", Type: "number", Required: true, Description: "发票金额"},
			{Name: "tax_amount", Type: "number", Required: false, Description: "税额"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_invoice_list",
		Description: "查询发票记录列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/invoices",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})
}
