## Context

- **Change:** `epic-2-story-2-6-fine-grained-permissions`
- **Story:** Story 2.6 - 细粒度权限覆盖
- **Capability:** `fine-grained-permissions`
- **需求映射:** FR(FR31, FR32), NFR(NFR16), ARCH(ADR-018)

本设计文档定义细粒度权限覆盖的详细架构，包括用户级权限覆盖、数据范围权限和字段级权限控制。

## Goals / Non-Goals

**Goals:**
- 实现用户级权限覆盖的数据模型和计算逻辑
- 支持多种数据范围权限控制
- 实现字段级的显示/隐藏/只读控制
- 遵循 ADR-018 后台动态配置原则

**Non-Goals:**
- 不涉及权限 UI 界面（由 E2-S2.6-02 处理）
- 不涉及权限网关中间件（由 E2-S2.7 处理）
- 不涉及前端 React/Tauri 权限展示

## Architecture Design

### 细粒度权限架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    细粒度权限架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PermissionCalculator (权限计算服务)                            │
│  ├── 计算角色权限                                               │
│  ├── 应用用户级覆盖                                             │
│  ├── 计算数据范围权限                                           │
│  └── 计算字段级权限                                             │
│                                                                 │
│  DataScopeFilter (数据范围过滤器)                               │
│  ├── 全部数据过滤器                                             │
│  ├── 部门数据过滤器                                             │
│  ├── 部门树数据过滤器                                           │
│  ├── 本人数据过滤器                                             │
│  └── 自定义规则过滤器                                           │
│                                                                 │
│  FieldPermissionService (字段权限服务)                          │
│  ├── 字段可见性计算                                             │
│  ├── 字段只读状态计算                                           │
│  └── 字段脱敏处理                                               │
│                                                                 │
│  Database Layer                                                 │
│  ├── user_permission_overrides (用户权限覆盖表)                 │
│  ├── data_scope_rules (数据范围规则表)                          │
│  └── field_restrictions (字段限制表)                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 数据库设计

#### user_permission_overrides 表

```sql
CREATE TABLE user_permission_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    resource VARCHAR(100) NOT NULL,         -- 资源标识
    permission_id UUID REFERENCES permissions(id), -- 可选，具体权限
    override_type VARCHAR(20) NOT NULL,     -- grant, deny
    
    -- 数据范围配置
    data_scope VARCHAR(50) NOT NULL DEFAULT 'all', -- all, department, department_tree, self, custom
    data_scope_rule JSONB,                  -- 自定义规则
    
    -- 字段级权限
    field_restrictions JSONB,               -- 字段限制配置
    
    -- 有效期
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP WITH TIME ZONE,  -- 可选，临时授权
    
    -- 审计
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, user_id, resource, permission_id)
);

CREATE INDEX idx_user_perm_overrides_user ON user_permission_overrides(user_id);
CREATE INDEX idx_user_perm_overrides_resource ON user_permission_overrides(resource);
CREATE INDEX idx_user_perm_overrides_tenant ON user_permission_overrides(tenant_id);
```

### 权限计算扩展

```go
// PermissionCalculator 扩展
type PermissionCalculator struct {
    roleRepo         RoleRepository
    permissionRepo   PermissionRepository
    userRoleRepo     UserRoleRepository
    overrideRepo     PermissionOverrideRepository
    dataScopeService DataScopeService
    fieldService     FieldPermissionService
    cache            PermissionCache
}

// GetUserPermissionResult 获取用户完整权限结果
func (pc *PermissionCalculator) GetUserPermissionResult(ctx context.Context, userID string, resource string) (*PermissionResult, error) {
    result := &PermissionResult{
        Permissions:    make(map[string]bool),
        DataScope:      DataScopeAll,
        FieldRestrictions: make(map[string]FieldRestriction),
    }
    
    // 1. 获取用户角色权限
    rolePermissions, err := pc.GetRolePermissions(ctx, userID)
    if err != nil {
        return nil, err
    }
    
    // 2. 应用用户级覆盖
    overrides, err := pc.overrideRepo.GetByUserID(ctx, userID, resource)
    if err != nil {
        return nil, err
    }
    
    result.Permissions = applyOverrides(rolePermissions, overrides)
    
    // 3. 计算数据范围
    dataScope, err := pc.dataScopeService.GetUserScope(ctx, userID, resource)
    if err != nil {
        return nil, err
    }
    result.DataScope = dataScope
    
    // 4. 计算字段限制
    fieldRestrictions, err := pc.fieldService.GetFieldRestrictions(ctx, userID, resource)
    if err != nil {
        return nil, err
    }
    result.FieldRestrictions = fieldRestrictions
    
    return result, nil
}

// applyOverrides 应用权限覆盖
func applyOverrides(basePermissions map[string]bool, overrides []PermissionOverride) map[string]bool {
    result := make(map[string]bool)
    for k, v := range basePermissions {
        result[k] = v
    }
    
    for _, override := range overrides {
        if override.PermissionID != "" {
            // 具体权限覆盖
            if override.OverrideType == "grant" {
                result[override.PermissionID] = true
            } else {
                result[override.PermissionID] = false
            }
        } else {
            // 资源级覆盖
            if override.OverrideType == "grant" {
                // 授权整个资源
                grantResourcePermissions(result, override.Resource)
            } else {
                // 剥夺整个资源
                revokeResourcePermissions(result, override.Resource)
            }
        }
    }
    
    return result
}
```

### 数据范围过滤

```go
// DataScopeService 数据范围服务
type DataScopeService struct {
    deptRepo DepartmentRepository
    db       *sql.DB
}

// ApplyDataScope 应用数据范围过滤到查询
func (dss *DataScopeService) ApplyDataScope(query *gorm.DB, userID string, resource string, scope DataScope) (*gorm.DB, error) {
    switch scope.Type {
    case DataScopeAll:
        // 无过滤
        return query, nil
        
    case DataScopeDepartment:
        // 仅本部门
        user, err := dss.getUserDepartment(userID)
        if err != nil {
            return nil, err
        }
        return query.Where("department_id = ?", user.DepartmentID), nil
        
    case DataScopeDepartmentTree:
        // 本部门及下级
        deptIDs, err := dss.getDepartmentTree(userID)
        if err != nil {
            return nil, err
        }
        return query.Where("department_id IN ?", deptIDs), nil
        
    case DataScopeSelf:
        // 仅本人
        return query.Where("created_by = ?", userID), nil
        
    case DataScopeCustom:
        // 自定义规则
        return dss.applyCustomRule(query, scope.Rule)
        
    default:
        return query, nil
    }
}
```

### 字段权限服务

```go
// FieldPermissionService 字段权限服务
type FieldPermissionService struct {
    overrideRepo PermissionOverrideRepository
}

// FieldRestriction 字段限制
type FieldRestriction struct {
    Field    string           `json:"field"`
    Mode     FieldMode        `json:"mode"`     // visible, hidden, readonly, masked
    MaskRule string           `json:"maskRule"` // 脱敏规则
}

// GetFieldRestrictions 获取字段限制
func (fps *FieldPermissionService) GetFieldRestrictions(ctx context.Context, userID string, resource string) (map[string]FieldRestriction, error) {
    overrides, err := fps.overrideRepo.GetByUserIDAndResource(ctx, userID, resource)
    if err != nil {
        return nil, err
    }
    
    restrictions := make(map[string]FieldRestriction)
    
    for _, override := range overrides {
        if override.FieldRestrictions != nil {
            for fieldName, config := range override.FieldRestrictions {
                restrictions[fieldName] = FieldRestriction{
                    Field:    fieldName,
                    Mode:     FieldMode(config["mode"].(string)),
                    MaskRule: config["maskRule"].(string),
                }
            }
        }
    }
    
    return restrictions, nil
}

// ApplyFieldMasking 应用字段脱敏
func (fps *FieldPermissionService) ApplyFieldMasking(value interface{}, rule string) interface{} {
    switch rule {
    case "phone":
        // 手机号脱敏：138****1234
        return maskPhone(fmt.Sprintf("%v", value))
    case "email":
        // 邮箱脱敏：a***@example.com
        return maskEmail(fmt.Sprintf("%v", value))
    case "idcard":
        // 身份证脱敏：320***********1234
        return maskIDCard(fmt.Sprintf("%v", value))
    case "bankcard":
        // 银行卡脱敏：6222****1234
        return maskBankCard(fmt.Sprintf("%v", value))
    default:
        return "****"
    }
}
```

## API Design

### 用户权限覆盖 API

```
GET  /api/admin/users/:id/permission-overrides      # 获取用户权限覆盖
PUT  /api/admin/users/:id/permission-overrides      # 更新用户权限覆盖
POST /api/admin/users/:id/permission-overrides      # 添加权限覆盖项
DELETE /api/admin/users/:id/permission-overrides/:overrideId  # 删除权限覆盖项
```

**GET Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "resource": "hr.employee",
      "override_type": "grant",
      "data_scope": "department_tree",
      "field_restrictions": {
        "salary": { "mode": "hidden" },
        "phone": { "mode": "masked", "maskRule": "phone" }
      },
      "effective_from": "2026-03-18T00:00:00Z",
      "effective_until": null
    }
  ]
}
```

## Decisions

1. **权限覆盖采用黑白名单机制**
   - Rationale: grant/deny 二元模式简单明确，易于理解和维护。
   - deny 优先级高于 grant，确保安全优先。

2. **数据范围支持自定义规则**
   - Rationale: 预设范围不能满足所有场景，自定义规则提供灵活性。
   - 规则采用 JSON 格式，支持复杂条件组合。

3. **字段权限采用声明式配置**
   - Rationale: 字段数量多，逐个配置成本高。
   - 支持模板和批量配置，降低管理成本。

4. **权限覆盖支持有效期**
   - Rationale: 支持临时授权场景，如项目期间授权。
   - 过期自动失效，无需手动撤销。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 权限计算性能 | 分层缓存、增量计算 |
| 配置复杂度高 | 提供配置向导、模板 |
| 数据范围查询慢 | 数据库索引、查询优化 |
| 字段权限冲突 | 明确优先级、冲突检测 |

## Migration Plan

1. 创建 user_permission_overrides 数据表
2. 扩展 PermissionCalculator 支持覆盖
3. 实现 DataScopeService 数据范围服务
4. 实现 FieldPermissionService 字段权限服务
5. 编写单元测试和集成测试
6. 与 E2-S2.6-02 UI 集成验证

## Open Questions

1. 自定义数据范围规则的语法格式？
2. 字段权限是否支持条件触发（如某些状态才隐藏）？
3. 权限覆盖变更是否需要审批流程？
4. 是否支持权限覆盖的批量导入导出？