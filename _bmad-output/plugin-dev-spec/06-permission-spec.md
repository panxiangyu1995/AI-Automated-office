# 第6章：权限层规范 (Permission Specification)

> 权限层负责定义插件的角色、权限矩阵和数据权限控制。

---

## 6.1 权限模型

### 6.1.1 RBAC模型

采用**基于角色的访问控制 (RBAC)**：

```
用户(User) → 角色(Role) → 权限(Permission)
```

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC权限模型                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户                角色                  权限             │
│  ┌─────┐           ┌─────┐              ┌───────┐         │
│  │张三 │──────────▶│销售 │─────────────▶│contract│         │
│  └─────┘           │经理 │              │:read  │         │
│                    └─────┘              └───────┘         │
│                       │                  ┌───────┐         │
│                       └─────────────────▶│contract│         │
│                                          │:write │         │
│                                          └───────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.1.2 权限命名规范

格式：`{plugin}:{entity}:{action}`

```
示例：
- sales:contract:read      # 销售_合同_读取
- sales:contract:write     # 销售_合同_写入
- sales:contract:delete    # 销售_合同_删除
- sales:contract:*         # 销售_合同_全部权限
- sales:*                  # 销售模块全部权限
```

### 6.1.3 操作类型

| 操作 | 说明 |
|------|------|
| `read` | 读取、查看 |
| `write` | 创建、更新 |
| `delete` | 删除 |
| `export` | 导出 |
| `admin` | 管理配置 |
| `*` | 全部权限 |

---

## 6.2 角色定义

### 6.2.1 预置角色

每个插件可以定义自己的角色：

```typescript
// permissions/index.ts
import { defineRoles } from '@office/plugin-sdk';

export const roles = defineRoles({
  // 销售员角色
  'sales-person': {
    name: '销售员',
    description: '普通销售人员',
    permissions: [
      'sales:contract:read',
      'sales:contract:write',
      'sales:order:read',
      'sales:order:write',
      'sales:customer:read',
      'sales:customer:write',
      'hr:employee:read'
    ],
    dataScope: 'self'  // 只能访问自己的数据
  },
  
  // 销售经理角色
  'sales-manager': {
    name: '销售经理',
    description: '销售部门经理',
    permissions: [
      'sales:*',           // 销售模块全部权限
      'approval:request:approve',
      'hr:employee:read',
      'hr:department:read'
    ],
    dataScope: 'department'  // 可访问本部门数据
  },
  
  // 销售总监角色
  'sales-director': {
    name: '销售总监',
    description: '销售部门总监',
    permissions: [
      'sales:*',
      'approval:request:approve',
      'hr:*'
    ],
    dataScope: 'company'  // 可访问全公司数据
  }
});
```

### 6.2.2 角色继承

```typescript
export const roles = defineRoles({
  'sales-manager': {
    extends: 'sales-person',  // 继承销售员角色的权限
    permissions: [
      'sales:*',  // 额外权限
      'approval:request:approve'
    ],
    dataScope: 'department'
  }
});
```

---

## 6.3 权限矩阵

### 6.3.1 权限矩阵定义

```typescript
// permissions/matrix.ts
export const permissionMatrix = {
  // 实体: 合同
  contract: {
    read: {
      description: '查看合同',
      defaultRoles: ['sales-person', 'sales-manager', 'sales-director'],
      dataScope: true  // 支持数据权限过滤
    },
    write: {
      description: '创建/编辑合同',
      defaultRoles: ['sales-person', 'sales-manager', 'sales-director'],
      dataScope: true
    },
    delete: {
      description: '删除合同',
      defaultRoles: ['sales-manager', 'sales-director'],
      dataScope: true
    },
    export: {
      description: '导出合同',
      defaultRoles: ['sales-manager', 'sales-director'],
      dataScope: false
    },
    approve: {
      description: '审批合同',
      defaultRoles: ['sales-manager', 'sales-director'],
      dataScope: false
    }
  },
  
  // 实体: 订单
  order: {
    read: {
      description: '查看订单',
      defaultRoles: ['sales-person', 'sales-manager', 'sales-director'],
      dataScope: true
    },
    write: {
      description: '创建/编辑订单',
      defaultRoles: ['sales-person', 'sales-manager', 'sales-director'],
      dataScope: true
    }
  },
  
  // 实体: 客户
  customer: {
    read: {
      description: '查看客户',
      defaultRoles: ['sales-person', 'sales-manager', 'sales-director'],
      dataScope: true
    },
    write: {
      description: '创建/编辑客户',
      defaultRoles: ['sales-person', 'sales-manager', 'sales-director'],
      dataScope: true
    },
    delete: {
      description: '删除客户',
      defaultRoles: ['sales-manager', 'sales-director'],
      dataScope: true
    }
  }
};
```

### 6.3.2 权限矩阵可视化

| 操作 | 销售员 | 销售经理 | 销售总监 |
|------|:------:|:--------:|:--------:|
| 查看合同 | ✅ 自己 | ✅ 本部门 | ✅ 全公司 |
| 创建合同 | ✅ | ✅ | ✅ |
| 编辑合同 | ✅ 自己 | ✅ 本部门 | ✅ 全公司 |
| 删除合同 | ❌ | ✅ 本部门 | ✅ 全公司 |
| 导出合同 | ❌ | ✅ | ✅ |
| 审批合同 | ❌ | ✅ 本部门 | ✅ 全公司 |

---

## 6.4 数据权限

### 6.4.1 数据范围类型

| 范围类型 | 说明 | SQL条件 |
|---------|------|---------|
| `self` | 仅自己的数据 | `owner_id = current_user_id` |
| `department` | 本部门数据 | `department_id = current_dept_id` |
| `department_and_sub` | 本部门及下级 | `department_id IN (sub_dept_ids)` |
| `company` | 全公司数据 | `company_id = current_company_id` |
| `custom` | 自定义规则 | 根据配置生成 |

### 6.4.2 数据权限配置

```typescript
// permissions/data-scope.ts
export const dataScopeConfig = {
  contract: {
    // 字段映射
    ownerField: 'sales_id',        // 归属人字段
    departmentField: 'department_id', // 部门字段
    companyField: 'company_id',    // 公司字段
    
    // 范围规则
    rules: {
      self: {
        condition: 'sales_id = :currentUserId'
      },
      department: {
        condition: 'department_id = :currentDeptId'
      },
      department_and_sub: {
        condition: 'department_id IN (:subDeptIds)'
      },
      company: {
        condition: 'company_id = :companyId'
      }
    }
  }
};
```

### 6.4.3 数据权限应用

```typescript
// 在Repository中自动应用数据权限
async findMany(params: QueryParams, context: Context): Promise<QueryResult> {
  // 获取用户的数据权限范围
  const dataScope = context.getDataScope('contract');
  
  // 构建数据权限条件
  const scopeCondition = this.buildScopeCondition(dataScope, context);
  
  // 合并到查询条件
  params.filters = {
    ...params.filters,
    ...scopeCondition
  };
  
  return super.findMany(params);
}
```

---

## 6.5 权限检查

### 6.5.1 在工具中检查

```typescript
handler: async (params, context) => {
  // 检查功能权限
  await context.checkPermission('sales:contract:write');
  
  // 检查数据权限（在查询时自动应用）
  const contract = await repository.findById(params.id);
  
  // 敏感操作二次确认
  if (params.action === 'delete') {
    await context.requireConfirmation({
      message: '确定要删除此合同吗？',
      level: 'danger'
    });
  }
  
  // 执行操作...
}
```

### 6.5.2 在服务中检查

```typescript
async createContract(data: CreateContractDto, context: ServiceContext): Promise<Contract> {
  // 检查权限
  if (!context.hasPermission('sales:contract:write')) {
    throw new PermissionError('您没有创建合同的权限');
  }
  
  // 检查数据权限
  if (data.customerId) {
    const customer = await this.customerRepo.findById(data.customerId);
    if (!context.canAccess(customer, 'read')) {
      throw new PermissionError('您没有权限访问该客户');
    }
  }
  
  // 创建合同...
}
```

### 6.5.3 在UI中检查

```tsx
// 条件渲染
{hasPermission('sales:contract:delete') && (
  <Button variant="destructive">删除合同</Button>
)}

// 路由守卫
<Route
  path="/sales/contracts"
  element={
    <ProtectedRoute permission="sales:contract:read">
      <Contracts />
    </ProtectedRoute>
  }
/>
```

---

## 6.6 权限声明

### 6.6.1 在plugin.json中声明

```json
{
  "permissions": {
    "required": [
      "hr:employee:read",
      "hr:department:read"
    ],
    "optional": [
      "finance:invoice:write"
    ],
    "groups": {
      "basic": {
        "description": "基础功能权限",
        "permissions": ["hr:employee:read"]
      },
      "sensitive": {
        "description": "敏感数据权限",
        "permissions": ["finance:invoice:write"],
        "requiresApproval": true
      }
    }
  },
  
  "roles": {
    "sales-person": {
      "name": "销售员",
      "permissions": ["sales:contract:read", "sales:contract:write"]
    },
    "sales-manager": {
      "name": "销售经理",
      "permissions": ["sales:*"],
      "dataScope": "department"
    }
  }
}
```

---

## 6.7 权限审计

### 6.7.1 审计日志

```typescript
// 权限检查日志
context.auditLog({
  type: 'permission_check',
  permission: 'sales:contract:write',
  userId: context.userId,
  result: 'granted',  // granted | denied
  resource: { type: 'contract', id: 'C001' }
});

// 权限变更日志
context.auditLog({
  type: 'permission_change',
  action: 'grant',
  targetUserId: 'U001',
  role: 'sales-manager',
  operatorId: context.userId
});
```

---

## 下一步

- [第7章：生命周期规范](./07-lifecycle-spec.md)
- [第8章：质量规范](./08-quality-spec.md)
