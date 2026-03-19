## Context

- **Change:** `epic-2-story-2-5-permission-model`
- **Story:** Story 2.5 - 三层权限模型
- **Capability:** `permission-model`
- **需求映射:** FR(FR29, FR30), NFR(NFR16), ARCH(ADR-005, ADR-017)

本设计文档定义三层权限模型的详细架构，包括数据库设计、API 设计和权限计算逻辑。

## Goals / Non-Goals

**Goals:**
- 设计清晰的三层权限数据模型（基础权限/部门权限/审批权限）
- 支持按部门分配用户权限的业务需求
- 为 Epic 2 后续 Story 提供权限计算基础
- 遵循 Go 云端后端的分层架构设计

**Non-Goals:**
- 不涉及权限 UI 界面设计（由 E2-S2.5-02 处理）
- 不涉及细粒度权限覆盖（由 E2-S2.6 处理）
- 不涉及权限网关中间件（由 E2-S2.7 处理）
- 不涉及前端 React/Tauri 权限处理

## Architecture Design

### 分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    权限模型分层架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  API Layer                                                      │
│  ├── /api/admin/roles          角色管理接口                     │
│  ├── /api/admin/permissions    权限查询接口                     │
│  └── /api/admin/user-roles     用户角色分配接口                 │
│                                                                 │
│  Service Layer                                                  │
│  ├── RoleService              角色业务逻辑                      │
│  ├── PermissionService        权限业务逻辑                      │
│  └── PermissionCalculator      权限计算服务                     │
│                                                                 │
│  Repository Layer                                               │
│  ├── RoleRepository           角色数据访问                      │
│  ├── PermissionRepository     权限数据访问                      │
│  └── UserRoleRepository       用户角色关联访问                  │
│                                                                 │
│  Database Layer                                                 │
│  ├── roles                    角色表                            │
│  ├── permissions              权限表                            │
│  ├── user_roles               用户角色关联表                    │
│  └── role_permissions         角色权限关联表                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 数据库设计

#### roles 表

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'custom', -- system, department, custom
    layer VARCHAR(20) NOT NULL DEFAULT 'base',  -- base, department, approval
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_layer ON roles(layer);
```

#### permissions 表

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    code VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL,  -- read, write, delete, admin
    layer VARCHAR(20) NOT NULL DEFAULT 'base',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_permissions_tenant ON permissions(tenant_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_layer ON permissions(layer);
```

#### user_roles 表

```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    department_id UUID REFERENCES departments(id),  -- 可选，部门级角色绑定
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, user_id, role_id, department_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_department ON user_roles(department_id);
```

#### role_permissions 表

```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    permission_id UUID NOT NULL REFERENCES permissions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
```

### 三层权限模型设计

#### 层级定义

```
┌─────────────────────────────────────────────────────────────────┐
│                    三层权限模型                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: 基础权限 (Base)                                       │
│  ├── 适用对象：所有用户                                         │
│  ├── 权限范围：个人信息查看、密码修改、公告查看等              │
│  └── 示例权限：auth_profile_read, auth_password_change         │
│                                                                 │
│  Layer 2: 部门权限 (Department)                                 │
│  ├── 适用对象：部门内用户                                       │
│  ├── 权限范围：部门数据查看/编辑、部门文档管理等              │
│  ├── 继承关系：自动继承基础权限                                 │
│  └── 示例权限：hr_employee_read, hr_employee_write             │
│                                                                 │
│  Layer 3: 审批权限 (Approval)                                   │
│  ├── 适用对象：审批人角色用户                                   │
│  ├── 权限范围：发起审批、审批通过/驳回等                       │
│  ├── 继承关系：自动继承部门权限                                 │
│  └── 示例权限：approval_create, approval_approve               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 权限计算逻辑

```go
// PermissionCalculator 权限计算服务
type PermissionCalculator struct {
    roleRepo       RoleRepository
    permissionRepo PermissionRepository
    userRoleRepo   UserRoleRepository
    cache          PermissionCache
}

// GetUserPermissions 获取用户的所有有效权限
func (pc *PermissionCalculator) GetUserPermissions(ctx context.Context, userID string) (*PermissionSet, error) {
    // 1. 检查缓存
    if cached, ok := pc.cache.Get(userID); ok {
        return cached, nil
    }
    
    // 2. 获取用户的所有角色
    userRoles, err := pc.userRoleRepo.GetByUserID(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    // 3. 汇总所有角色的权限
    permissionSet := NewPermissionSet()
    for _, ur := range userRoles {
        rolePermissions, err := pc.permissionRepo.GetByRoleID(ctx, ur.RoleID)
        if err != nil {
            return nil, err
        }
        permissionSet.Merge(rolePermissions)
    }
    
    // 4. 缓存结果
    pc.cache.Set(userID, permissionSet, 5*time.Minute)
    
    return permissionSet, nil
}

// HasPermission 检查用户是否拥有指定权限
func (pc *PermissionCalculator) HasPermission(ctx context.Context, userID string, permissionCode string) (bool, error) {
    permissions, err := pc.GetUserPermissions(ctx, userID)
    if err != nil {
        return false, err
    }
    return permissions.Contains(permissionCode), nil
}
```

### API Design

#### 角色管理 API

```
GET    /api/admin/roles                 # 获取角色列表
POST   /api/admin/roles                 # 创建角色
GET    /api/admin/roles/:id             # 获取角色详情
PUT    /api/admin/roles/:id             # 更新角色
DELETE /api/admin/roles/:id             # 删除角色

GET    /api/admin/roles/:id/permissions # 获取角色的权限列表
PUT    /api/admin/roles/:id/permissions # 更新角色的权限
```

#### 权限管理 API

```
GET    /api/admin/permissions           # 获取权限列表（按层级分组）
GET    /api/admin/permissions/:code     # 获取权限详情
```

#### 用户角色分配 API

```
GET    /api/admin/users/:id/roles       # 获取用户的角色列表
PUT    /api/admin/users/:id/roles       # 更新用户的角色分配
```

## Decisions

1. **权限数据存储在 Go 云端后端**
   - Rationale: 权限是安全关键数据，统一由云端管理符合 NFR 安全要求。
   - 所有权限计算在云端完成，前端只消费结果。

2. **权限计算结果缓存 5 分钟**
   - Rationale: 平衡性能和实时性，权限变更在 5 分钟内生效。
   - 权限变更时可主动清除缓存，实现即时生效。

3. **三层权限采用继承模式**
   - Rationale: 简化权限配置，高层级自动继承低层级权限。
   - 审批权限用户自动拥有部门权限和基础权限。

4. **权限编码采用模块前缀**
   - Rationale: 遵循 ADR-017，便于权限分类管理和冲突避免。
   - 格式：`{module}_{resource}_{action}`

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 权限数据量增长 | 采用合理的索引设计，权限计算结果缓存 |
| 多租户隔离 | 所有权限查询必须携带 tenant_id 条件 |
| 权限继承复杂性 | 清晰定义继承规则，提供可视化工具辅助理解 |
| 性能瓶颈 | 权限计算异步化，结果缓存，分页查询 |

## Migration Plan

1. **数据库迁移**
   - 创建 roles、permissions、user_roles、role_permissions 表
   - 执行种子数据初始化脚本

2. **服务开发**
   - 实现 RoleService、PermissionService、PermissionCalculator
   - 实现相关 Repository

3. **API 开发**
   - 实现角色管理 API
   - 实现权限查询 API
   - 实现用户角色分配 API

4. **集成测试**
   - 编写单元测试覆盖权限计算逻辑
   - 编写集成测试验证 API 行为

5. **与前端集成**
   - 提供权限列表 API 供权限中心 UI 使用
   - 协调 E2-S2.5-02 进行联调

## Open Questions

1. **权限组功能**：是否需要支持权限组（Permission Group）以便于批量授权？
2. **权限继承规则**：是否需要支持自定义继承规则而非固定三层？
3. **临时权限**：是否需要支持有时限的临时权限授权？
4. **权限审计**：权限变更是否需要记录详细的审计日志？