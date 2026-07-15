package generator

import (
	"fmt"
	"strings"
)

type SkillInfo struct {
	Name        string
	Description string
	Parameters  []ParamInfo
}

type ParamInfo struct {
	Name     string
	Type     string
	Required bool
}

type ClaudeMDConfig struct {
	EnterpriseName  string
	APIEndpoint     string
	AvailableSkills []SkillInfo
	Role            string
}

func GenerateClaudeMD(config ClaudeMDConfig) string {
	var sb strings.Builder
	sb.WriteString("# AI-Automated-office Agent 配置\n\n")
	sb.WriteString(fmt.Sprintf("## 企业: %s\n", config.EnterpriseName))
	sb.WriteString(fmt.Sprintf("## API端点: %s\n", config.APIEndpoint))
	sb.WriteString(fmt.Sprintf("## 角色: %s\n\n", config.Role))
	sb.WriteString("## 可用 Skill 列表\n\n")
	for _, skill := range config.AvailableSkills {
		sb.WriteString(fmt.Sprintf("### %s\n%s\n\n", skill.Name, skill.Description))
		if len(skill.Parameters) > 0 {
			sb.WriteString("参数:\n")
			for _, p := range skill.Parameters {
				req := ""
				if p.Required {
					req = "(必填)"
				}
				sb.WriteString(fmt.Sprintf("- %s [%s]%s\n", p.Name, p.Type, req))
			}
			sb.WriteString("\n")
		}
	}
	sb.WriteString("## 操作示例\n\n")
	sb.WriteString("```bash\nao-cli skill execute hrm_employee_list --page 1 --page-size 20\n```\n")
	return sb.String()
}
