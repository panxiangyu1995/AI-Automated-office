# epic-2-story-2-5-permission-model

## Story
- **Epic:** Epic 2 - 用户认证与部门权限系统
- **Story:** Story 2.5 - 三层权限模型
- **Title:** Three-layer permission model
- **Task ID:** E2-S2.5-01

## Capability
- **Name:** `permission-model`
- **Description:** 设计基础权限、部门权限、审批权限三层权限模型及相关数据库表结构。

## 铁律文档映射

### PRD 合规
| 需求编号 | 需求描述 | 覆盖状态 |
|---------|---------|---------|
| FR29 | 管理员可以按部门分配用户权限 | 完全覆盖 |
| FR30 | 系统支持部门权限模型（基础权限+部门权限+审批权限） | 完全覆盖 |

### 架构合规
| 架构决策 | 决策内容 | 覆盖状态 |
|---------|---------|---------|
| ADR-005 | 多租户采用数据库级隔离 | 完全覆盖 |
| ADR-017 | 工具命名采用`{plugin}_{entity}_{action}`格式 | 完全覆盖 |

### NFR 合规
| 需求编号 | 需求描述 | 覆盖状态 |
|---------|---------|---------|
| NFR16 | 可扩展性要求：单租户≥500用户 | 完全覆盖 |

### UX 合规
无直接 UX 需求覆盖（后端模型设计）

## Requirements Mapping
- **FR:** FR29, FR30
- **NFR:** NFR16
- **ARCH:** ADR-005, ADR-017
- **UX:** N/A

## Dependencies
- **E2-S2.3-01** (Organization Domain Model) - 部门权限依赖部门架构

## Planned Steps
1. Define roles, permissions, user_roles, and role_permissions
2. Define three permission layers (基础权限/部门权限/审批权限)
3. Define resource mapping and permission names
4. Seed default roles and permissions

## Technical Approach

### 数据模型设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    权限模型数据结构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  roles (角色表)                                                 │
│  ├── id: UUID                                                   │
│  ├── tenant_id: UUID                                            │
│  ├── name: string (角色名称)                                    │
│  ├── code: string (角色编码)                                    │
│  ├── type: enum (system/department/custom)                     │
│  ├── layer: enum (base/department/approval)                    │
│  ├── description: string                                        │
│  └── created_at, updated_at                                     │
│                                                                 │
│  permissions (权限表)                                           │
│  ├── id: UUID                                                   │
│  ├── tenant_id: UUID                                            │
│  ├── code: string (权限编码，如 auth_user_write)                │
│  ├── name: string (权限名称)                                    │
│  ├── resource: string (资源标识)                                │
│  ├── action: enum (read/write/delete/admin)                    │
│  ├── layer: enum (base/department/approval)                    │
│  └── description: string                                        │
│                                                                 │
│  user_roles (用户角色关联表)                                    │
│  ├── id: UUID                                                   │
│  ├── user_id: UUID                                              │
│  ├── role_id: UUID                                              │
│  ├── department_id: UUID (可选，部门级角色绑定)                 │
│  └── assigned_at, assigned_by                                   │
│                                                                 │
│  role_permissions (角色权限关联表)                              │
│  ├── id: UUID                                                   │
│  ├── role_id: UUID                                              │
│  ├── permission_id: UUID                                        │
│  └── created_at                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 三层权限模型定义

| 层级 | 名称 | 说明 | 示例 |
|------|------|------|------|
| **基础权限** | Base | 所有用户的基本权限 | 查看个人信息、修改密码 |
| **部门权限** | Department | 部门内的业务权限 | 查看部门数据、编辑部门文档 |
| **审批权限** | Approval | 审批流程相关权限 | 发起审批、审批通过/驳回 |

## Acceptance Criteria
- [ ] 角色和权限数据库表已创建
- [ ] 三层权限模型定义清晰
- [ ] 默认角色和权限已初始化
- [ ] 权限计算逻辑可测试