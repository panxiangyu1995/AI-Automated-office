package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initContractSkills() {
	skill.Register(skill.SkillDefinition{
		Name:           "contract_create",
		Description:    "创建合同",
		Category:       "contract",
		APIEndpoint:    "/api/v1/enterprises/{enterprise_id}/contracts",
		Method:         "POST",
		OpeningMessage: "欢迎使用合同管理，您可以创建、编辑、审批和管理合同全生命周期。",
		RoleOpenings: map[string]skill.RoleOpening{
			"owner":    {OpeningText: "您拥有完整的合同管理权限，可创建、审批和终止合同。", AvailableActions: "create,update,approve,terminate,link_document"},
			"manager":  {OpeningText: "您可以创建和编辑合同，提交审批。", AvailableActions: "create,update,submit_approval"},
			"employee": {OpeningText: "您可以查看合同详情和关联单据。", AvailableActions: "get,list,documents"},
		},
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "name", Type: "string", Required: true, Description: "合同名称"},
			{Name: "contract_type", Type: "string", Required: false, Description: "合同类型"},
			{Name: "amount", Type: "number", Required: false, Description: "合同金额"},
			{Name: "start_date", Type: "string", Required: false, Description: "合同开始日期"},
			{Name: "end_date", Type: "string", Required: false, Description: "合同结束日期"},
			{Name: "content", Type: "string", Required: false, Description: "合同内容"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_update",
		Description: "编辑合同",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
			{Name: "name", Type: "string", Required: false, Description: "合同名称"},
			{Name: "amount", Type: "number", Required: false, Description: "合同金额"},
			{Name: "content", Type: "string", Required: false, Description: "合同内容"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_delete",
		Description: "删除合同",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_get",
		Description: "查询合同详情",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_list",
		Description: "查询合同列表",
		Category:    "contract",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/contracts",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
			{Name: "status", Type: "string", Required: false, Description: "按状态筛选"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_submit_approval",
		Description: "提交合同审批",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}/submit-approval",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_approve",
		Description: "审批合同",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}/approve",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_change_status",
		Description: "修改合同状态",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}/status",
		Method:      "PATCH",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
			{Name: "status", Type: "string", Required: true, Description: "状态 (draft/pending_approval/effective/fulfilled/terminated)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_upload_attachment",
		Description: "上传合同附件",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}/attachments",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
			{Name: "file", Type: "file", Required: true, Description: "附件文件"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_link_document",
		Description: "关联业务单据到合同",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}/documents",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
			{Name: "ref_type", Type: "string", Required: true, Description: "关联类型 (sales_order/purchase_order/delivery)"},
			{Name: "ref_id", Type: "string", Required: true, Description: "关联单据ID"},
			{Name: "ref_no", Type: "string", Required: false, Description: "关联单据编号"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_list_documents",
		Description: "查询合同关联的业务单据",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}/documents",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "contract_patch_fields",
		Description: "部分更新合同字段（自然语言修改）",
		Category:    "contract",
		APIEndpoint: "/api/v1/contracts/{id}",
		Method:      "PATCH",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "合同ID"},
			{Name: "name", Type: "string", Required: false, Description: "合同名称"},
			{Name: "amount", Type: "number", Required: false, Description: "合同金额"},
			{Name: "content", Type: "string", Required: false, Description: "合同内容"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
		},
	})
}
