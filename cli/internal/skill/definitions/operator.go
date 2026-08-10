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
		APIEndpoint: "/api/v1/audit-logs",
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
		Name:        "billing_subscription_create",
		Description: "创建企业订阅",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/subscriptions",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "plan_id", Type: "string", Required: true, Description: "套餐ID"},
			{Name: "enterprise_id", Type: "string", Required: false, Description: "企业ID(运营商用)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_subscription_list",
		Description: "查询企业订阅列表",
		Category:    "billing",
		APIEndpoint: "/api/v1/enterprise-subscriptions",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_subscription_upgrade",
		Description: "升级订阅套餐",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/subscriptions/{subscription_id}/upgrade",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "subscription_id", Type: "string", Required: true, Description: "订阅ID"},
			{Name: "new_plan_id", Type: "string", Required: true, Description: "目标套餐ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_subscription_downgrade",
		Description: "降级订阅套餐",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/subscriptions/{subscription_id}/downgrade",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "subscription_id", Type: "string", Required: true, Description: "订阅ID"},
			{Name: "new_plan_id", Type: "string", Required: true, Description: "目标套餐ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_subscription_renew",
		Description: "续费订阅",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/subscriptions/{subscription_id}/renew",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "subscription_id", Type: "string", Required: true, Description: "订阅ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_bill_get",
		Description: "查询账单详情",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/bills/{bill_id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "bill_id", Type: "string", Required: true, Description: "账单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "billing_bill_refund",
		Description: "退款",
		Category:    "billing",
		APIEndpoint: "/api/v1/billing/bills/{bill_id}/refund",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "bill_id", Type: "string", Required: true, Description: "账单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "template_list",
		Description: "查询行业模板列表",
		Category:    "template",
		APIEndpoint: "/api/v1/templates",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "template_get",
		Description: "查询行业模板详情",
		Category:    "template",
		APIEndpoint: "/api/v1/templates/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "模板ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "template_create",
		Description: "创建行业模板",
		Category:    "template",
		APIEndpoint: "/api/v1/templates",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "模板名称"},
			{Name: "industry", Type: "string", Required: true, Description: "行业标识"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "template_apply",
		Description: "应用行业模板到企业",
		Category:    "template",
		APIEndpoint: "/api/v1/templates/{id}/apply",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "模板ID"},
			{Name: "enterprise_id", Type: "string", Required: true, Description: "目标企业ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "claude_md_template_list",
		Description: "查询ClaudeMD模板列表",
		Category:    "template",
		APIEndpoint: "/api/v1/templates/claude-md",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "claude_md_template_create",
		Description: "创建ClaudeMD模板",
		Category:    "template",
		APIEndpoint: "/api/v1/templates/claude-md",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "模板名称"},
			{Name: "content", Type: "string", Required: true, Description: "模板内容"},
			{Name: "is_default", Type: "boolean", Required: false, Description: "是否默认模板"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "custom_field_list",
		Description: "查询实体自定义字段",
		Category:    "custom_field",
		APIEndpoint: "/api/v1/meta/entities/{entity}/fields",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "entity", Type: "string", Required: true, Description: "实体类型(customer/contract/employee等)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "custom_field_create",
		Description: "创建自定义字段",
		Category:    "custom_field",
		APIEndpoint: "/api/v1/meta/fields",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "entity_type", Type: "string", Required: true, Description: "实体类型(customer/contract/employee等)"},
			{Name: "field_name", Type: "string", Required: true, Description: "字段名"},
			{Name: "field_type", Type: "string", Required: true, Description: "字段类型(text/number/date/select等)"},
			{Name: "label", Type: "string", Required: false, Description: "显示标签"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "custom_field_set",
		Description: "设置实体自定义字段值",
		Category:    "custom_field",
		APIEndpoint: "/api/v1/{entity}/{id}/custom-fields",
		Method:      "PATCH",
		Parameters: []skill.ParamDef{
			{Name: "entity", Type: "string", Required: true, Description: "实体类型"},
			{Name: "id", Type: "string", Required: true, Description: "实体ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "entity_relation_get",
		Description: "查询实体关联",
		Category:    "custom_field",
		APIEndpoint: "/api/v1/{type}/{id}/relations/{name}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "type", Type: "string", Required: true, Description: "实体类型(contract/customer等)"},
			{Name: "id", Type: "string", Required: true, Description: "实体ID"},
			{Name: "name", Type: "string", Required: true, Description: "关联名称(如customer)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "skill_matrix_disable",
		Description: "禁用企业Skill矩阵中的Skill",
		Category:    "skill",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/skill-matrix/{skill_name}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "企业ID"},
			{Name: "skill_name", Type: "string", Required: true, Description: "Skill名称"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "notification_sms_send",
		Description: "发送短信通知",
		Category:    "notification",
		APIEndpoint: "/api/v1/notifications/sms/send",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "phone", Type: "string", Required: true, Description: "手机号"},
			{Name: "template_code", Type: "string", Required: true, Description: "短信模板代码"},
			{Name: "params", Type: "object", Required: false, Description: "模板参数(key-value)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "notification_email_send",
		Description: "发送邮件通知",
		Category:    "notification",
		APIEndpoint: "/api/v1/notifications/email/send",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "to", Type: "string", Required: true, Description: "收件人邮箱"},
			{Name: "subject", Type: "string", Required: true, Description: "邮件主题"},
			{Name: "body", Type: "string", Required: true, Description: "邮件正文"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_config_create",
		Description: "创建服务配置",
		Category:    "operator",
		APIEndpoint: "/api/v1/service-config",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "key", Type: "string", Required: true, Description: "配置键"},
			{Name: "value", Type: "string", Required: true, Description: "配置值"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "service_config_get",
		Description: "查询服务配置",
		Category:    "operator",
		APIEndpoint: "/api/v1/service-config/{key}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "key", Type: "string", Required: true, Description: "配置键"},
		},
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
