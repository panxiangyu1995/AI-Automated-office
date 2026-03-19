## ADDED Requirements

### Requirement: Story 2.7 - 权限网关能力基线
系统 SHALL 实现权限网关中间件，满足 FR(FR29, FR30, FR31, FR32) 和 NFR(NFR16) 的要求。

#### Scenario: 能力基线建立
- **WHEN** API 请求到达时
- **THEN** 系统 MUST 通过权限网关进行统一的权限校验

### Requirement: Story 2.7-1 - 构建认证和权限中间件
系统 MUST 实现 Build auth and permission middleware 功能，提供统一的认证和权限校验。

#### Scenario: Story 2.7-1 验证通过
- **WHEN** 请求携带有效 Token 时
- **THEN** 系统 SHALL 正确识别用户身份并设置上下文

### Requirement: Story 2.7-2 - 添加租户隔离检查
系统 MUST 实现 Add tenant isolation checks 功能，确保多租户数据隔离。

#### Scenario: Story 2.7-2 验证通过
- **WHEN** 用户尝试访问其他租户数据时
- **THEN** 系统 SHALL 返回 403 错误并阻止访问

### Requirement: Story 2.7-3 - 添加资源权限检查
系统 MUST 实现 Add resource permission checks 功能，验证用户对资源的操作权限。

#### Scenario: Story 2.7-3 验证通过
- **WHEN** 用户无权限访问某资源时
- **THEN** 系统 SHALL 返回标准 403 响应并包含申请入口

### Requirement: Story 2.7-4 - 返回标准 403 响应契约
系统 MUST 实现 Return the standard 403 response contract 功能，提供统一的权限拒绝响应。

#### Scenario: Story 2.7-4 验证通过
- **WHEN** 权限校验失败时
- **THEN** 系统 SHALL 返回包含资源标识、所需权限、申请入口的标准 403 响应

---

## Middleware Specification

### TenantMiddleware

**功能:** 租户隔离检查

**输入:**
- `X-Tenant-ID` Header 或路径参数 `tenant_id`

**输出:**
- 成功: 设置 `tenant_id` 和 `tenant` 到 Gin Context
- 失败: 返回以下错误响应

| 场景 | HTTP Status | Code | Message |
|------|-------------|------|---------|
| 缺少租户ID | 400 | TENANT_REQUIRED | 缺少租户标识 |
| 租户不存在 | 403 | TENANT_INVALID | 无效的租户标识 |
| 租户已停用 | 403 | TENANT_INACTIVE | 租户已停用 |

### AuthMiddleware

**功能:** 用户认证检查

**输入:**
- `Authorization: Bearer {token}` Header

**输出:**
- 成功: 设置 `user_id`、`user`、`session_id` 到 Gin Context
- 失败: 返回以下错误响应

| 场景 | HTTP Status | Code | Message |
|------|-------------|------|---------|
| 缺少认证头 | 401 | AUTH_REQUIRED | 缺少认证信息 |
| 格式错误 | 401 | INVALID_AUTH_FORMAT | 认证格式错误 |
| Token无效 | 401 | TOKEN_INVALID | 令牌无效或已过期 |
| Token已撤销 | 401 | TOKEN_REVOKED | 令牌已被撤销 |
| 用户不存在 | 401 | USER_NOT_FOUND | 用户不存在 |
| 用户已禁用 | 403 | USER_INACTIVE | 用户已被禁用 |

### PermissionMiddleware

**功能:** 权限校验

**输入:**
- Gin Context 中的 `tenant_id`、`user_id`
- 请求路径和方法

**输出:**
- 成功: 设置 `permission_result`、`data_scope`、`field_restrictions` 到 Gin Context
- 失败: 返回标准 403 响应

---

## Standard 403 Response Contract

### Response Schema

```json
{
  "code": "PERMISSION_DENIED",
  "http_status": 403,
  "message": "当前账号无权限执行该操作",
  "resource": "auth.user.update",
  "required_permission": "auth_user_write",
  "apply_entry": "/permissions/apply?resource=auth.user.update",
  "trace_id": "req-20260318-xxxx"
}
```

### Field Descriptions

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | Y | 错误代码，固定为 PERMISSION_DENIED |
| http_status | int | Y | HTTP 状态码，固定为 403 |
| message | string | Y | 用户友好的错误消息 |
| resource | string | Y | 被拒绝的资源标识 |
| required_permission | string | Y | 执行该操作所需的权限编码 |
| apply_entry | string | Y | 申请权限的入口 URL |
| trace_id | string | Y | 请求追踪 ID，用于日志关联 |

### Go Implementation

```go
type ForbiddenResponse struct {
    Code               string `json:"code"`
    HTTPStatus         int    `json:"http_status"`
    Message            string `json:"message"`
    Resource           string `json:"resource"`
    RequiredPermission string `json:"required_permission"`
    ApplyEntry         string `json:"apply_entry"`
    TraceID            string `json:"trace_id"`
}

func NewForbiddenResponse(resource, requiredPerm, traceID string) ForbiddenResponse {
    return ForbiddenResponse{
        Code:               "PERMISSION_DENIED",
        HTTPStatus:         403,
        Message:            "当前账号无权限执行该操作",
        Resource:           resource,
        RequiredPermission: requiredPerm,
        ApplyEntry:         fmt.Sprintf("/permissions/apply?resource=%s", resource),
        TraceID:            traceID,
    }
}
```

---

## Permission Cache Specification

### Cache Key Format

```
perm:{tenant_id}:{user_id}:{resource}
```

### Cache Value

```json
{
  "permissions": {
    "hr_employee_read": true,
    "hr_employee_write": false
  },
  "data_scope": {
    "type": "department_tree"
  },
  "field_restrictions": {
    "salary": {"mode": "hidden"}
  },
  "computed_at": 1710734400,
  "ttl": 300
}
```

### Cache Invalidation Rules

| 触发事件 | 失效范围 |
|---------|---------|
| 用户角色变更 | 该用户所有权限缓存 |
| 角色权限变更 | 拥有该角色的所有用户缓存 |
| 用户权限覆盖变更 | 该用户指定资源缓存 |
| 用户登录 | 该用户所有权限缓存（重新加载） |

---

## Error Codes Reference

### Authentication Errors (401)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_REQUIRED | 401 | 缺少认证信息 |
| INVALID_AUTH_FORMAT | 401 | 认证格式错误 |
| TOKEN_INVALID | 401 | 令牌无效或已过期 |
| TOKEN_EXPIRED | 401 | 令牌已过期 |
| TOKEN_REVOKED | 401 | 令牌已被撤销 |
| USER_NOT_FOUND | 401 | 用户不存在 |

### Authorization Errors (403)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| PERMISSION_DENIED | 403 | 无权限执行该操作 |
| TENANT_INVALID | 403 | 无效的租户标识 |
| TENANT_INACTIVE | 403 | 租户已停用 |
| USER_INACTIVE | 403 | 用户已被禁用 |

### Request Errors (400)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| TENANT_REQUIRED | 400 | 缺少租户标识 |