package definitions

import (
	"github.com/ai-office/cli/internal/skill"
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
		Parameters: []skill.ParamDef{},
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
}
