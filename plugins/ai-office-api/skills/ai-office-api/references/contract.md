# Contract 合同模块

Base: `/api/v1`

### POST /enterprises/:enterprise_id/contracts
创建合同。
- **Auth**: JWT + `contract:create`
- **Body**: `{ "customer_id": "UUID", "name": "string", "amount?": "decimal", "content?": "string", "notes?": "string" }`
- **角色**: owner, admin, manager

### GET /enterprises/:enterprise_id/contracts
列出合同（分页、按状态筛选）。
- **Auth**: JWT + `contract:list`
- **Query**: `?page=1&page_size=20&status=`
- **状态值**: draft, pending_approval, approved, rejected, active, completed, terminated

### GET /contracts/:id
获取合同详情。
- **Auth**: JWT + `contract:read`

### PUT /contracts/:id
全量更新合同。
- **Auth**: JWT + `contract:update`
- **Body**: `{ "name?", "amount?", "content?", "notes?" }`

### PATCH /contracts/:id
部分更新合同字段。
- **Auth**: JWT + `contract:update`
- **Body**: `{ [任意字段]: value }`

### PATCH /contracts/:id/status
修改合同状态。
- **Auth**: JWT + `contract:update`
- **Body**: `{ "status": "string" }`

### DELETE /contracts/:id
删除合同（软删除）。
- **Auth**: JWT + `contract:delete`
- **角色**: owner, admin

### POST /contracts/:id/submit-approval
提交合同审批。
- **Auth**: JWT + `contract:update`
- **角色**: owner, admin, manager

### POST /contracts/:id/approve
审批通过合同。
- **Auth**: JWT + `contract:update`
- **角色**: owner, admin

### POST /contracts/:id/attachments
上传合同附件（multipart）。
- **Auth**: JWT + `contract:update`
- **Form**: `file` (multipart)

### POST /contracts/:id/documents
关联外部单据。
- **Auth**: JWT + `contract:update`
- **Body**: `{ "ref_type": "string", "ref_id": "UUID", "ref_no?": "string" }`

### GET /contracts/:id/documents
列出合同关联单据。
- **Auth**: JWT + `contract:read`
