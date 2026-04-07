# Specification: HR人事部门模块

## 需求来源

### PRD 需求
- FR99: 管理员可以添加、编辑、删除员工信息
- FR100: 管理员可以创建和管理部门架构
- FR101: 管理员可以配置员工汇报关系
- FR102: 管理员可以管理岗位信息
- FR103: 系统可以生成组织架构图
- FR104: 系统可以发送入职通知

### 架构约束
- ARCH-01: 分层微内核架构
- ADR-059: Subagent 体系

### UX 规范
- UX-01: VSCode 风格四栏布局
- UX-04: 自然语言交互优先

## 功能规格

### 用户故事

As a HR管理员,
I want 管理员工信息和部门架构,
So that 建立企业组织基础，支持其他部门功能。

### 验收场景

#### Scenario 1: 添加新员工
- **GIVEN** HR管理员已登录
- **WHEN** 管理员填写员工信息并提交
- **THEN** 员工被创建，可以被查询

#### Scenario 2: 维护部门架构
- **GIVEN** HR管理员已登录
- **WHEN** 管理员编辑部门树
- **THEN** 部门结构更新，相关数据同步

## 数据规格

### 员工输入

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| employeeCode | string | 是 | 唯一，6-20字符 |
| name | string | 是 | 2-50字符 |
| email | string | 是 | 有效邮箱格式 |
| phone | string | 否 | 手机号格式 |
| departmentId | string | 是 | 有效部门ID |
| positionId | string | 是 | 有效岗位ID |
| managerId | string | 否 | 有效员工ID |

### 部门输入

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| code | string | 是 | 唯一，2-20字符 |
| name | string | 是 | 2-50字符 |
| parentId | string | 否 | 有效部门ID |
| managerId | string | 否 | 有效员工ID |
