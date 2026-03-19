# Specification: Direct Manager Relation

## Overview

本文档定义 Story 2.4 Direct Manager Relation 的功能规格说明。

## ADDED Requirements

### Requirement: FR101 直属上级设置功能基线

系统 SHALL 提供用户直属上级设置功能，支持组织汇报关系管理。

#### Scenario: 设置直属上级
- **GIVEN** 管理员有用户编辑权限
- **WHEN** 管理员为用户设置直属上级
- **THEN** 系统 MUST 更新用户的 manager_id
- **AND** 写入审计日志

#### Scenario: 清除直属上级
- **GIVEN** 用户有直属上级
- **WHEN** 管理员清除用户的上级设置
- **THEN** 系统 MUST 将 manager_id 设为 null

#### Scenario: 查询上级链
- **GIVEN** 用户有直属上级
- **WHEN** 查询用户的上级链
- **THEN** 系统 MUST 返回完整的上级层级列表
- **AND** 按层级排序（直接上级在前）

#### Scenario: 查询下属列表
- **GIVEN** 用户有下属
- **WHEN** 查询用户的下属
- **THEN** 系统 MUST 返回直接下属列表

### Requirement: 循环引用检测

系统 MUST 防止形成循环上级关系。

#### Scenario: 直接循环检测
- **WHEN** 用户 A 试图将用户 B 设为上级
- **AND** 用户 B 的上级是用户 A
- **THEN** 系统 MUST 拒绝操作
- **AND** 返回 `CIRCULAR_MANAGER_CHAIN` 错误

#### Scenario: 间接循环检测
- **WHEN** 用户 A 试图将用户 B 设为上级
- **AND** 用户 B 的上级链中包含用户 A
- **THEN** 系统 MUST 拒绝操作
- **AND** 返回 `CIRCULAR_MANAGER_CHAIN` 错误

#### Scenario: 深度限制
- **WHEN** 上级链深度超过最大限制（20 层）
- **THEN** 系统 MUST 拒绝操作
- **AND** 返回 `MANAGER_CHAIN_TOO_DEEP` 错误

### Requirement: 自引用防护

系统 MUST 阻止用户将自己设为上级。

#### Scenario: 自引用检测
- **WHEN** 用户试图将自己设为上级
- **THEN** 系统 MUST 拒绝操作
- **AND** 返回 `MANAGER_CANNOT_BE_SELF` 错误

### Requirement: 跨租户防护

系统 MUST 阻止跨租户的上级设置。

#### Scenario: 跨租户检测
- **WHEN** 用户 A 试图将用户 B 设为上级
- **AND** 用户 A 和 B 属于不同租户
- **THEN** 系统 MUST 拒绝操作
- **AND** 返回 `CROSS_TENANT_MANAGER` 错误

### Requirement: 上级选择器

用户编辑表单 MUST 包含上级选择器组件。

#### Scenario: 上级选择器功能
- **WHEN** 管理员编辑用户信息
- **THEN** 系统 MUST 提供上级选择器
- **AND** 选择器支持按姓名/工号搜索
- **AND** 显示候选人的部门和岗位信息

#### Scenario: 排除当前用户
- **WHEN** 显示上级候选列表
- **THEN** 系统 MUST 排除当前被编辑的用户

#### Scenario: 清除上级
- **WHEN** 管理员清除上级选择
- **THEN** 系统 MUST 允许提交空值

### Requirement: 错误反馈

系统 MUST 提供清晰的错误反馈。

#### Scenario: 循环关系错误提示
- **WHEN** 检测到循环关系
- **THEN** 系统 MUST 显示清晰错误提示
- **AND** 说明循环形成的原因

#### Scenario: 跨租户错误提示
- **WHEN** 检测到跨租户操作
- **THEN** 系统 MUST 显示错误提示
- **AND** 说明不能设置跨租户上级

## API Contracts

### Response Codes

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| SUCCESS | 200 | 操作成功 |
| MANAGER_NOT_FOUND | 404 | 指定的上级不存在 |
| MANAGER_CANNOT_BE_SELF | 400 | 不能设自己为上级 |
| CIRCULAR_MANAGER_CHAIN | 400 | 会形成循环关系 |
| CROSS_TENANT_MANAGER | 400 | 跨租户上级 |
| MANAGER_CHAIN_TOO_DEEP | 400 | 上级链过深 |

### Data Types

```typescript
interface UserWithManager extends User {
  manager_id?: string;
  manager?: {
    id: string;
    real_name: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

interface ManagerChainItem {
  level: number;
  user: {
    id: string;
    real_name: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

interface SetManagerRequest {
  manager_id: string | null;
}
```

## Acceptance Criteria Summary

1. [ ] 用户模型包含 manager_id 字段
2. [ ] 设置上级 API 正确工作
3. [ ] 清除上级 API 正确工作
4. [ ] 查询上级链 API 返回正确层级
5. [ ] 查询下属列表 API 正确工作
6. [ ] 循环引用检测正确拦截
7. [ ] 自引用检测正确拦截
8. [ ] 跨租户设置正确拦截
9. [ ] 上级选择器集成到用户编辑表单
10. [ ] 错误提示清晰友好