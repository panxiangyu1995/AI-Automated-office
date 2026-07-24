package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initAuthSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "auth_switch_enterprise",
		Description: "切换当前企业（获取目标企业的token）",
		Category:    "auth",
		APIEndpoint: "/api/v1/auth/switch-enterprise",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "目标企业ID"},
		},
	})
}
