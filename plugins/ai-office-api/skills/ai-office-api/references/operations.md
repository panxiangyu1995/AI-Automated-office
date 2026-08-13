# Operations 运营管理模块

Base: `/api/v1`

## Dashboard（仪表盘）

### GET /dashboard
运营仪表盘（状态 + 版本）。
- **Auth**: JWT

## Subscription Plans（订阅计划）

### GET /subscription-plans
列出订阅计划。

### POST /subscription-plans
创建订阅计划。
- **Body**: `{ "name": "string", "description?": "string", "features?": ["string"], "price": "decimal", "max_users?": "int", "max_storage?": "int" }`

## Enterprise Subscriptions（企业订阅）

### GET /enterprise-subscriptions
列出企业订阅。

### POST /enterprise-subscriptions
创建企业订阅。
- **Body**: `{ "plan_id": "UUID" }`

## Webhooks

### GET /webhooks
列出 Webhook。

### POST /webhooks
创建 Webhook。
- **Body**: `{ "name": "string", "url": "string", "secret?": "string", "events": ["string"] }`

## Service Tickets（平台工单）

### POST /service-tickets
创建工单。
- **Body**: `{ "customer_id": "UUID", "subject": "string", "description?": "string", "priority?": "string" }`

### GET /service-tickets
列出工单。

## Announcements（公告）

### POST /announcements
创建公告。
- **Body**: `{ "title": "string", "content": "string" }`

### GET /announcements
列出公告。

## Bills（账单）

### POST /bills
创建账单。
- **Body**: `{ "amount": "decimal", "description?": "string" }`

### GET /bills
列出账单。

## SLA Metrics

### GET /sla-metrics
获取 SLA 指标。

## Service Config（服务配置）

### POST /service-config
创建/更新服务配置。
- **Body**: `{ "key": "string", "value": "string" }`

### GET /service-config/:key
获取服务配置。

## Data Import/Export（数据导入导出）

### GET /data-export
导出企业数据。
- **Query**: `?format=csv`

### POST /data-import
导入数据。
- **Body**: `{ "records": [{...}], "target": "string" }`

## Audit Logs（审计日志）

### GET /audit-logs
查询审计日志（分页、可筛选）。
- **Auth**: JWT + `system:logs`
- **Query**: `?page=1&page_size=20&user_id=&action=&resource_type=&start_time=&end_time=`
- **角色**: operator, owner, admin

### GET /audit-log-entries
列出审计日志条目。
