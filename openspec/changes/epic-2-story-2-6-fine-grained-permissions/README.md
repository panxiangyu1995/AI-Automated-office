# epic-2-story-2-6-fine-grained-permissions

## Story
- **Epic:** Epic 2 - 用户认证与部门权限系统
- **Story:** Story 2.6 - 细粒度权限覆盖
- **Title:** Fine-grained permission overrides
- **Task ID:** E2-S2.6-01

## Capability
- **Name:** `fine-grained-permissions`
- **Description:** 实现用户级权限覆盖、数据范围规则、字段级权限控制等细粒度权限功能。

## 铁律文档映射

### PRD 合规
| 需求编号 | 需求描述 | 覆盖状态 |
|---------|---------|---------|
| FR31 | 管理员可以配置细粒度权限（到个人级别） | 完全覆盖 |
| FR32 | 管理员可以配置数据访问权限（部门级/个人级） | 完全覆盖 |

### 架构合规
| 架构决策 | 决策内容 | 覆盖状态 |
|---------|---------|---------|
| ADR-018 | 字段级权限采用后台动态配置 | 完全覆盖 |

### NFR 合规
| 需求编号 | 需求描述 | 覆盖状态 |
|---------|---------|---------|
| NFR16 | 可扩展性要求：单租户≥500用户 | 完全覆盖 |

### UX 合规
无直接 UX 需求覆盖（后端模型设计）

## Requirements Mapping
- **FR:** FR31, FR32
- **NFR:** NFR16
- **ARCH:** ADR-018
- **UX:** N/A

## Dependencies
- **E2-S2.5-01** (三层权限模型) - 需要基础权限模型支持

## Planned Steps
1. Design user_permission_overrides data model
2. Support department-scope and self-scope data access
3. Support field hide and read-only rules
4. Extend permission calculation logic

## Technical Approach

### 细粒度权限模型

```
┌─────────────────────────────────────────────────────────────────┐
│                    细粒度权限模型                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  三层权限模型（基础）                                           │
│  ├── 角色权限：通过角色获得的权限                               │
│  └── 可被用户级覆盖修改                                         │
│                                                                 │
│  用户级权限覆盖                                                 │
│  ├── 额外授权：用户额外获得的权限                               │
│  ├── 权限剥夺：用户被剥夺的角色权限                             │
│  └── 优先级高于角色权限                                         │
│                                                                 │
│  数据范围权限                                                   │
│  ├── 全部数据：可访问所有数据                                   │
│  ├── 部门数据：仅可访问本部门数据                               │
│  ├── 部门及下级：可访问本部门及下级部门数据                     │
│  ├── 仅本人：仅可访问自己创建的数据                             │
│  └── 自定义：通过规则表达式定义                                 │
│                                                                 │
│  字段级权限                                                     │
│  ├── 可见：字段正常显示                                         │
│  ├── 隐藏：字段完全不显示                                       │
│  ├── 只读：字段可见但不可编辑                                   │
│  └── 脱敏：字段显示为脱敏值（如 ****）                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 数据模型设计

```
user_permission_overrides (用户权限覆盖表)
├── id: UUID
├── tenant_id: UUID
├── user_id: UUID
├── permission_id: UUID (可选，权限级覆盖)
├── resource: string (资源标识)
├── override_type: enum (grant/deny)
├── data_scope: enum (all/department/department_tree/self/custom)
├── data_scope_rule: JSON (自定义规则)
├── field_restrictions: JSON (字段级限制)
├── effective_from: timestamp
├── effective_until: timestamp (可选)
├── created_by: UUID
└── created_at, updated_at
```

## Acceptance Criteria
- [ ] 用户权限覆盖数据表已创建
- [ ] 数据范围权限逻辑已实现
- [ ] 字段级权限控制已实现
- [ ] 权限计算逻辑已扩展支持覆盖