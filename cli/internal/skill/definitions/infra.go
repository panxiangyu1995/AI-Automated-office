package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initBackupSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "backup_config_create",
		Description: "创建备份配置",
		Category:    "backup",
		APIEndpoint: "/api/v1/backup/configs",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "backup_time", Type: "string", Required: true, Description: "备份时间（如 02:00）"},
			{Name: "retention_days", Type: "int", Required: false, Default: "30", Description: "保留天数"},
			{Name: "backup_type", Type: "string", Required: false, Default: "full", Description: "备份类型 (full/incremental)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "backup_config_list",
		Description: "查询备份配置列表",
		Category:    "backup",
		APIEndpoint: "/api/v1/backup/configs",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "backup_config_update",
		Description: "更新备份配置",
		Category:    "backup",
		APIEndpoint: "/api/v1/backup/configs/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "配置ID"},
			{Name: "backup_time", Type: "string", Required: false, Description: "备份时间"},
			{Name: "retention_days", Type: "int", Required: false, Description: "保留天数"},
			{Name: "enabled", Type: "bool", Required: false, Description: "是否启用"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "backup_config_delete",
		Description: "删除备份配置",
		Category:    "backup",
		APIEndpoint: "/api/v1/backup/configs/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "配置ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "backup_trigger",
		Description: "手动触发备份",
		Category:    "backup",
		APIEndpoint: "/api/v1/backup/trigger",
		Method:      "POST",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "backup_record_list",
		Description: "查询备份记录列表",
		Category:    "backup",
		APIEndpoint: "/api/v1/backup/records",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "backup_restore",
		Description: "从备份恢复数据",
		Category:    "backup",
		APIEndpoint: "/api/v1/backup/restore/{record_id}",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "record_id", Type: "string", Required: true, Description: "备份记录ID"},
		},
	})
}

func initQuotaSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "quota_get",
		Description: "查询企业 API 配额",
		Category:    "quota",
		APIEndpoint: "/api/v1/quota",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "quota_update",
		Description: "更新企业 API 配额",
		Category:    "quota",
		APIEndpoint: "/api/v1/quota",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "daily_limit", Type: "int", Required: false, Description: "日配额"},
			{Name: "monthly_limit", Type: "int", Required: false, Description: "月配额"},
			{Name: "enterprise_qps", Type: "int", Required: false, Description: "企业QPS限制"},
			{Name: "ip_qps", Type: "int", Required: false, Description: "IP QPS限制"},
		},
	})
}

func initFeatureSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "feature_list",
		Description: "查询功能模块开关列表",
		Category:    "feature",
		APIEndpoint: "/api/v1/features",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "feature_update",
		Description: "更新功能模块开关",
		Category:    "feature",
		APIEndpoint: "/api/v1/features/{key}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "key", Type: "string", Required: true, Description: "功能模块key (hrm/crm/ims/contract/sales/service/finance/workflow/kb/backup)"},
			{Name: "enabled", Type: "bool", Required: true, Description: "是否启用"},
		},
	})
}

func initAuditSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "audit_log_list",
		Description: "查询审计日志列表",
		Category:    "audit",
		APIEndpoint: "/api/v1/audit-logs",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "action", Type: "string", Required: false, Description: "操作类型 (CREATE/UPDATE/DELETE/LOGIN)"},
			{Name: "resource_type", Type: "string", Required: false, Description: "资源类型"},
			{Name: "user_id", Type: "string", Required: false, Description: "操作者ID"},
			{Name: "start_time", Type: "string", Required: false, Description: "开始时间"},
			{Name: "end_time", Type: "string", Required: false, Description: "结束时间"},
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})
}
