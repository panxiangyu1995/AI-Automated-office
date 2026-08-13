# Sales/Service 销售与售后模块

Base: `/api/v1`

## Service Orders（售后工单）

### POST /enterprises/:enterprise_id/service-orders
创建售后工单。
- **Auth**: JWT + `order:create`
- **Body**: `{ "customer_id": "UUID", "contract_id?": "UUID", "order_type": "string", "description?": "string", "amount?": "decimal" }`
- **角色**: owner, admin, manager

### GET /enterprises/:enterprise_id/service-orders
列出售后工单（分页、可筛选）。
- **Auth**: JWT + `order:list`
- **Query**: `?page=1&page_size=20&order_type=&status=`

### GET /service-orders/:id
获取售后工单详情。
- **Auth**: JWT + `order:read`

### PUT /service-orders/:id
报价/修改售后工单。
- **Auth**: JWT + `order:update`
- **Body**: `{ "amount": "decimal" }`

### DELETE /service-orders/:id
删除售后工单。
- **Auth**: JWT + `order:delete`
- **角色**: owner, admin

### PATCH /service-orders/:id/status
修改售后工单状态。
- **Auth**: JWT + `order:update`
- **Body**: `{ "status": "string" }`
