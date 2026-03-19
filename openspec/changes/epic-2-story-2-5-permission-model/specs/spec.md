## ADDED Requirements

### Requirement: Story 2.5 - 三层权限模型能力基线
系统 SHALL 实现三层权限模型的数据基础，满足 FR(FR29, FR30) 和 NFR(NFR16) 的要求。

#### Scenario: 能力基线建立
- **WHEN** 系统初始化完成时
- **THEN** 系统 MUST 具备角色和权限的定义与管理能力

### Requirement: Story 2.5-1 - 定义角色和权限数据结构
系统 MUST 实现 Define roles, permissions, user_roles, and role_permissions 功能，满足 Epic 2 的数据存储要求。

#### Scenario: Story 2.5-1 验证通过
- **WHEN** 数据库迁移执行完成
- **THEN** 系统 SHALL 能够正确存储和查询角色和权限数据

### Requirement: Story 2.5-2 - 定义三层权限层级
系统 MUST 实现 Define three permission layers 功能，支持基础权限、部门权限、审批权限三层模型。

#### Scenario: Story 2.5-2 验证通过
- **WHEN** 权限计算请求发生时
- **THEN** 系统 SHALL 能够正确识别和处理三层权限层级关系

### Requirement: Story 2.5-3 - 定义资源映射和权限命名
系统 MUST 实现 Define resource mapping and permission names 功能，遵循 ADR-017 命名规范。

#### Scenario: Story 2.5-3 验证通过
- **WHEN** 新增权限定义时
- **THEN** 系统 SHALL 遵循 `{module}_{resource}_{action}` 命名格式

### Requirement: Story 2.5-4 - 初始化默认角色和权限
系统 MUST 实现 Seed default roles and permissions 功能，为系统提供开箱即用的权限配置。

#### Scenario: Story 2.5-4 验证通过
- **WHEN** 系统首次安装完成
- **THEN** 系统 SHALL 包含超级管理员、部门管理员、普通员工、审批人等默认角色

---

## API Specification

### Role Management

#### GET /api/admin/roles
获取角色列表

**Query Parameters:**
- `page` (optional): 页码，默认 1
- `page_size` (optional): 每页数量，默认 20
- `layer` (optional): 按层级筛选
- `type` (optional): 按类型筛选

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "超级管理员",
      "code": "super_admin",
      "type": "system",
      "layer": "base",
      "description": "租户级最高权限",
      "permission_count": 50,
      "user_count": 1,
      "created_at": "2026-03-18T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 4
  }
}
```

#### POST /api/admin/roles
创建角色

**Request Body:**
```json
{
  "name": "财务专员",
  "code": "finance_staff",
  "type": "custom",
  "layer": "department",
  "description": "财务部门专员角色"
}
```

**Response:** 201 Created

#### GET /api/admin/roles/:id/permissions
获取角色的权限列表

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "code": "finance_invoice_read",
      "name": "查看发票",
      "resource": "finance.invoice",
      "action": "read",
      "layer": "department"
    }
  ]
}
```

#### PUT /api/admin/roles/:id/permissions
更新角色的权限

**Request Body:**
```json
{
  "permission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### Permission Management

#### GET /api/admin/permissions
获取权限列表（按层级分组）

**Query Parameters:**
- `layer` (optional): 按层级筛选
- `module` (optional): 按模块筛选

**Response:**
```json
{
  "data": {
    "base": [
      {
        "id": "uuid",
        "code": "auth_profile_read",
        "name": "查看个人信息",
        "resource": "auth.profile",
        "action": "read"
      }
    ],
    "department": [
      {
        "id": "uuid",
        "code": "hr_employee_read",
        "name": "查看员工信息",
        "resource": "hr.employee",
        "action": "read"
      }
    ],
    "approval": [
      {
        "id": "uuid",
        "code": "approval_approve",
        "name": "审批通过",
        "resource": "approval.flow",
        "action": "write"
      }
    ]
  }
}
```

### User Role Assignment

#### GET /api/admin/users/:id/roles
获取用户的角色列表

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "role": {
        "id": "uuid",
        "name": "部门管理员",
        "code": "dept_admin",
        "layer": "department"
      },
      "department": {
        "id": "uuid",
        "name": "销售部"
      },
      "assigned_at": "2026-03-18T00:00:00Z",
      "assigned_by": {
        "id": "uuid",
        "name": "管理员"
      }
    }
  ]
}
```

#### PUT /api/admin/users/:id/roles
更新用户的角色分配

**Request Body:**
```json
{
  "roles": [
    {
      "role_id": "uuid",
      "department_id": "uuid" // 可选，部门级角色绑定
    }
  ]
}
```

---

## Data Models

### Role Entity
```typescript
interface Role {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  type: 'system' | 'department' | 'custom';
  layer: 'base' | 'department' | 'approval';
  description: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}
```

### Permission Entity
```typescript
interface Permission {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
  layer: 'base' | 'department' | 'approval';
  description: string;
  created_at: string;
}
```

### UserRole Entity
```typescript
interface UserRole {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  department_id?: string;
  assigned_by: string;
  assigned_at: string;
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `ROLE_NOT_FOUND` | 角色不存在 |
| `PERMISSION_NOT_FOUND` | 权限不存在 |
| `ROLE_CODE_DUPLICATE` | 角色编码重复 |
| `SYSTEM_ROLE_IMMUTABLE` | 系统角色不可修改/删除 |
| `INVALID_PERMISSION_LAYER` | 无效的权限层级 |