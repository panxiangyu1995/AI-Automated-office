# CRM 客户关系模块

Base: `/api/v1`

## Customers（客户）

### POST /enterprises/:enterprise_id/customers
创建客户。
- **Auth**: JWT + `customer:create`
- **Body**: `{ "name": "string", "industry?": "string", "unified_social_credit_code?": "string", "address?": "string", "notes?": "string" }`
- **角色**: owner, admin, manager

### GET /enterprises/:enterprise_id/customers
列出客户（分页）。
- **Auth**: JWT + `customer:list`
- **Query**: `?page=1&page_size=20`

### GET /customers/:id
获取客户详情。
- **Auth**: JWT + `customer:read`

### PUT /customers/:id
更新客户。
- **Auth**: JWT + `customer:update`
- **Body**: `{ "name?", "industry?", "unified_social_credit_code?", "address?", "notes?", "level?" }`
- **角色**: owner, admin, manager

### DELETE /customers/:id
删除客户（软删除）。
- **Auth**: JWT + `customer:delete`
- **角色**: owner, admin

## Customer Levels（客户等级）

### POST /enterprises/:enterprise_id/customer-levels
创建客户等级。
- **Auth**: JWT + `customer:create`
- **Body**: `{ "name": "string", "description?": "string", "min_amount?": "decimal", "color?": "string", "sort_order?": "int" }`

### GET /enterprises/:enterprise_id/customer-levels
列出客户等级。

### PUT /customer-levels/:id
更新客户等级。
- **Body**: `{ "name?", "description?", "min_amount?", "color?", "sort_order?" }`

### DELETE /customer-levels/:id
删除客户等级。

## Customer Tags（客户标签）

### POST /enterprises/:enterprise_id/customers/:customer_id/tags
给客户添加标签。
- **Body**: `{ "tag": "string" }`

### GET /enterprises/:enterprise_id/customers/:customer_id/tags
列出客户标签。

### GET /enterprises/:enterprise_id/customer-tags
列出企业所有标签。

### DELETE /customers/:id/tags
移除客户标签。
- **Query**: `?tag=xxx`

## Contacts（联系人）

### POST /enterprises/:enterprise_id/customers/:customer_id/contacts
创建联系人。
- **Body**: `{ "name": "string", "position?": "string", "phone?": "string", "email?": "string", "role?": "string", "is_primary?": "bool" }`

### GET /enterprises/:enterprise_id/customers/:customer_id/contacts
列出客户联系人。
- **Query**: `?role=`

### PUT /contacts/:id
更新联系人。
- **Body**: `{ "name?", "position?", "phone?", "email?", "role?", "is_primary?" }`

### DELETE /contacts/:id
删除联系人。

## Opportunities（商机）

### POST /enterprises/:enterprise_id/opportunities
创建商机。
- **Body**: `{ "customer_id": "UUID", "name": "string", "amount?": "decimal", "expected_close_at?": "date", "description?": "string" }`

### GET /enterprises/:enterprise_id/customers/:customer_id/opportunities
列出客户商机。

### PUT /opportunities/:id
更新商机。
- **Body**: `{ "name?", "status?", "amount?", "expected_close_at?", "description?" }`

### DELETE /opportunities/:id
删除商机。
