# Specification: Session Model and Timeout Engine

## 需求来源

### PRD 需求

**FR27 - 用户可以使用账号密码登录系统**

用户登录后系统需要管理会话状态，确保会话安全和有效。

### 架构约束

**ADR-005 - 多租户数据库级隔离**
- 会话数据按租户隔离
- 会话查询需要租户上下文

### NFR 约束

**NFR12 - 会话管理**
- 会话超时 30 分钟
- 支持强制登出
- 会话状态可追踪

## 功能规格

### 用户故事

As a **系统**,
I want **有效管理用户会话，自动处理空闲超时**,
So that **保证系统安全，防止未授权访问**。

### 验收场景

#### Scenario 1: 创建会话
- **GIVEN** 用户成功登录
- **WHEN** 系统创建会话
- **THEN** 会话记录写入数据库
  - 记录用户 ID、租户 ID
  - 记录 Token JTI
  - 设置过期时间
  - 记录设备信息

#### Scenario 2: 验证有效会话
- **GIVEN** 用户发送请求
- **WHEN** 系统验证会话
- **THEN** 
  - 会话存在且未撤销
  - 未超过过期时间
  - 未超过空闲超时
  - 更新最后活跃时间

#### Scenario 3: 空闲超时
- **GIVEN** 用户 30 分钟未活动
- **WHEN** 系统检查会话状态
- **THEN** 
  - 会话被标记为过期
  - 撤销原因为 idle_timeout
  - 后续请求返回 401

#### Scenario 4: 会话过期
- **GIVEN** 会话超过设定的过期时间（24小时）
- **WHEN** 系统验证会话
- **THEN** 
  - 返回会话已过期错误
  - 错误码为 SESSION_EXPIRED

#### Scenario 5: 查询会话列表
- **GIVEN** 用户请求会话列表
- **WHEN** 查询该用户的所有会话
- **THEN** 返回会话列表
  - 包含设备信息
  - 包含登录时间
  - 包含最后活跃时间
  - 包含状态

#### Scenario 6: 定时清理过期会话
- **GIVEN** 数据库中存在过期会话
- **WHEN** 清理任务执行
- **THEN** 
  - 删除 7 天前的过期会话
  - 记录清理日志

## 数据规格

### 会话实体

| 字段 | 类型 | 描述 | 必填 |
|------|------|------|------|
| id | string | 会话 ID | 是 |
| tenant_id | string | 租户 ID | 是 |
| user_id | string | 用户 ID | 是 |
| access_token_jti | string | Access Token JTI | 是 |
| refresh_token_jti | string | Refresh Token JTI | 否 |
| ip_address | string | IP 地址 | 否 |
| user_agent | string | User Agent | 否 |
| device_info | JSON | 设备信息 | 否 |
| issued_at | timestamp | 签发时间 | 是 |
| last_active_at | timestamp | 最后活跃时间 | 是 |
| expires_at | timestamp | 过期时间 | 是 |
| revoked_at | timestamp | 撤销时间 | 否 |
| revoke_reason | string | 撤销原因 | 否 |

### 会话状态

| 状态 | 描述 |
|------|------|
| active | 活跃状态 |
| expired | 已过期（超过过期时间或空闲超时） |
| revoked | 已撤销（主动登出或强制登出） |

## 边界条件

1. **空闲超时**: 30 分钟无活动
2. **会话过期**: 24 小时后过期
3. **清理周期**: 7 天后删除过期会话
4. **检查间隔**: 每 5 分钟检查一次空闲会话

## 错误处理

| 错误码 | 错误信息 | HTTP 状态码 |
|--------|----------|-------------|
| SESSION_NOT_FOUND | 会话不存在 | 401 |
| SESSION_EXPIRED | 会话已过期 | 401 |
| SESSION_IDLE_TIMEOUT | 会话空闲超时 | 401 |
| SESSION_REVOKED | 会话已撤销 | 401 |

## 质量属性

### 性能要求
- 会话验证 < 50ms
- 会话列表查询 < 200ms
- 支持万级并发会话

### 可靠性要求
- 会话状态一致性
- 撤销操作原子性
- 定时任务可靠性

### 安全要求
- Token JTI 关联验证
- 多设备会话隔离
- 敏感数据不存储

## 依赖关系

### 上游依赖
- E2-S2.1-01: Cloud auth module foundation（Token 管理）

### API 依赖
- `GET /api/auth/session/current` - 获取当前会话
- `GET /api/auth/session/list` - 获取会话列表

## 验收标准

| 标准 | 验证方式 |
|------|---------|
| 会话创建正常 | 自动化测试 |
| 会话验证正常 | 自动化测试 |
| 空闲超时生效 | 自动化测试 |
| 清理任务正常 | 手动测试 |
| 性能达标 | 性能测试 |