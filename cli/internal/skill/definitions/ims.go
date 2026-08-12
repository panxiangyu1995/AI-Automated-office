package definitions

import (
	"github.com/panxiangyu1995/AI-Automated-office/cli/internal/skill"
)

func initIMSSkills() {
	skill.Register(skill.SkillDefinition{
		Name:           "ims_material_create",
		Description:    "创建物料（SKU）",
		Category:       "ims",
		APIEndpoint:    "/api/v1/enterprises/{enterprise_id}/materials",
		Method:         "POST",
		OpeningMessage: "欢迎使用进销存管理，您可以管理物料、仓库、库存、采购和销售订单。",
		RoleOpenings: map[string]skill.RoleOpening{
			"owner":    {OpeningText: "您拥有完整的进销存管理权限。", AvailableActions: "material,warehouse,inventory,purchase,sales,transfer"},
			"manager":  {OpeningText: "您可以管理物料、库存和订单。", AvailableActions: "material,inventory,purchase,sales"},
			"employee": {OpeningText: "您可以查询物料和库存信息。", AvailableActions: "material_get,inventory_query"},
		},
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "物料名称"},
			{Name: "sku_code", Type: "string", Required: true, Description: "SKU编码"},
			{Name: "material_type", Type: "string", Required: false, Description: "物料类型 (成品/finished_product, 原材料/raw_material, 零部件/component, 办公用品/office_supply, 耗材/consumable, 硬件/hardware, 软件/software, 服务/service)"},
			{Name: "spec", Type: "string", Required: false, Description: "规格参数"},
			{Name: "unit", Type: "string", Required: false, Description: "单位"},
			{Name: "unit_price", Type: "number", Required: false, Description: "单价"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_material_update",
		Description: "编辑物料信息",
		Category:    "ims",
		APIEndpoint: "/api/v1/materials/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "物料ID"},
			{Name: "name", Type: "string", Required: false, Description: "物料名称"},
			{Name: "material_type", Type: "string", Required: false, Description: "物料类型"},
			{Name: "spec", Type: "string", Required: false, Description: "规格参数"},
			{Name: "unit", Type: "string", Required: false, Description: "单位"},
			{Name: "unit_price", Type: "number", Required: false, Description: "单价"},
			{Name: "status", Type: "string", Required: false, Description: "状态 (active/disabled)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_material_delete",
		Description: "删除物料",
		Category:    "ims",
		APIEndpoint: "/api/v1/materials/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "物料ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_material_get",
		Description: "查询物料详情",
		Category:    "ims",
		APIEndpoint: "/api/v1/materials/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "物料ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_material_list",
		Description: "查询物料列表",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/materials",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_supplier_create",
		Description: "创建供应商",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/suppliers",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "供应商名称"},
			{Name: "contact_name", Type: "string", Required: false, Description: "联系人"},
			{Name: "contact_phone", Type: "string", Required: false, Description: "联系电话"},
			{Name: "contact_email", Type: "string", Required: false, Description: "联系邮箱"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_supplier_update",
		Description: "编辑供应商信息",
		Category:    "ims",
		APIEndpoint: "/api/v1/suppliers/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "供应商ID"},
			{Name: "name", Type: "string", Required: false, Description: "供应商名称"},
			{Name: "contact_name", Type: "string", Required: false, Description: "联系人"},
			{Name: "contact_phone", Type: "string", Required: false, Description: "联系电话"},
			{Name: "contact_email", Type: "string", Required: false, Description: "联系邮箱"},
			{Name: "address", Type: "string", Required: false, Description: "地址"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_supplier_delete",
		Description: "删除供应商",
		Category:    "ims",
		APIEndpoint: "/api/v1/suppliers/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "供应商ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_supplier_get",
		Description: "查询供应商详情",
		Category:    "ims",
		APIEndpoint: "/api/v1/suppliers/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "供应商ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_supplier_list",
		Description: "查询供应商列表",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/suppliers",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_warehouse_create",
		Description: "创建仓库",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/warehouses",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "name", Type: "string", Required: true, Description: "仓库名称"},
			{Name: "code", Type: "string", Required: false, Description: "仓库编码"},
			{Name: "address", Type: "string", Required: false, Description: "仓库地址"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_warehouse_update",
		Description: "编辑仓库信息",
		Category:    "ims",
		APIEndpoint: "/api/v1/warehouses/{id}",
		Method:      "PUT",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "仓库ID"},
			{Name: "name", Type: "string", Required: false, Description: "仓库名称"},
			{Name: "code", Type: "string", Required: false, Description: "仓库编码"},
			{Name: "address", Type: "string", Required: false, Description: "仓库地址"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_warehouse_delete",
		Description: "删除仓库",
		Category:    "ims",
		APIEndpoint: "/api/v1/warehouses/{id}",
		Method:      "DELETE",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "仓库ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_warehouse_get",
		Description: "查询仓库详情",
		Category:    "ims",
		APIEndpoint: "/api/v1/warehouses/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "仓库ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_warehouse_list",
		Description: "查询仓库列表",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/warehouses",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inventory_query_by_warehouse",
		Description: "按仓库查询库存",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/inventory/warehouses/{warehouse_id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "warehouse_id", Type: "string", Required: true, Description: "仓库ID"},
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inventory_query_by_material",
		Description: "按物料查询库存",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/inventory/materials/{material_id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "material_id", Type: "string", Required: true, Description: "物料ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inventory_low_stock",
		Description: "查询低库存预警",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/inventory/low-stock",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inventory_set",
		Description: "设置库存数量",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/inventory",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "warehouse_id", Type: "string", Required: true, Description: "仓库ID"},
			{Name: "material_id", Type: "string", Required: true, Description: "物料ID"},
			{Name: "quantity", Type: "int", Required: true, Description: "库存数量"},
			{Name: "safety_stock", Type: "int", Required: false, Description: "安全库存"},
			{Name: "in_transit", Type: "int", Required: false, Description: "在途数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_purchase_order_create",
		Description: "创建采购订单",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/purchase-orders",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "supplier_id", Type: "string", Required: true, Description: "供应商ID"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
			{Name: "items", Type: "array", Required: true, Description: "采购明细 [{material_id, quantity, unit_price}]"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_purchase_order_receive",
		Description: "采购入库",
		Category:    "ims",
		APIEndpoint: "/api/v1/purchase-orders/{id}/receive",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "采购订单ID"},
			{Name: "warehouse_id", Type: "string", Required: false, Description: "入库仓库ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_sales_order_create",
		Description: "创建销售订单",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/sales-orders",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "customer_id", Type: "string", Required: true, Description: "客户ID"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
			{Name: "items", Type: "array", Required: true, Description: "销售明细 [{material_id, quantity, unit_price}]"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_transfer_create",
		Description: "创建仓库调拨单",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/transfers",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "source_wh_id", Type: "string", Required: true, Description: "源仓库ID"},
			{Name: "target_wh_id", Type: "string", Required: true, Description: "目标仓库ID"},
			{Name: "material_id", Type: "string", Required: true, Description: "物料ID"},
			{Name: "quantity", Type: "int", Required: true, Description: "调拨数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_transfer_execute",
		Description: "执行仓库调拨",
		Category:    "ims",
		APIEndpoint: "/api/v1/transfers/{id}/execute",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "调拨单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_requisition_create",
		Description: "创建物料领用申请",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/requisitions",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "applicant_id", Type: "string", Required: true, Description: "申请人ID"},
			{Name: "warehouse_id", Type: "string", Required: true, Description: "仓库ID"},
			{Name: "material_id", Type: "string", Required: true, Description: "物料ID"},
			{Name: "quantity", Type: "int", Required: true, Description: "申请数量"},
			{Name: "notes", Type: "string", Required: false, Description: "备注"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_requisition_issue",
		Description: "仓库确认发料",
		Category:    "ims",
		APIEndpoint: "/api/v1/requisitions/{id}/issue",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "领用单ID"},
			{Name: "issued_quantity", Type: "int", Required: false, Description: "实发数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_order_list",
		Description: "查询订单列表",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/orders",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "type", Type: "string", Required: false, Description: "订单类型 (purchase/sales/transfer/requisition)"},
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_stock_flow_list",
		Description: "查询出入库流水",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/stock-flows",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "warehouse_id", Type: "string", Required: false, Description: "按仓库筛选"},
			{Name: "material_id", Type: "string", Required: false, Description: "按物料筛选"},
			{Name: "page", Type: "int", Required: false, Default: "1", Description: "页码"},
			{Name: "page_size", Type: "int", Required: false, Default: "20", Description: "每页数量"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_sales_order_ship",
		Description: "销售订单出库发货",
		Category:    "ims",
		APIEndpoint: "/api/v1/sales-orders/{id}/ship",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "销售订单ID"},
			{Name: "warehouse_id", Type: "string", Required: true, Description: "出库仓库ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_sales_order_status_change",
		Description: "变更销售订单状态",
		Category:    "ims",
		APIEndpoint: "/api/v1/sales-orders/{id}/status",
		Method:      "PATCH",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "销售订单ID"},
			{Name: "status", Type: "string", Required: true, Description: "新状态(draft/confirmed/shipped/completed/cancelled)"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inspection_create",
		Description: "创建采购质检任务",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/purchase-orders/{po_id}/inspections",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "企业ID"},
			{Name: "po_id", Type: "string", Required: true, Description: "采购订单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inspection_list",
		Description: "查看采购订单的质检列表",
		Category:    "ims",
		APIEndpoint: "/api/v1/enterprises/{enterprise_id}/purchase-orders/{po_id}/inspections",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "enterprise_id", Type: "string", Required: true, Description: "企业ID"},
			{Name: "po_id", Type: "string", Required: true, Description: "采购订单ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inspection_add_item",
		Description: "添加质检检查项",
		Category:    "ims",
		APIEndpoint: "/api/v1/inspections/{id}/items",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "质检ID"},
			{Name: "material_id", Type: "string", Required: true, Description: "物料ID"},
			{Name: "check_item", Type: "string", Required: true, Description: "检查项名称"},
			{Name: "standard", Type: "string", Required: false, Description: "检查标准"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inspection_complete",
		Description: "完成质检",
		Category:    "ims",
		APIEndpoint: "/api/v1/inspections/{id}/complete",
		Method:      "POST",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "质检ID"},
		},
	})

	skill.Register(skill.SkillDefinition{
		Name:        "ims_inspection_get",
		Description: "查看质检详情",
		Category:    "ims",
		APIEndpoint: "/api/v1/inspections/{id}",
		Method:      "GET",
		Parameters: []skill.ParamDef{
			{Name: "id", Type: "string", Required: true, Description: "质检ID"},
		},
	})
}
