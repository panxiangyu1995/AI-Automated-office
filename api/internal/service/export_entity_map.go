package service

type ExportEntityDef struct {
	Table      string
	Fields     []string
	MaskFields []string
}

var exportEntityMap = map[string]ExportEntityDef{
	"employee": {
		Table:      "employees",
		Fields:     []string{"id", "name", "email", "phone", "status", "department_id", "position_id", "hire_date", "created_at"},
		MaskFields: []string{"phone", "email"},
	},
	"customer": {
		Table:      "customers",
		Fields:     []string{"id", "name", "level", "source", "industry", "region", "status", "created_at"},
		MaskFields: []string{},
	},
	"contact": {
		Table:      "contacts",
		Fields:     []string{"id", "name", "email", "phone", "position", "customer_id", "created_at"},
		MaskFields: []string{"phone", "email"},
	},
	"contract": {
		Table:      "contracts",
		Fields:     []string{"id", "title", "type", "status", "amount", "party_a", "party_b", "signed_at", "expire_at", "created_at"},
		MaskFields: []string{},
	},
	"opportunity": {
		Table:      "opportunities",
		Fields:     []string{"id", "title", "stage", "amount", "probability", "customer_id", "expected_close_at", "created_at"},
		MaskFields: []string{},
	},
	"order": {
		Table:      "sales_orders",
		Fields:     []string{"id", "order_no", "status", "total_amount", "customer_id", "contract_id", "order_date", "created_at"},
		MaskFields: []string{},
	},
	"payment": {
		Table:      "payment_records",
		Fields:     []string{"id", "amount", "method", "status", "contract_id", "paid_at", "created_at"},
		MaskFields: []string{},
	},
	"expense": {
		Table:      "expense_records",
		Fields:     []string{"id", "amount", "category", "status", "expense_at", "created_at"},
		MaskFields: []string{},
	},
	"invoice": {
		Table:      "invoices",
		Fields:     []string{"id", "invoice_no", "amount", "status", "invoice_date", "due_date", "created_at"},
		MaskFields: []string{},
	},
	"material": {
		Table:      "materials",
		Fields:     []string{"id", "name", "code", "unit", "category", "status", "created_at"},
		MaskFields: []string{},
	},
	"supplier": {
		Table:      "suppliers",
		Fields:     []string{"id", "name", "contact", "phone", "email", "status", "created_at"},
		MaskFields: []string{"phone", "email"},
	},
	"warehouse": {
		Table:      "warehouses",
		Fields:     []string{"id", "name", "address", "manager", "status", "created_at"},
		MaskFields: []string{},
	},
	"service_order": {
		Table:      "service_orders",
		Fields:     []string{"id", "title", "type", "status", "priority", "customer_id", "created_at"},
		MaskFields: []string{},
	},
}

func getExportEntity(entityType string) (ExportEntityDef, bool) {
	e, ok := exportEntityMap[entityType]
	return e, ok
}

var validExportTypes = map[string]bool{
	"single":             true,
	"cross_entity":       true,
	"employee_dimension": true,
	"employee_audit":     true,
	"conversational":     true,
}

var exportEntityPermissions = map[string]string{
	"employee":      "employee:read",
	"customer":      "customer:read",
	"contact":       "customer:read",
	"contract":      "contract:read",
	"opportunity":   "customer:read",
	"order":         "order:read",
	"payment":       "finance:read",
	"expense":       "finance:read",
	"invoice":       "finance:read",
	"material":      "product:read",
	"supplier":      "product:read",
	"warehouse":     "product:read",
	"service_order": "order:read",
}
