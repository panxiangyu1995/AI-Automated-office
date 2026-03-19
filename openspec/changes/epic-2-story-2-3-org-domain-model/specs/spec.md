# Specification: Department and Position Domain Model

## Overview

本文档定义 Story 2.3 Department and Position Domain Model 的功能规格说明。

## ADDED Requirements

### Requirement: FR100 部门管理功能基线

系统 SHALL 提供完整的部门管理 API，支持树形结构。

#### Scenario: 部门树查询
- **GIVEN** 管理员已登录
- **WHEN** 管理员请求 `GET /api/admin/departments/tree`
- **THEN** 系统 MUST 返回当前租户的部门树结构
- **AND** 树结构 MUST 包含所有层级部门

#### Scenario: 部门创建
- **GIVEN** 管理员有部门管理权限
- **WHEN** 管理员请求 `POST /api/admin/departments` 并提供有效数据
- **THEN** 系统 MUST 创建部门
- **AND** 若有 parent_id 则建立父子关系

#### Scenario: 部门更新
- **GIVEN** 管理员有部门管理权限
- **WHEN** 管理员请求 `PUT /api/admin/departments/:id`
- **THEN** 系统 MUST 更新部门信息
- **AND** 若修改 parent_id 则更新树结构

#### Scenario: 部门删除约束
- **GIVEN** 管理员要删除某部门
- **WHEN** 该部门下存在子部门
- **THEN** 系统 MUST 拒绝删除并返回 `DEPARTMENT_HAS_CHILDREN` 错误

- **WHEN** 该部门下存在员工
- **THEN** 系统 MUST 拒绝删除并返回 `DEPARTMENT_HAS_USERS` 错误

### Requirement: FR102 岗位管理功能基线

系统 SHALL 提供完整的岗位管理 API。

#### Scenario: 岗位列表查询
- **GIVEN** 管理员已登录
- **WHEN** 管理员请求 `GET /api/admin/positions`
- **THEN** 系统 MUST 返回岗位列表
- **AND** 支持按 department_id 筛选

#### Scenario: 岗位创建
- **GIVEN** 管理员有岗位管理权限
- **WHEN** 管理员请求 `POST /api/admin/positions`
- **THEN** 系统 MUST 创建岗位
- **AND** 岗位可选关联部门

#### Scenario: 岗位删除约束
- **GIVEN** 管理员要删除某岗位
- **WHEN** 该岗位下存在员工
- **THEN** 系统 MUST 拒绝删除并返回 `POSITION_HAS_USERS` 错误

### Requirement: 循环引用检测

系统 MUST 防止部门树出现循环引用。

#### Scenario: 循环引用检测
- **WHEN** 创建或更新部门时
- **THEN** 系统 MUST 检查 parent_id 是否会造成循环
- **AND** 若检测到循环则返回 `CIRCULAR_REFERENCE` 错误

### Requirement: 数据完整性

系统 MUST 保证组织架构数据完整性。

#### Scenario: 部门编码唯一性
- **WHEN** 创建或更新部门时
- **THEN** 系统 MUST 检查编码在当前租户内唯一
- **AND** 若重复则返回错误

#### Scenario: 岗位编码唯一性
- **WHEN** 创建或更新岗位时
- **THEN** 系统 MUST 检查编码在当前租户内唯一
- **AND** 若重复则返回错误

### Requirement: 树查询性能

系统 MUST 保证部门树查询性能。

#### Scenario: 大规模部门树查询
- **GIVEN** 部门数量 > 100
- **WHEN** 查询部门树
- **THEN** 响应时间 MUST < 500ms
- **AND** 使用闭包表或递归 CTE 优化

## API Contracts

### Response Codes

| 错误码 | HTTP 状态 | 说明 |
|--------|-----------|------|
| SUCCESS | 200/201 | 操作成功 |
| DEPARTMENT_NOT_FOUND | 404 | 部门不存在 |
| DEPARTMENT_HAS_CHILDREN | 400 | 部门有子部门 |
| DEPARTMENT_HAS_USERS | 400 | 部门有员工 |
| CIRCULAR_REFERENCE | 400 | 循环引用 |
| POSITION_NOT_FOUND | 404 | 岗位不存在 |
| POSITION_HAS_USERS | 400 | 岗位有员工 |
| DUPLICATE_CODE | 409 | 编码重复 |

### Data Types

```typescript
interface Department {
  id: string;
  name: string;
  code: string;
  parent_id?: string;
  leader?: {
    id: string;
    name: string;
  };
  sort_order: number;
  status: 'active' | 'inactive';
  children?: Department[];
  created_at: string;
  updated_at?: string;
}

interface Position {
  id: string;
  name: string;
  code: string;
  department_id?: string;
  department?: {
    id: string;
    name: string;
  };
  description?: string;
  level?: number;
  sort_order: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
}
```

## Acceptance Criteria Summary

1. [ ] 部门树查询返回完整树结构
2. [ ] 部门 CRUD 操作正确执行
3. [ ] 有子部门时禁止删除部门
4. [ ] 有员工时禁止删除部门/岗位
5. [ ] 循环引用检测正确工作
6. [ ] 岗位列表查询支持部门筛选
7. [ ] 岗位 CRUD 操作正确执行
8. [ ] 编码唯一性校验正确工作