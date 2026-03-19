## ADDED Requirements

### Requirement: Story 2.6 - 细粒度权限覆盖能力基线
系统 SHALL 实现细粒度权限覆盖数据模型，满足 FR(FR31, FR32) 和 NFR(NFR16) 的要求。

#### Scenario: 能力基线建立
- **WHEN** 系统初始化完成时
- **THEN** 系统 MUST 具备用户级权限覆盖的定义与管理能力

### Requirement: Story 2.6-1 - 设计用户权限覆盖数据模型
系统 MUST 实现 Design user_permission_overrides data model 功能，支持用户级权限覆盖存储。

#### Scenario: Story 2.6-1 验证通过
- **WHEN** 数据库迁移执行完成
- **THEN** 系统 SHALL 能够正确存储和查询用户权限覆盖数据

### Requirement: Story 2.6-2 - 支持数据范围权限
系统 MUST 实现 Support department-scope and self-scope data access 功能，控制用户可访问的数据范围。

#### Scenario: Story 2.6-2 验证通过
- **WHEN** 用户查询数据时
- **THEN** 系统 SHALL 根据用户数据范围权限自动过滤结果

### Requirement: Story 2.6-3 - 支持字段级权限
系统 MUST 实现 Support field hide and read-only rules 功能，控制字段显示状态。

#### Scenario: Story 2.6-3 验证通过
- **WHEN** 用户查看数据时
- **THEN** 系统 SHALL 根据字段权限配置隐藏/只读/脱敏相应字段

### Requirement: Story 2.6-4 - 扩展权限计算逻辑
系统 MUST 实现 Extend permission calculation logic 功能，整合用户级覆盖到权限计算。

#### Scenario: Story 2.6-4 验证通过
- **WHEN** 权限计算请求发生时
- **THEN** 系统 SHALL 正确应用用户级覆盖规则计算最终权限

---

## API Specification

### User Permission Overrides

#### GET /api/admin/users/:id/permission-overrides
获取用户的权限覆盖配置

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "resource": "hr.employee",
      "permission_id": null,
      "override_type": "grant",
      "data_scope": {
        "type": "department_tree",
        "rule": null
      },
      "field_restrictions": {
        "salary": {
          "mode": "hidden"
        },
        "phone": {
          "mode": "masked",
          "maskRule": "phone"
        }
      },
      "effective_from": "2026-03-18T00:00:00Z",
      "effective_until": null,
      "created_by": {
        "id": "uuid",
        "name": "管理员"
      },
      "created_at": "2026-03-18T00:00:00Z"
    }
  ]
}
```

#### PUT /api/admin/users/:id/permission-overrides
批量更新用户的权限覆盖配置

**Request Body:**
```json
{
  "overrides": [
    {
      "resource": "hr.employee",
      "override_type": "grant",
      "data_scope": {
        "type": "department_tree"
      },
      "field_restrictions": {
        "salary": { "mode": "hidden" }
      }
    },
    {
      "resource": "finance.invoice",
      "override_type": "deny"
    }
  ]
}
```

**Response:** 200 OK

#### POST /api/admin/users/:id/permission-overrides
添加单个权限覆盖项

**Request Body:**
```json
{
  "resource": "hr.employee",
  "permission_id": "uuid",  // 可选
  "override_type": "grant",
  "data_scope": {
    "type": "custom",
    "rule": {
      "field": "department_id",
      "operator": "in",
      "value": ["uuid1", "uuid2"]
    }
  },
  "field_restrictions": {
    "salary": { "mode": "readonly" }
  },
  "effective_until": "2026-12-31T23:59:59Z"  // 可选
}
```

**Response:** 201 Created

#### DELETE /api/admin/users/:id/permission-overrides/:overrideId
删除单个权限覆盖项

**Response:** 204 No Content

---

## Data Models

### PermissionOverride Entity
```typescript
interface PermissionOverride {
  id: string;
  tenant_id: string;
  user_id: string;
  resource: string;
  permission_id?: string;
  override_type: 'grant' | 'deny';
  data_scope: DataScope;
  field_restrictions?: Record<string, FieldRestriction>;
  effective_from: string;
  effective_until?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### DataScope Model
```typescript
interface DataScope {
  type: 'all' | 'department' | 'department_tree' | 'self' | 'custom';
  rule?: DataScopeRule;  // 仅当 type 为 custom 时有效
}

interface DataScopeRule {
  conditions: DataScopeCondition[];
  logic: 'and' | 'or';
}

interface DataScopeCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'not_in' | 'gt' | 'lt' | 'gte' | 'lte' | 'like';
  value: any;
}
```

### FieldRestriction Model
```typescript
interface FieldRestriction {
  mode: 'visible' | 'hidden' | 'readonly' | 'masked';
  maskRule?: 'phone' | 'email' | 'idcard' | 'bankcard' | 'custom';
  customMaskPattern?: string;
}
```

---

## Permission Result Structure

### Complete Permission Result
```typescript
interface PermissionResult {
  // 权限列表
  permissions: Record<string, boolean>;
  
  // 数据范围
  data_scope: DataScope;
  
  // 字段限制
  field_restrictions: Record<string, FieldRestriction>;
  
  // 来源追溯
  sources: PermissionSource[];
}

interface PermissionSource {
  permission_id: string;
  source_type: 'role' | 'override';
  source_id: string;  // role_id 或 override_id
  source_name: string;  // 角色名称或"用户覆盖"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `OVERRIDE_NOT_FOUND` | 权限覆盖不存在 |
| `INVALID_OVERRIDE_TYPE` | 无效的覆盖类型 |
| `INVALID_DATA_SCOPE` | 无效的数据范围配置 |
| `INVALID_FIELD_RESTRICTION` | 无效的字段限制配置 |
| `PERMISSION_DENIED` | 无权限执行此操作 |
| `INVALID_DATE_RANGE` | 有效期配置无效（开始时间晚于结束时间） |