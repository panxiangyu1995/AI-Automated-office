# Finance 财务模块

Base: `/api/v1`
所有财务端点需要 `finance:read` 权限，写操作需要 `finance:update`。

## Payments（收款）

### POST /enterprises/:enterprise_id/payments
创建收款记录。
- **Auth**: JWT + `finance:update`
- **Body**: `{ "customer_id": "UUID", "contract_id?": "UUID", "payment_method?": "string", "notes?": "string", "amount": "decimal" }`
- **角色**: owner, operator

### GET /enterprises/:enterprise_id/payments
列出收款记录（分页）。
- **Auth**: JWT + `finance:read`
- **Query**: `?page=1&page_size=20`

## Expenses（报销）

### POST /enterprises/:enterprise_id/expenses
创建报销记录。
- **Auth**: JWT + `finance:update`
- **Body**: `{ "category": "string", "description?": "string", "submitted_by": "UUID", "amount": "decimal" }`
- **角色**: owner, operator

### GET /enterprises/:enterprise_id/expenses
列出报销记录（分页）。
- **Auth**: JWT + `finance:read`
- **Query**: `?page=1&page_size=20`

### POST /expenses/:id/approve
审批报销。
- **Auth**: JWT + `finance:update`
- **角色**: owner, admin

## Invoices（发票）

### POST /enterprises/:enterprise_id/invoices
创建发票。
- **Auth**: JWT + `finance:update`
- **Body**: `{ "customer_id": "UUID", "notes?": "string", "amount": "decimal", "tax_amount?": "decimal" }`
- **角色**: owner, operator

### GET /enterprises/:enterprise_id/invoices
列出发票（分页）。
- **Auth**: JWT + `finance:read`
- **Query**: `?page=1&page_size=20`
