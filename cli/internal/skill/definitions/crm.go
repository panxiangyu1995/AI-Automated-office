package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initCRMSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_create",
		Description: "创建客户档案",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customers",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "公司名称"},
			{Name: "industry", Type: "string", Required: false, Description: "行业分类"},
			{Name: "unified_social_credit_code", Type: "string", Required: false, Description: "统一社会信用代码"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_update",
		Description: "编辑客户档案",
		Category:    "crm",
		APIEndpoint: "/api/v1/customers/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "name", Type: "string", Required: false, Description: "公司名称"},
			{Name: "industry", Type: "string", Required: false, Description: "行业分类"},
			{Name: "unified_social_credit_code", Type: "string", Required: false, Description: "统一社会信用代码"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
			{Name: "level", Type: "string", Required: false, Description: "客户级别"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_delete",
		Description: "删除客户档案",
		Category:    "crm",
		APIEndpoint: "/api/v1/customers/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "客户ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_get",
		Description: "查询客户详情",
		Category:    "crm",
		APIEndpoint: "/api/v1/customers/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "enterprise_id", Type: "string", Required: false, Description: "企业ID（非企业管理员必填）"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_list",
		Description: "查询客户列表",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customers",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
			{Name: "keyword", Type: "string", Required: false, Description: "搜索关键词"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_level_create",
		Description: "创建客户分级",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customer-levels",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "分级名称"},
			{Name: "description", Type: "string", Required: false, Description: "分级描述"},
			{Name: "min_amount", Type: "number", Required: false, Description: "最低消费金额"},
			{Name: "color", Type: "string", Required: false, Description: "颜色标识"},
			{Name: "sort_order", Type: "int", Required: false, Description: "排序"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_level_list",
		Description: "查询客户分级列表",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customer-levels",
		Method:      "GET",
		Parameters: []skill.ParamDef{},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_level_update",
		Description: "编辑客户分级",
		Category:    "crm",
		APIEndpoint: "/api/v1/customer-levels/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "分级ID"},
			{Name: "name", Type: "string", Required: false, Description: "分级名称"},
			{Name: "description", Type: "string", Required: false, Description: "分级描述"},
			{Name: "min_amount", Type: "number", Required: false, Description: "最低消费金额"},
			{Name: "color", Type: "string", Required: false, Description: "颜色标识"},
			{Name: "sort_order", Type: "int", Required: false, Description: "排序"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_level_delete",
		Description: "删除客户分级",
		Category:    "crm",
		APIEndpoint: "/api/v1/customer-levels/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "分级ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_tag_add",
		Description: "为客户添加标签",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customers/{customer_id}/tags",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "tag", Type: "string", Required: true, Description: "标签名称"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_tag_list",
		Description: "查询客户的标签列表",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customers/{customer_id}/tags",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_customer_tag_remove",
		Description: "删除客户标签",
		Category:    "crm",
		APIEndpoint: "/api/v1/customers/{id}/tags",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "标签关联ID"},
			{Name: "tag", Type: "string", Required: false, Description: "标签名称"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_contact_create",
		Description: "创建联系人",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customers/{customer_id}/contacts",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "所属客户ID"},
			{Name: "name", Type: "string", Required: true, Description: "联系人姓名"},
			{Name: "position", Type: "string", Required: false, Description: "职位"},
			{Name: "phone", Type: "string", Required: false, Description: "手机号"},
			{Name: "email", Type: "string", Required: false, Description: "邮箱"},
			{Name: "role", Type: "string", Required: false, Description: "角色标记"},
			{Name: "is_primary", Type: "bool", Required: false, Description: "是否首要联系人"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_contact_update",
		Description: "编辑联系人",
		Category:    "crm",
		APIEndpoint: "/api/v1/contacts/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "联系人ID"},
			{Name: "name", Type: "string", Required: false, Description: "联系人姓名"},
			{Name: "position", Type: "string", Required: false, Description: "职位"},
			{Name: "phone", Type: "string", Required: false, Description: "手机号"},
			{Name: "email", Type: "string", Required: false, Description: "邮箱"},
			{Name: "role", Type: "string", Required: false, Description: "角色标记"},
			{Name: "is_primary", Type: "bool", Required: false, Description: "是否首要联系人"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_contact_delete",
		Description: "删除联系人",
		Category:    "crm",
		APIEndpoint: "/api/v1/contacts/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "联系人ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_contact_list",
		Description: "查询客户下的联系人列表",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customers/{customer_id}/contacts",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "role", Type: "string", Required: false, Description: "按角色标记筛选"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_opportunity_create",
		Description: "创建商机",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/opportunities",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "所属客户ID"},
			{Name: "name", Type: "string", Required: true, Description: "商机名称"},
			{Name: "amount", Type: "number", Required: false, Description: "预计金额"},
			{Name: "expected_close_at", Type: "string", Required: false, Description: "预计成交日期"},
			{Name: "description", Type: "string", Required: false, Description: "商机描述"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_opportunity_update",
		Description: "编辑商机",
		Category:    "crm",
		APIEndpoint: "/api/v1/opportunities/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "商机ID"},
			{Name: "name", Type: "string", Required: false, Description: "商机名称"},
			{Name: "status", Type: "string", Required: false, Description: "状态 (following/quoting/won/lost)"},
			{Name: "amount", Type: "number", Required: false, Description: "预计金额"},
			{Name: "expected_close_at", Type: "string", Required: false, Description: "预计成交日期"},
			{Name: "description", Type: "string", Required: false, Description: "商机描述"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_opportunity_delete",
		Description: "删除商机",
		Category:    "crm",
		APIEndpoint: "/api/v1/opportunities/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "商机ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "crm_opportunity_list",
		Description: "查询客户下的商机列表",
		Category:    "crm",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/customers/{customer_id}/opportunities",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
		},
	})
}
