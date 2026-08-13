# IMS 进销存模块

Base: `/api/v1`

## Materials（物料/产品）

### POST /enterprises/:enterprise_id/materials
创建物料。
- **Auth**: JWT + `product:create`
- **Body**: `{ "name": "string", "sku_code": "string", "material_type?": "string", "spec?": "string", "unit?": "string", "unit_price?": "decimal" }`
- **角色**: owner, admin

### GET /enterprises/:enterprise_id/materials
列出物料（分页）。
- **Query**: `?page=1&page_size=20`

### GET /materials/:id
获取物料详情。

### PUT /materials/:id
更新物料。
- **Body**: `{ "name?", "material_type?", "spec?", "unit?", "unit_price?", "status?" }`

### DELETE /materials/:id
删除物料（软删除）。

## Suppliers（供应商）

### POST /enterprises/:enterprise_id/suppliers
创建供应商。
- **Body**: `{ "name": "string", "contact_name?": "string", "contact_phone?": "string", "contact_email?": "string", "address?": "string" }`

### GET /enterprises/:enterprise_id/suppliers
列出供应商（分页）。
- **Query**: `?page=1&page_size=20`

### GET /suppliers/:id
获取供应商详情。

### PUT /suppliers/:id
更新供应商。
- **Body**: `{ "name?", "contact_name?", "contact_phone?", "contact_email?", "address?" }`

### DELETE /suppliers/:id
删除供应商（软删除）。

## Warehouses（仓库）

### POST /enterprises/:enterprise_id/warehouses
创建仓库。
- **Body**: `{ "name": "string", "code?": "string", "address?": "string" }`

### GET /enterprises/:enterprise_id/warehouses
列出仓库（分页）。
- **Query**: `?page=1&page_size=20`

### GET /warehouses/:id
获取仓库详情。

### PUT /warehouses/:id
更新仓库。
- **Body**: `{ "name?", "code?", "address?" }`

### DELETE /warehouses/:id
删除仓库（软删除）。

## Inventory（库存）

### POST /enterprises/:enterprise_id/inventory
设置库存（upsert）。
- **Body**: `{ "warehouse_id": "UUID", "material_id": "UUID", "quantity": "int", "safety_stock": "int", "in_transit": "int" }`
- **角色**: owner, admin, manager

### GET /enterprises/:enterprise_id/inventory/low-stock
低库存预警列表。
- **Query**: `?page=1&page_size=20`

### GET /enterprises/:enterprise_id/inventory/warehouses/:warehouse_id
按仓库查询库存。
- **Query**: `?page=1&page_size=20`

### GET /enterprises/:enterprise_id/inventory/materials/:material_id
按物料查询库存（所有仓库）。

## Purchase Orders（采购订单）

### POST /enterprises/:enterprise_id/purchase-orders
创建采购订单。
- **Body**: `{ "supplier_id": "UUID", "notes?": "string", "items": [{ "material_id": "UUID", "quantity": "int", "unit_price": "decimal" }] }`
- **角色**: owner, admin, manager

### POST /purchase-orders/:id/receive
确认采购到货。
- **Query**: `?warehouse_id=UUID`
- **角色**: owner, admin, manager

## Sales Orders（销售订单）

### POST /enterprises/:enterprise_id/sales-orders
创建销售订单。
- **Body**: `{ "customer_id": "UUID", "notes?": "string", "items": [{ "material_id": "UUID", "quantity": "int", "unit_price": "decimal" }] }`
- **角色**: owner, admin, manager

### POST /sales-orders/:id/ship
销售出库（扣减库存）。
- **Query**: `?warehouse_id=UUID`

### POST /sales-orders/:id/contract
绑定销售订单到合同。
- **Body**: `{ "contract_id": "UUID" }`

### POST /sales-orders/:id/delivery
销售发货。
- **Query**: `?warehouse_id=UUID`

### PATCH /sales-orders/:id/status
修改销售订单状态。
- **Body**: `{ "status": "string" }`

## Stock Transfers（调拨）

### POST /enterprises/:enterprise_id/transfers
创建调拨单。
- **Body**: `{ "source_wh_id": "UUID", "target_wh_id": "UUID", "material_id": "UUID", "quantity": "int" }`

### POST /transfers/:id/execute
执行调拨。

## Requisitions（领料）

### POST /enterprises/:enterprise_id/requisitions
创建领料单。
- **Body**: `{ "applicant_id": "UUID", "warehouse_id": "UUID", "material_id": "UUID", "quantity": "int", "notes?": "string" }`

### POST /requisitions/:id/issue
发料确认。
- **Query**: `?issued_qty=0`

## Orders & Stock Flows（订单和流水查询）

### GET /enterprises/:enterprise_id/orders
列出所有订单（分页、按类型筛选）。
- **Query**: `?page=1&page_size=20&type=`

### GET /enterprises/:enterprise_id/stock-flows
列出库存流水（分页）。
- **Query**: `?page=1&page_size=20&warehouse_id=&material_id=`
