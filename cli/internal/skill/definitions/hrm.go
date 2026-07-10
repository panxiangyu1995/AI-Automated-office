package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initHRMSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_create",
		Description: "创建员工档案（入职）",
		Category:    "hrm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/employees",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "department_id", Type: "string", Required: true, Description: "所属部门ID"},
			{Name: "name", Type: "string", Required: true, Description: "员工姓名"},
			{Name: "email", Type: "string", Required: true, Description: "邮箱"},
			{Name: "phone", Type: "string", Required: false, Description: "手机号"},
			{Name: "position", Type: "string", Required: false, Description: "岗位"},
			{Name: "employee_no", Type: "string", Required: false, Description: "工号"},
			{Name: "role", Type: "string", Required: false, Description: "角色 (admin/manager/employee)"},
			{Name: "hire_date", Type: "string", Required: false, Description: "入职日期"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_update",
		Description: "编辑员工档案",
		Category:    "hrm",
		APIEndpoint: "/api/v1/employees/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "员工ID"},
			{Name: "name", Type: "string", Required: false, Description: "员工姓名"},
			{Name: "email", Type: "string", Required: false, Description: "邮箱"},
			{Name: "phone", Type: "string", Required: false, Description: "手机号"},
			{Name: "position", Type: "string", Required: false, Description: "岗位"},
			{Name: "employee_no", Type: "string", Required: false, Description: "工号"},
			{Name: "role", Type: "string", Required: false, Description: "角色"},
			{Name: "status", Type: "string", Required: false, Description: "状态 (active/resigned)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_delete",
		Description: "删除员工档案",
		Category:    "hrm",
		APIEndpoint: "/api/v1/employees/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "员工ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_get",
		Description: "查询员工详情",
		Category:    "hrm",
		APIEndpoint: "/api/v1/employees/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "员工ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_list",
		Description: "查询员工列表",
		Category:    "hrm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/employees",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
			{Name: "keyword", Type: "string", Required: false, Description: "搜索关键词（姓名模糊搜索）"},
			{Name: "role", Type: "string", Required: false, Description: "按角色筛选"},
			{Name: "department_id", Type: "string", Required: false, Description: "按部门筛选"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_transfer",
		Description: "员工调岗",
		Category:    "hrm",
		APIEndpoint: "/api/v1/employees/{id}/transfer",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "员工ID"},
			{Name: "department_id", Type: "string", Required: true, Description: "目标部门ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_batch_import",
		Description: "批量导入员工（支持Excel/CSV）",
		Category:    "hrm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/employees/batch-import",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "file", Type: "file", Required: true, Description: "导入文件（Excel/CSV）"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "hrm_employee_sales_performance",
		Description: "查询员工销售业绩",
		Category:    "hrm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/employees/sales-performance",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "employee_id", Type: "string", Required: false, Description: "员工ID"},
			{Name: "start_time", Type: "string", Required: false, Description: "开始时间"},
			{Name: "end_time", Type: "string", Required: false, Description: "结束时间"},
		},
	})
}
