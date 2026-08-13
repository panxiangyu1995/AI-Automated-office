# Quota & Features 配额与特性开关模块

Base: `/api/v1`

## Quota（配额）

### GET /quota
获取当前企业配额。
- **Auth**: JWT

### PUT /quota
更新企业配额限制。
- **Auth**: JWT
- **Body**: `{ "daily_limit": "int", "monthly_limit": "int" }`

## Feature Flags（特性开关）

### GET /features
列出企业所有特性开关。
- **Auth**: JWT

### PUT /features/:key
更新特性开关（启用/禁用）。
- **Auth**: JWT
- **Body**: `{ "enabled": "bool" }`
