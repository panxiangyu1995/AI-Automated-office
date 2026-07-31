package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initMessageSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "message_send",
		Description: "发送消息",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/messages",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "receiver_id", Type: "string", Required: true, Description: "接收人ID (API字段名: receiver_id)"},
			{Name: "title", Type: "string", Required: true, Description: "消息标题"},
			{Name: "content", Type: "string", Required: true, Description: "消息内容"},
			{Name: "msg_type", Type: "string", Required: false, Description: "消息类型 (notification/alert/reminder)"},
			{Name: "priority", Type: "string", Required: false, Description: "优先级 (normal/urgent)"},
			{Name: "ref_id", Type: "string", Required: false, Description: "关联业务ID"},
			{Name: "ref_type", Type: "string", Required: false, Description: "关联业务类型"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "message_list",
		Description: "查询消息列表",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/messages",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "message_unread",
		Description: "查询未读消息数",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/messages/unread",
		Method:      "GET",
		Parameters: []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "message_poll",
		Description: "轮询新消息",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/messages/poll",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "timeout", Type: "int", Required: false, Default: "60", Description: "长轮询超时（秒）"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "message_mark_read",
		Description: "标记消息为已读",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/messages/{id}/read",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "消息ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "message_batch_mark_read",
		Description: "批量标记消息为已读",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/messages/read",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "message_ids", Type: "array", Required: true, Description: "消息ID数组"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "announcement_create",
		Description: "发送全员公告",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/announcements",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "title", Type: "string", Required: true, Description: "公告标题"},
			{Name: "content", Type: "string", Required: true, Description: "公告内容"},
			{Name: "priority", Type: "string", Required: false, Description: "优先级"},
			{Name: "target_type", Type: "string", Required: false, Description: "目标类型 (all/department/role)"},
			{Name: "target_id", Type: "string", Required: false, Description: "目标ID（部门ID或角色）"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "announcement_list",
		Description: "查询公告列表",
		Category:    "message",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/announcements",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})
}
