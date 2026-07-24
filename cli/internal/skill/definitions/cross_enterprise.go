package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initCrossEnterpriseSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "org_cross_enterprise_grant",
		Description: "授予跨企业权限（允许用户访问目标企业）",
		Category:    "org",
		APIEndpoint: "/api/v1/cross-enterprise/permissions",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "user_id", Type: "string", Required: true, Description: "被授权用户ID"},
			{Name: "target_enterprise_id", Type: "string", Required: true, Description: "目标企业ID"},
			{Name: "permissions", Type: "string", Required: true, Description: "权限列表（逗号分隔，如 customer:read,contract:read）"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_cross_enterprise_revoke",
		Description: "撤销跨企业权限",
		Category:    "org",
		APIEndpoint: "/api/v1/cross-enterprise/permissions/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "权限记录ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_cross_enterprise_list",
		Description: "查询用户的跨企业权限列表",
		Category:    "org",
		APIEndpoint: "/api/v1/cross-enterprise/permissions",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "user_id", Type: "string", Required: true, Description: "用户ID"},
		},
	})
}
