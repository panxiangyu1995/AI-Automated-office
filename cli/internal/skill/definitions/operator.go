package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initOperatorSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "operator_dashboard",
		Description: "运营仪表盘",
		Category:    "operator",
		APIEndpoint: "/api/v1/dashboard",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "operator_webhook_create",
		Description: "创建Webhook",
		Category:    "operator",
		APIEndpoint: "/api/v1/webhooks",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "url", Type: "string", Required: true, Description: "Webhook URL"},
			{Name: "events", Type: "string", Required: false, Description: "订阅事件(逗号分隔)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "operator_webhook_list",
		Description: "查询Webhook列表",
		Category:    "operator",
		APIEndpoint: "/api/v1/webhooks",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "operator_service_ticket_create",
		Description: "创建客服工单",
		Category:    "operator",
		APIEndpoint: "/api/v1/service-tickets",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "subject", Type: "string", Required: true, Description: "工单主题"},
			{Name: "description", Type: "string", Required: false, Description: "工单描述"},
			{Name: "priority", Type: "string", Required: false, Description: "优先级"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "operator_service_ticket_list",
		Description: "查询客服工单列表",
		Category:    "operator",
		APIEndpoint: "/api/v1/service-tickets",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "operator_sla_metrics",
		Description: "查询SLA指标",
		Category:    "operator",
		APIEndpoint: "/api/v1/sla-metrics",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "operator_audit_logs",
		Description: "查询审计日志",
		Category:    "operator",
		APIEndpoint: "/api/v1/audit-log-entries",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_plan_create",
		Description: "创建订阅套餐",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/plans",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "套餐名称"},
			{Name: "price", Type: "number", Required: true, Description: "价格"},
			{Name: "billing_cycle", Type: "string", Required: false, Description: "计费周期(monthly/yearly)"},
			{Name: "features", Type: "string", Required: false, Description: "功能列表(逗号分隔)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_plan_list",
		Description: "查询订阅套餐列表",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/plans",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_bill_list",
		Description: "查询账单列表",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/bills",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_revenue_summary",
		Description: "收入汇总",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/revenue-summary",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_owner_signals",
		Description: "老板信号面板",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/owner/signals",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_owner_kpi",
		Description: "老板KPI面板",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/owner/kpi",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_owner_alert_rule_create",
		Description: "创建预警规则",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/owner/alert-rules",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "dimension", Type: "string", Required: true, Description: "维度"},
			{Name: "metric", Type: "string", Required: true, Description: "指标"},
			{Name: "operator", Type: "string", Required: true, Description: "运算符(gt/lt/eq)"},
			{Name: "threshold", Type: "number", Required: true, Description: "阈值"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "finance_owner_alert_rule_list",
		Description: "查询预警规则列表",
		Category:    "finance",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/owner/alert-rules",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})
}
