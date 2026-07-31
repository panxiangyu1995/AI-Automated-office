package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initAISkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "ai_session_create",
		Description: "创建AI助手会话",
		Category:    "ai",
		APIEndpoint: "/api/v1/ai/sessions",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "title", Type: "string", Required: false, Description: "会话标题"},
			{Name: "model", Type: "string", Required: false, Description: "模型名称"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ai_session_list",
		Description: "查询AI助手会话列表",
		Category:    "ai",
		APIEndpoint: "/api/v1/ai/sessions",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ai_session_send_message",
		Description: "向AI助手发送消息",
		Category:    "ai",
		APIEndpoint: "/api/v1/ai/sessions/{session_id}/messages",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "session_id", Type: "string", Required: true, Description: "会话ID"},
			{Name: "content", Type: "string", Required: true, Description: "消息内容"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ai_session_messages",
		Description: "查询AI助手会话消息",
		Category:    "ai",
		APIEndpoint: "/api/v1/ai/sessions/{session_id}/messages",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "session_id", Type: "string", Required: true, Description: "会话ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ai_preference_update",
		Description: "更新AI助手偏好设置",
		Category:    "ai",
		APIEndpoint: "/api/v1/ai/preferences",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "key", Type: "string", Required: true, Description: "偏好键"},
			{Name: "value", Type: "string", Required: true, Description: "偏好值"},
		},
	})
}
