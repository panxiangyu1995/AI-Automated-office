package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initSalesSkills() {
	skill.Register(skill.SkillDefinition{
		Name:        "sales_order_create",
		Description: "创建销售订单",
		Category:    "sales",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/sales-orders",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
			{Name: "items", Type: "array", Required: true, Description: "销售明细 [{material_id, quantity, unit_price}]"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "sales_order_ship",
		Description: "销售出库",
		Category:    "sales",
		APIEndpoint: "/api/v1/sales-orders/{id}/ship",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "销售订单ID"},
			{Name: "warehouse_id", Type: "string", Required: false, Description: "出库仓库ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "sales_order_bind_contract",
		Description: "销售订单绑定合同",
		Category:    "sales",
		APIEndpoint: "/api/v1/sales-orders/{id}/contract",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "销售订单ID"},
			{Name: "contract_id", Type: "string", Required: true, Description: "合同ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "sales_order_delivery",
		Description: "销售订单发货记录",
		Category:    "sales",
		APIEndpoint: "/api/v1/sales-orders/{id}/delivery",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "销售订单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "sales_order_change_status",
		Description: "修改销售订单状态",
		Category:    "sales",
		APIEndpoint: "/api/v1/sales-orders/{id}/status",
		Method:      "PATCH",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "销售订单ID"},
			{Name: "status", Type: "string", Required: true, Description: "状态 (draft/pending_approval/confirmed/shipped/completed)"},
		},
	})
}
