package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initOrgSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "org_department_create",
		Description: "创建部门",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/departments",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "部门名称"},
			{Name: "parent_id", Type: "string", Required: false, Description: "上级部门ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_department_update",
		Description: "编辑部门信息",
		Category:    "org",
		APIEndpoint: "/api/v1/departments/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "部门ID"},
			{Name: "name", Type: "string", Required: false, Description: "部门名称"},
			{Name: "manager_id", Type: "string", Required: false, Description: "部门经理ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_department_delete",
		Description: "删除部门",
		Category:    "org",
		APIEndpoint: "/api/v1/departments/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "部门ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_department_tree",
		Description: "查询组织架构树",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/departments/tree",
		Method:      "GET",
		Parameters:  []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_department_set_manager",
		Description: "设置部门经理",
		Category:    "org",
		APIEndpoint: "/api/v1/departments/{id}/manager",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "部门ID"},
			{Name: "employee_id", Type: "string", Required: true, Description: "员工ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_position_create",
		Description: "创建岗位",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/positions",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "department_id", Type: "string", Required: false, Description: "所属部门ID"},
			{Name: "name", Type: "string", Required: true, Description: "岗位名称"},
			{Name: "description", Type: "string", Required: false, Description: "岗位描述"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_position_update",
		Description: "编辑岗位",
		Category:    "org",
		APIEndpoint: "/api/v1/positions/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "岗位ID"},
			{Name: "name", Type: "string", Required: false, Description: "岗位名称"},
			{Name: "description", Type: "string", Required: false, Description: "岗位描述"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_position_list",
		Description: "查询岗位列表",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/positions",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_group_list",
		Description: "查询集团列表",
		Category:    "org",
		APIEndpoint: "/api/v1/groups",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_group_create",
		Description: "创建集团",
		Category:    "org",
		APIEndpoint: "/api/v1/groups",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "集团名称"},
			{Name: "code", Type: "string", Required: true, Description: "集团编码"},
			{Name: "contact_email", Type: "string", Required: false, Description: "联系邮箱"},
			{Name: "contact_phone", Type: "string", Required: false, Description: "联系电话"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
			{Name: "owner_email", Type: "string", Required: false, Description: "集团老板邮箱"},
			{Name: "owner_name", Type: "string", Required: false, Description: "集团老板姓名"},
			{Name: "owner_password", Type: "string", Required: false, Description: "集团老板密码"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_group_get",
		Description: "查询集团详情",
		Category:    "org",
		APIEndpoint: "/api/v1/groups/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "集团ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_group_update",
		Description: "编辑集团信息",
		Category:    "org",
		APIEndpoint: "/api/v1/groups/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "集团ID"},
			{Name: "name", Type: "string", Required: false, Description: "集团名称"},
			{Name: "contact_email", Type: "string", Required: false, Description: "联系邮箱"},
			{Name: "contact_phone", Type: "string", Required: false, Description: "联系电话"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_group_delete",
		Description: "删除集团",
		Category:    "org",
		APIEndpoint: "/api/v1/groups/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "集团ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_group_summary",
		Description: "查询集团汇总信息（企业数、员工数等）",
		Category:    "org",
		APIEndpoint: "/api/v1/groups/summary/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "集团ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_enterprise_list",
		Description: "查询企业列表",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_enterprise_create",
		Description: "创建企业",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "group_id", Type: "string", Required: true, Description: "所属集团ID"},
			{Name: "name", Type: "string", Required: true, Description: "企业名称"},
			{Name: "code", Type: "string", Required: true, Description: "企业编码"},
			{Name: "contact_email", Type: "string", Required: false, Description: "联系邮箱"},
			{Name: "contact_phone", Type: "string", Required: false, Description: "联系电话"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_enterprise_get",
		Description: "查询企业详情",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "企业ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_enterprise_update",
		Description: "编辑企业信息",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "企业ID"},
			{Name: "name", Type: "string", Required: false, Description: "企业名称"},
			{Name: "contact_email", Type: "string", Required: false, Description: "联系邮箱"},
			{Name: "contact_phone", Type: "string", Required: false, Description: "联系电话"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_enterprise_change_status",
		Description: "修改企业状态（激活/暂停/取消等）",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/status",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "企业ID"},
			{Name: "status", Type: "string", Required: true, Description: "目标状态 (active/suspended/cancelled/trial/expired)"},
			{Name: "reason", Type: "string", Required: false, Description: "变更原因"},
			{Name: "operator_id", Type: "string", Required: true, Description: "操作人ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_enterprise_status_log",
		Description: "查询企业状态变更日志",
		Category:    "org",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/status-log",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "企业ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "org_department_get",
		Description: "查询部门详情",
		Category:    "org",
		APIEndpoint: "/api/v1/departments/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "部门ID"},
		},
	})
}
