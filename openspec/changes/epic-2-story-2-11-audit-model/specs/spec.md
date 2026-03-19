# Specification: Structured Audit Log Model

## 需求来源

### PRD 需求

**FR28 - 管理员可以创建和编辑用户账号**

用户管理操作需要记录审计日志，便于追踪和合规。

**FR29 - 管理员可以按部门分配用户权限**

权限变更操作需要记录审计日志。

**FR33 - 管理员可以导入和导出用户数据**

导入导出操作需要记录审计日志。

### 架构约束

**ADR-005 - 多租户数据库级隔离**
- 审计日志按租户隔离
- 审计查询需要租户上下文

### NFR 约束

**NFR14 - 审计日志**
- 记录所有关键操作
- 审计日志保留 180 天

## 功能规格

### 用户故事

As a **系统**,
I want **记录所有关键操作的审计日志**,
So that **我能追踪操作历史，满足合规要求**。

### 验收场景

#### Scenario 1: 记录登录事件
- **GIVEN** 用户成功登录
- **WHEN** 登录完成
- **THEN** 记录审计日志
  - event_type: auth.login
  - operator_id: 用户 ID
  - result: success

#### Scenario 2: 记录登录失败
- **GIVEN** 用户登录失败
- **WHEN** 登录失败
- **THEN** 记录审计日志
  - event_type: auth.login
  - result: failure
  - reason: 失败原因

#### Scenario 3: 记录用户创建
- **GIVEN** 管理员创建新用户
- **WHEN** 创建完成
- **THEN** 记录审计日志
  - event_type: user.create
  - target_id: 新用户 ID
  - new_values: 新用户信息

#### Scenario 4: 记录权限变更
- **GIVEN** 管理员修改用户权限
- **WHEN** 变更完成
- **THEN** 记录审计日志
  - event_type: permission.grant
  - old_values: 原权限
  - new_values: 新权限

#### Scenario 5: 记录批量导入
- **GIVEN** 管理员批量导入用户
- **WHEN** 导入完成
- **THEN** 记录审计日志
  - event_type: import.commit
  - details: 导入统计信息

#### Scenario 6: 链路追踪
- **GIVEN** 一系列关联操作
- **WHEN** 记录审计日志
- **THEN** 所有日志共享 trace_id
  - 可通过 trace_id 查询完整操作链

#### Scenario 7: 异步写入
- **GIVEN** 高并发操作场景
- **WHEN** 记录大量审计日志
- **THEN** 异步批量写入
  - 不影响业务响应时间

## 数据规格

### 审计日志字段

| 字段 | 类型 | 描述 | 必填 |
|------|------|------|------|
| id | string | 日志 ID | 是 |
| tenant_id | string | 租户 ID | 是 |
| trace_id | string | 链路追踪 ID | 否 |
| operator_id | string | 操作人 ID | 是 |
| operator_type | string | 操作人类型 | 是 |
| operator_ip | string | 操作人 IP | 否 |
| target_id | string | 目标对象 ID | 否 |
| target_type | string | 目标类型 | 否 |
| event_type | string | 事件类型 | 是 |
| resource | string | 资源类型 | 是 |
| action | string | 操作动作 | 是 |
| result | string | 操作结果 | 是 |
| reason | string | 原因说明 | 否 |
| details | JSON | 详细信息 | 否 |
| old_values | JSON | 变更前值 | 否 |
| new_values | JSON | 变更后值 | 否 |
| created_at | timestamp | 创建时间 | 是 |

### 事件类型枚举

| 类型 | 说明 |
|------|------|
| auth.login | 登录 |
| auth.logout | 登出 |
| auth.session.revoke | 会话撤销 |
| user.create | 创建用户 |
| user.update | 更新用户 |
| user.delete | 删除用户 |
| role.create | 创建角色 |
| role.update | 更新角色 |
| permission.grant | 授权 |
| permission.revoke | 撤销权限 |
| import.preview | 导入预览 |
| import.commit | 导入提交 |
| export.execute | 导出 |

### 结果类型枚举

| 类型 | 说明 |
|------|------|
| success | 成功 |
| failure | 失败 |
| partial | 部分成功 |

## 边界条件

1. **日志保留**: 保留 180 天
2. **写入延迟**: 异步写入，最长 5 秒延迟
3. **队列容量**: 最大 10000 条待写入日志

## 错误处理

| 错误场景 | 处理方式 |
|---------|---------|
| 队列满 | 降级为同步写入 |
| 写入失败 | 记录本地日志，重试 |

## 质量属性

### 性能要求
- 写入吞吐量 > 10000 条/秒
- 查询响应时间 < 500ms
- 不影响业务请求响应

### 可靠性要求
- 日志不丢失
- 支持链路追踪
- 完整性保证

### 安全要求
- 敏感信息脱敏
- 不可篡改
- 访问控制

## 依赖关系

### 上游依赖
- E2-S2.1-01: Cloud auth module foundation

### API 依赖
- 无直接 API 依赖

## 验收标准

| 标准 | 验证方式 |
|------|---------|
| 日志正确写入 | 自动化测试 |
| 链路追踪正确 | 自动化测试 |
| 异步写入正常 | 性能测试 |
| 查询功能正常 | 手动测试 |