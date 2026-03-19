# Specification: User Admin UI

## Overview

本文档定义 Story 2.2 User Admin UI 的功能规格说明。

## ADDED Requirements

### Requirement: FR28/FR99 用户与员工档案管理前端界面基线

系统 SHALL 提供完整的用户管理前端界面，满足 FR28、FR99 和 UX 规范要求。

#### Scenario: 用户列表页面展示
- **GIVEN** 管理员已登录且有用户查看权限
- **WHEN** 管理员访问 `/admin/users`
- **THEN** 系统 MUST 展示用户列表表格
- **AND** 表格 MUST 包含头像、姓名、工号、部门、角色、状态、创建时间列

#### Scenario: 用户列表分页
- **GIVEN** 用户总数超过单页显示数量
- **WHEN** 管理员查看用户列表
- **THEN** 系统 MUST 提供分页控件
- **AND** 默认每页显示 20 条记录

#### Scenario: 用户筛选功能
- **GIVEN** 管理员在用户列表页面
- **WHEN** 管理员输入筛选条件
- **THEN** 系统 MUST 实时筛选用户列表
- **AND** 支持 姓名、工号、部门、状态 筛选条件

### Requirement: 创建用户流程

系统 SHALL 提供用户创建界面。

#### Scenario: 访问创建用户页面
- **GIVEN** 管理员有用户创建权限
- **WHEN** 管理员点击"创建用户"按钮
- **THEN** 系统 MUST 导航到 `/admin/users/create`

#### Scenario: 填写用户信息
- **GIVEN** 管理员在创建用户页面
- **WHEN** 管理员填写表单
- **THEN** 系统 MUST 提供以下字段：
  - 用户名（必填）
  - 真实姓名（必填）
  - 工号（必填）
  - 邮箱
  - 手机号
  - 所属部门（多选）
  - 分配角色（多选）

#### Scenario: 提交创建用户
- **GIVEN** 管理员填写完成用户信息
- **WHEN** 管理员点击"保存"按钮
- **THEN** 系统 MUST 调用创建用户 API
- **AND** 成功后 MUST 返回用户列表页面
- **AND** 显示成功提示消息

#### Scenario: 表单校验失败
- **GIVEN** 管理员填写了无效数据
- **WHEN** 管理员点击"保存"按钮
- **THEN** 系统 MUST 显示字段级错误提示
- **AND** 不提交 API 请求

### Requirement: 编辑用户流程

系统 SHALL 提供用户编辑界面。

#### Scenario: 访问编辑用户页面
- **GIVEN** 管理员有用户编辑权限
- **WHEN** 管理员点击用户的"编辑"按钮
- **THEN** 系统 MUST 导航到 `/admin/users/:id/edit`
- **AND** 表单 MUST 回填用户当前信息

#### Scenario: 更新用户信息
- **GIVEN** 管理员修改了用户信息
- **WHEN** 管理员点击"保存"按钮
- **THEN** 系统 MUST 调用更新用户 API
- **AND** 成功后 MUST 返回用户列表页面

### Requirement: 状态展示

系统 MUST 正确展示用户状态。

#### Scenario: 状态徽章样式
- **WHEN** 展示用户状态
- **THEN** 系统 MUST 使用以下样式：
  - 启用: 绿色徽章 (#16A34A)
  - 停用: 灰色徽章 (#6B7280)
  - 锁定: 红色徽章 (#DC2626)

### Requirement: UX 规范合规

界面 MUST 符合 UX 设计规范。

#### Scenario: 组件库使用
- **WHEN** 构建界面组件
- **THEN** 系统 MUST 使用 Shadcn/ui 组件库
- **AND** MUST 使用 Lucide React 图标库

#### Scenario: 颜色系统
- **WHEN** 应用样式
- **THEN** 系统 MUST 遵循品牌色 #1E3A5F
- **AND** 使用规范定义的状态色

#### Scenario: 响应式设计
- **WHEN** 页面宽度变化
- **THEN** 系统 MUST 适配不同屏幕尺寸
- **AND** 在小屏幕上提供合理的交互体验

### Requirement: 错误处理

界面 MUST 提供清晰的错误反馈。

#### Scenario: API 错误处理
- **WHEN** API 请求失败
- **THEN** 系统 MUST 显示 Toast 错误提示
- **AND** 包含可理解的错误信息

#### Scenario: 网络错误处理
- **WHEN** 网络连接失败
- **THEN** 系统 MUST 显示网络错误提示
- **AND** 提供重试选项

### Requirement: 加载状态

界面 MUST 提供清晰的加载反馈。

#### Scenario: 列表加载状态
- **WHEN** 用户列表正在加载
- **THEN** 系统 MUST 显示加载指示器
- **AND** 禁用筛选和分页控件

#### Scenario: 表单提交状态
- **WHEN** 表单正在提交
- **THEN** 系统 MUST 禁用提交按钮
- **AND** 显示提交中状态

## Component Contracts

### UserTable Props

```typescript
interface UserTableProps {
  users: User[];
  loading?: boolean;
  onEdit: (userId: string) => void;
  onStatusChange: (userId: string, status: UserStatus) => void;
}
```

### UserFilters Props

```typescript
interface UserFiltersProps {
  departments: Department[];
  onFilter: (filters: UserFilters) => void;
  initialValues?: UserFilters;
}

interface UserFilters {
  name?: string;
  employee_code?: string;
  department_id?: string;
  status?: UserStatus | 'all';
}
```

### UserForm Props

```typescript
interface UserFormProps {
  mode: 'create' | 'edit';
  initialValues?: UserFormData;
  departments: Department[];
  roles: Role[];
  onSubmit: (data: UserFormData) => Promise<void>;
}
```

## Acceptance Criteria Summary

1. [ ] 用户列表页面正确展示分页数据
2. [ ] 筛选器支持姓名、工号、部门、状态筛选
3. [ ] 创建用户表单提交成功
4. [ ] 编辑用户表单提交成功
5. [ ] 状态徽章样式符合规范
6. [ ] 使用 Shadcn/ui 组件和 Lucide React 图标
7. [ ] 颜色系统符合 UX 规范
8. [ ] 错误处理和加载状态正确展示
