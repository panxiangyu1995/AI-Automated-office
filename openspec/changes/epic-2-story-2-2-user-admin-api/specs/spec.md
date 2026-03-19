# Specification: User Admin APIs

## Overview

本文档定义 Story 2.2 User Admin APIs 的功能规格说明。

## ADDED Requirements

### Requirement: FR28/FR99 用户与员工档案管理功能基线

系统 SHALL 提供完整的用户管理 API，满足 FR28、FR99 和 NFR16 要求。

#### Scenario: 用户列表分页查询
- **GIVEN** 管理员已登录
- **WHEN** 管理员请求 `GET /api/admin/users` 
- **THEN** 系统 MUST 返回当前租户下的用户列表，支持分页和筛选

#### Scenario: 用户创建
- **GIVEN** 管理员有用户创建权限
- **WHEN** 管理员请求 `POST /api/admin/users` 并提供有效数据
- **THEN** 系统 MUST 创建用户并返回用户 ID 和临时密码
- **AND** 系统 MUST 写入审计日志

#### Scenario: 用户更新
- **GIVEN** 管理员有用户编辑权限
- **WHEN** 管理员请求 `PUT /api/admin/users/:id` 并提供有效数据
- **THEN** 系统 MUST 更新用户信息
- **AND** 系统 MUST 写入审计日志

#### Scenario: 用户状态变更
- **GIVEN** 管理员有用户管理权限
- **WHEN** 管理员请求 `PATCH /api/admin/users/:id/status`
- **THEN** 系统 MUST 更新用户状态
- **AND** 系统 MUST 写入审计日志

### Requirement: 数据校验

系统 MUST 对所有用户数据进行严格校验。

#### Scenario: 用户名唯一性校验
- **WHEN** 创建或更新用户时
- **THEN** 系统 MUST 检查用户名在当前租户内是否唯一
- **AND** 若重复则返回 `DUPLICATE_USERNAME` 错误

#### Scenario: 工号唯一性校验
- **WHEN** 创建或更新用户时
- **THEN** 系统 MUST 检查工号在当前租户内是否唯一
- **AND** 若重复则返回 `DUPLICATE_EMPLOYEE_CODE` 错误

#### Scenario: 必填字段校验
- **WHEN** 创建用户时
- **THEN** 系统 MUST 校验 `username`、`real_name`、`employee_code` 必填
- **AND** 若缺失则返回 `VALIDATION_ERROR` 错误

### Requirement: 标准响应格式

系统 MUST 返回统一格式的 API 响应。

#### Scenario: 成功响应格式
- **WHEN** API 调用成功
- **THEN** 响应 MUST 包含 `code: "SUCCESS"` 和 `data` 字段

#### Scenario: 错误响应格式
- **WHEN** API 调用失败
- **THEN** 响应 MUST 包含 `code`、`http_status`、`message`、`trace_id` 字段

### Requirement: 分页查询支持

系统 MUST 支持用户列表的分页和筛选查询。

#### Scenario: 分页参数
- **WHEN** 请求用户列表
- **THEN** 系统 MUST 支持 `page` 和 `page_size` 参数
- **AND** 默认 `page=1`，`page_size=20`，最大 `page_size=100`

#### Scenario: 筛选参数
- **WHEN** 请求用户列表
- **THEN** 系统 MUST 支持以下筛选条件：
  - `name`: 姓名模糊搜索
  - `employee_code`: 工号精确匹配
  - `department_id`: 部门 ID
  - `status`: 用户状态

### Requirement: 敏感数据处理

系统 MUST 正确处理敏感数据。

#### Scenario: 密码不返回
- **WHEN** 查询用户信息
- **THEN** 响应 MUST NOT 包含密码哈希字段

#### Scenario: 创建时密码生成
- **WHEN** 创建新用户
- **THEN** 系统 MUST 生成临时密码并返回
- **AND** 密码 MUST 符合安全策略要求

### Requirement: 审计日志

所有用户管理写操作 MUST 写入审计日志。

#### Scenario: 审计事件类型
- **WHEN** 执行用户创建、更新、状态变更操作
- **THEN** 系统 MUST 写入 `audit_logs` 表
- **AND** 记录 `operator_id`、`target_id`、`event_type`、`resource`、`action`、`result`

## API Contracts

### Response Codes

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| SUCCESS | 200/201 | 操作成功 |
| VALIDATION_ERROR | 400 | 数据校验失败 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| DUPLICATE_USERNAME | 409 | 用户名重复 |
| DUPLICATE_EMPLOYEE_CODE | 409 | 工号重复 |
| PERMISSION_DENIED | 403 | 无操作权限 |

### Data Types

```typescript
interface User {
  id: string;
  username: string;
  real_name: string;
  employee_code: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'locked';
  departments: Department[];
  roles: Role[];
  created_at: string;
  updated_at?: string;
}

interface PagedResponse<T> {
  code: string;
  data: {
    items: T[];
    total: number;
    page: number;
    page_size: number;
  };
}

interface ErrorResponse {
  code: string;
  http_status: number;
  message: string;
  field?: string;
  trace_id: string;
}
```

## Acceptance Criteria Summary

1. [ ] `GET /api/admin/users` 支持分页和筛选
2. [ ] `POST /api/admin/users` 创建用户并返回临时密码
3. [ ] `PUT /api/admin/users/:id` 更新用户信息
4. [ ] `PATCH /api/admin/users/:id/status` 变更用户状态
5. [ ] 所有写操作写入审计日志
6. [ ] 所有 API 返回标准响应格式
7. [ ] 敏感字段（密码哈希）不在响应中暴露
