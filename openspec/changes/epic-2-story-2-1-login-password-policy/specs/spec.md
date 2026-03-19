# Specification: Login API and Password Policy

## 需求来源

### PRD 需求

**FR27 - 用户可以使用账号密码登录系统**

用户通过输入用户名和密码进行身份验证，系统验证通过后返回访问令牌、用户信息、租户信息和权限摘要。

**NFR11 - 密码安全**

- 密码使用 bcrypt 加密存储，强度因子≥12
- 密码强度要求：至少 8 位，包含大小写字母和数字

**NFR12 - 会话管理**

- 会话超时 30 分钟（由会话系统管理）
- 支持强制登出

### 架构约束

**ADR-001 - 分层微内核架构**
- 认证逻辑位于 Cloud Layer
- 前端 React 负责登录交互
- Tauri/Rust 不承担账号密码鉴权主入口

**ADR-005 - 多租户数据库级隔离**
- 每个租户的数据在数据库层面隔离
- 认证需要识别租户上下文

### UX 规范

本子任务为后端 API，无直接 UX 需求。前端交互由 E2-S2.1-03 实现。

## 功能规格

### 用户故事

As a **系统用户**,
I want **使用账号密码登录系统**,
So that **我可以访问系统功能并使用 AI 助手**。

### 验收场景

#### Scenario 1: 成功登录
- **GIVEN** 用户存在且状态为 active
- **AND** 密码正确
- **AND** 未被锁定
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 200 OK
- **AND** 返回 access_token、refresh_token、expires_in
- **AND** 返回 user 对象（id, username, email, real_name 等）
- **AND** 返回 tenant 对象（id, name）
- **AND** 返回 permissions 对象（roles, permissions, data_scopes）
- **AND** 记录登录成功审计日志
- **AND** 重置失败计数器

#### Scenario 2: 密码错误
- **GIVEN** 用户存在
- **AND** 密码错误
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 401 Unauthorized
- **AND** 返回错误码 AUTH_001
- **AND** 返回错误信息"用户名或密码错误"
- **AND** 增加失败计数器
- **AND** 记录登录失败审计日志

#### Scenario 3: 账户锁定（5次失败）
- **GIVEN** 用户已连续失败 5 次
- **AND** 当前时间在锁定期内
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 403 Forbidden
- **AND** 返回错误码 AUTH_002
- **AND** 返回错误信息"账户已被锁定，请 15 分钟后重试"

#### Scenario 4: 账户锁定（10次失败）
- **GIVEN** 用户已连续失败 10 次
- **AND** 当前时间在锁定期内
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 403 Forbidden
- **AND** 返回错误码 AUTH_002
- **AND** 返回错误信息"账户已被锁定，请 1 小时后重试"

#### Scenario 5: 用户不存在
- **GIVEN** 用户名不存在
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 401 Unauthorized
- **AND** 返回错误码 AUTH_001
- **AND** 返回错误信息"用户名或密码错误"（不透露用户是否存在）

#### Scenario 6: 账户禁用
- **GIVEN** 用户状态为 disabled
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 403 Forbidden
- **AND** 返回错误码 AUTH_003
- **AND** 返回错误信息"账户已禁用，请联系管理员"

#### Scenario 7: 参数验证失败
- **GIVEN** 请求参数不合法（如密码少于 8 位）
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 400 Bad Request
- **AND** 返回详细的验证错误信息

#### Scenario 8: 锁定过期后重试
- **GIVEN** 用户曾被锁定
- **AND** 锁定期已过
- **AND** 密码正确
- **WHEN** 调用 POST /api/auth/login
- **THEN** 返回 200 OK
- **AND** 重置失败计数器

## 数据规格

### 输入

| 字段 | 类型 | 必填 | 验证规则 | 描述 |
|------|------|------|----------|------|
| username | string | 是 | 3-50字符 | 用户名 |
| password | string | 是 | 8-100字符 | 密码 |
| tenant_id | string | 否 | UUID格式 | 租户ID（多租户场景） |

### 输出（成功）

| 字段 | 类型 | 描述 |
|------|------|------|
| access_token | string | 访问令牌（有效期 1 小时） |
| refresh_token | string | 刷新令牌（有效期 7 天） |
| expires_in | int64 | Token 过期时间（秒） |
| user | object | 用户信息 |
| user.id | string | 用户 ID |
| user.username | string | 用户名 |
| user.email | string | 邮箱 |
| user.real_name | string | 真实姓名 |
| user.department_id | string | 部门 ID |
| user.position_id | string | 岗位 ID |
| user.status | string | 状态 |
| tenant | object | 租户信息 |
| tenant.id | string | 租户 ID |
| tenant.name | string | 租户名称 |
| permissions | object | 权限摘要 |
| permissions.roles | string[] | 角色列表 |
| permissions.permissions | string[] | 权限列表 |
| permissions.data_scopes | object | 数据范围映射 |

### 输出（失败）

| 字段 | 类型 | 描述 |
|------|------|------|
| code | string | 错误码 |
| message | string | 错误信息 |
| trace_id | string | 追踪 ID |

## 边界条件

1. **用户名边界**: 3-50 字符，超出返回验证错误
2. **密码边界**: 8-100 字符，超出返回验证错误
3. **锁定边界**: 
   - 5 次失败锁定 15 分钟
   - 10 次失败锁定 1 小时
   - 锁定期内任何尝试都返回锁定错误
4. **并发边界**: 同一用户并发登录需要处理竞争条件

## 错误处理

| HTTP 状态码 | 错误码 | 错误信息 | 处理方式 |
|-------------|--------|----------|----------|
| 400 | VALIDATION_ERROR | 参数验证失败 | 返回详细错误字段 |
| 401 | AUTH_001 | 用户名或密码错误 | 记录失败计数 |
| 403 | AUTH_002 | 账户已被锁定 | 返回剩余锁定时间 |
| 403 | AUTH_003 | 账户已禁用 | 提示联系管理员 |
| 403 | AUTH_004 | 租户不存在 | 仅多租户场景 |
| 500 | INTERNAL_ERROR | 系统内部错误 | 记录错误日志，返回 trace_id |

## 密码安全规格

### 存储要求
- 算法：bcrypt
- Cost 因子：12
- 不存储明文密码
- 不存储可逆加密密码

### 强度要求
- 最小长度：8 位
- 必须包含：大写字母
- 必须包含：小写字母
- 必须包含：数字
- 可选：特殊字符

### 传输要求
- 必须使用 HTTPS
- 密码在请求体中传输（不放在 URL 中）

## 审计日志规格

### 登录成功
```json
{
  "event_type": "auth.login.success",
  "operator_id": "user-uuid",
  "target_id": "user-uuid",
  "resource": "auth.login",
  "action": "login",
  "result": "success",
  "ip_hash": "sha256(ip)",
  "user_agent_hash": "sha256(user_agent)",
  "trace_id": "trace-uuid"
}
```

### 登录失败
```json
{
  "event_type": "auth.login.failure",
  "operator_id": null,
  "target_id": "user-uuid-or-null",
  "resource": "auth.login",
  "action": "login",
  "result": "failure",
  "reason": "invalid_credentials|account_locked|account_disabled",
  "ip_hash": "sha256(ip)",
  "user_agent_hash": "sha256(user_agent)",
  "trace_id": "trace-uuid"
}
```

## 质量属性

### 性能要求
- 登录 API 响应时间 < 500ms（P95）
- 密码验证（bcrypt）时间约 200-300ms
- 权限查询时间 < 100ms

### 安全要求
- 所有 API 必须使用 HTTPS
- 错误信息不透露敏感信息
- 审计日志记录所有登录尝试

### 可用性要求
- 登录 API 可用性 > 99.9%
- 锁定策略不影响其他用户

## 依赖关系

### 上游依赖
- E2-S2.1-01: Cloud auth module foundation
- Go 1.21+
- Gin Web 框架
- GORM
- golang-jwt/jwt
- golang.org/x/crypto/bcrypt
- go.uber.org/zap
- PostgreSQL
- Redis（可选，用于失败计数器）

### 下游依赖
- E2-S2.1-03: Frontend login flow
- E2-S2.1-04: Local session cache wrapper