package generator

import (
	"fmt"
	"strings"
)

func GenerateAgentMD(config ClaudeMDConfig) string {
	var sb strings.Builder
	sb.WriteString("# Agent 操作手册\n\n")
	sb.WriteString(fmt.Sprintf("企业: %s | 端点: %s | 角色: %s\n\n", config.EnterpriseName, config.APIEndpoint, config.Role))
	sb.WriteString("## Skill 快速参考\n\n")
	sb.WriteString("| Skill | 说明 | 参数 |\n|-------|------|------|\n")
	for _, skill := range config.AvailableSkills {
		params := make([]string, 0, len(skill.Parameters))
		for _, p := range skill.Parameters {
			params = append(params, p.Name)
		}
		sb.WriteString(fmt.Sprintf("| %s | %s | %s |\n", skill.Name, skill.Description, strings.Join(params, ", ")))
	}
	return sb.String()
}
