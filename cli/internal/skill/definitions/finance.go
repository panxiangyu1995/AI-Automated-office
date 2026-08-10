package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initFinanceSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_create",
		Description: "创建回款记录",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payments",
		Method:      "POST",
		OpeningMessage: "欢迎使用财务管理，您可以管理回款、报销、发票等财务业务。",
		RoleOpenings: map[string]skill.RoleOpening{
			"owner":    {OpeningText: "您拥有完整的财务管理权限。", AvailableActions: "payment,expense,invoice,approve"},
			"manager":  {OpeningText: "您可以创建和审批财务记录。", AvailableActions: "payment,expense,approve"},
			"employee": {OpeningText: "您可以提交报销申请和查看发票。", AvailableActions: "expense_create,invoice_list"},
		},
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

	skill.Register(skill.SkillDefinition{
		Name:        "finance_receivable_create",
		Description: "创建应收款",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/receivables",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "contract_id", Type: "string", Required: false, Description: "关联合同ID"},
			{Name: "sales_order_id", Type: "string", Required: false, Description: "关联销售订单ID"},
			{Name: "amount", Type: "number", Required: true, Description: "应收金额"},
			{Name: "due_date", Type: "string", Required: false, Description: "到期日期"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_receivable_list",
		Description: "查询应收款列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/receivables",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payable_create",
		Description: "创建应付款",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payables",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "supplier_id", Type: "string", Required: true, Description: "供应商ID"},
			{Name: "purchase_order_id", Type: "string", Required: false, Description: "关联采购订单ID"},
			{Name: "amount", Type: "number", Required: true, Description: "应付金额"},
			{Name: "due_date", Type: "string", Required: false, Description: "到期日期"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payable_list",
		Description: "查询应付款列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payables",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_collection_create",
		Description: "创建收款确认",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/collections",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "invoice_id", Type: "string", Required: true, Description: "关联发票ID"},
			{Name: "amount", Type: "number", Required: true, Description: "收款金额"},
			{Name: "collection_method", Type: "string", Required: false, Description: "收款方式 (bank_transfer/cash/check/other)"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_collection_list",
		Description: "查询收款确认列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/collections",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_request_create",
		Description: "创建付款申请",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payment-requests",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "amount", Type: "number", Required: true, Description: "申请金额"},
			{Name: "category", Type: "string", Required: false, Description: "费用类别"},
			{Name: "description", Type: "string", Required: false, Description: "申请描述"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_request_list",
		Description: "查询付款申请列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payment-requests",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "status", Type: "string", Required: false, Description: "状态筛选"},
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_request_submit",
		Description: "提交付款申请审批",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payment-requests/{id}/submit",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "付款申请ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_request_approve",
		Description: "审批通过付款申请",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payment-requests/{id}/approve",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "付款申请ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_request_reject",
		Description: "驳回付款申请",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payment-requests/{id}/reject",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "付款申请ID"},
			{Name: "reason", Type: "string", Required: true, Description: "驳回原因"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_plan_create",
		Description: "创建付款计划(批量)",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/contracts/{contract_id}/payment-plans",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "contract_id", Type: "string", Required: true, Description: "合同ID"},
			{Name: "plans", Type: "string", Required: true, Description: "付款计划JSON数组"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_plan_list",
		Description: "查询合同付款计划",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/contracts/{contract_id}/payment-plans",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "contract_id", Type: "string", Required: true, Description: "合同ID"},
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_payment_plan_overdue",
		Description: "查询逾期付款计划",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/payment-plans/overdue",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_cash_flow_forecast",
		Description: "现金流预测",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/cash-flow-forecast",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "months", Type: "int", Required: false, Default: "3", Description: "预测月数"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_reconciliation",
		Description: "财务对账",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/reconciliation",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: false, Description: "客户ID"},
			{Name: "start_date", Type: "string", Required: false, Description: "开始日期"},
			{Name: "end_date", Type: "string", Required: false, Description: "结束日期"},
		},
	})
}
