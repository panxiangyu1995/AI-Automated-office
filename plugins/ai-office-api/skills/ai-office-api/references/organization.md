# Organization 组织架构模块

Base: `/api/v1`

## Groups（集团）— 仅 operator

### POST /groups
创建集团。
- **Auth**: JWT + `system:config`
- **Body**: `{ "name": "string", "contact_email?": "string", "contact_phone?": "string", "address?": "string" }`

### GET /groups
列出集团（分页）。
- **Auth**: JWT + `system:config`
- **Query**: `?page=1&page_size=20`

### GET /groups/:id
获取集团详情。
- **Auth**: JWT + `system:config`

### PUT /groups/:id
更新集团。
- **Auth**: JWT + `system:config`
- **Body**: `{ "name?", "contact_email?", "contact_phone?", "address?" }`

### DELETE /groups/:id
删除集团。
- **Auth**: JWT + `system:config`

## Enterprises（企业）— 仅 operator 可创建/修改

### POST /enterprises
创建企业。
- **Auth**: JWT + `system:config`
- **Body**: `{ "group_id": "UUID", "name": "string", "code": "string", "contact_email?": "string", "contact_phone?": "string", "address?": "string" }`

### GET /enterprises
列出企业（分页）。
- **Auth**: JWT + `system:config`
- **Query**: `?page=1&page_size=20`

### GET /enterprises/:enterprise_id
获取企业详情。
- **Auth**: JWT + `system:config`

### PUT /enterprises/:enterprise_id
更新企业。
- **Auth**: JWT + `system:config`
- **Body**: `{ "name?", "contact_email?", "contact_phone?", "address?" }`

## Group Summary

### GET /groups/summary/:id
获取集团汇总统计。
- **Auth**: JWT

## Cross-Enterprise Permissions（跨企业权限）

### POST /cross-enterprise/permissions
授予跨企业访问权限。
- **Auth**: JWT
- **Body**: `{ "user_id": "UUID", "target_enterprise_id": "UUID", "permissions": ["string"] }`

### DELETE /cross-enterprise/permissions/:id
撤销跨企业权限。
- **Auth**: JWT

### GET /cross-enterprise/permissions
查询跨企业权限。
- **Auth**: JWT
- **Query**: `?user_id=UUID`
