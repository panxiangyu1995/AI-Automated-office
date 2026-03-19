## ADDED Requirements

### Requirement: Story 2.6 UI - 细粒度权限配置界面能力基线
系统 SHALL 实现细粒度权限配置前端界面，满足 FR(FR31, FR32) 和 UX(UX-02, UX-04) 的要求。

#### Scenario: 能力基线建立
- **WHEN** 管理员访问细粒度权限配置页面时
- **THEN** 系统 MUST 展示用户权限覆盖、数据范围、字段权限的配置界面

### Requirement: Story 2.6 UI-1 - 创建用户权限覆盖页面
系统 MUST 实现 Create user override page 功能，支持配置用户级权限覆盖。

#### Scenario: Story 2.6 UI-1 验证通过
- **WHEN** 管理员为某用户配置权限覆盖时
- **THEN** 系统 SHALL 能够正确保存和应用权限覆盖配置

### Requirement: Story 2.6 UI-2 - 展示权限来源对比
系统 MUST 实现 Show inherited role permissions versus user overrides 功能，清晰展示权限来源。

#### Scenario: Story 2.6 UI-2 验证通过
- **WHEN** 管理员查看用户权限时
- **THEN** 系统 SHALL 对比展示角色权限、用户覆盖和最终权限

### Requirement: Story 2.6 UI-3 - 配置数据范围
系统 MUST 实现 Configure data scopes 功能，支持可视化配置数据访问范围。

#### Scenario: Story 2.6 UI-3 验证通过
- **WHEN** 管理员配置用户数据范围时
- **THEN** 系统 SHALL 提供预设选项和自定义规则配置界面

### Requirement: Story 2.6 UI-4 - 配置字段级权限
系统 MUST 实现 Configure field-level restrictions 功能，支持字段级权限配置。

#### Scenario: Story 2.6 UI-4 验证通过
- **WHEN** 管理员配置字段权限时
- **THEN** 系统 SHALL 支持字段可见/隐藏/只读/脱敏配置

---

## UI Component Specification

### FineGrainedPermissionPage

**路由:** `/admin/permissions/fine-grained`

**布局结构:**
```
┌──────────────────────────────────────────────────────────────┐
│ [搜索选择用户...]                                             │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 用户: 张三  |  部门: 销售部  |  角色: 部门管理员        │  │
│ └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ [权限覆盖配置] [数据范围配置] [字段权限配置]                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab Content Area...                                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                     [重置] [保存变更]        │
└──────────────────────────────────────────────────────────────┘
```

### PermissionOverrideTab

**交互规范:**
| 操作 | 行为 |
|------|------|
| 选择资源 | 加载该资源的权限列表和对比数据 |
| 点击"授权" | 为该权限添加授权覆盖 |
| 点击"剥夺" | 为该权限添加剥夺覆盖 |
| 点击"清除" | 移除该权限的覆盖配置 |

**权限来源对比表格:**
| 列名 | 说明 |
|------|------|
| 权限项 | 权限名称和编码 |
| 角色权限 | 显示角色来源和权限状态（✓/✗） |
| 用户覆盖 | 显示覆盖操作（授权/剥夺） |
| 最终权限 | 显示计算后的最终权限状态 |

### DataScopeTab

**数据范围类型选择:**
| 类型 | 说明 | UI 展示 |
|------|------|---------|
| 全部数据 | 可访问所有数据 | Radio 选项 |
| 仅本部门 | 仅本部门数据 | Radio 选项 |
| 本部门及下级 | 本部门及下级部门数据 | Radio 选项 |
| 仅本人 | 仅自己创建的数据 | Radio 选项 |
| 自定义 | 自定义规则 | Radio 选项 + 规则编辑器 |

**自定义规则编辑器:**
```
┌────────────────────────────────────────────────────────────┐
│ 条件 1:                                      [+ 添加条件]  │
│ ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐│
│ │ 部门     │ │ 等于     │ │ [选择部门...]              ││
│ └──────────┘ └──────────┘ └──────────────────────────────┘│
│                                                            │
│ 条件 2:                                                    │
│ ┌──────────┐ ┌──────────┐ ┌──────────────────────────────┐│
│ │ 状态     │ │ 不等于   │ │ 已删除                       ││
│ └──────────┘ └──────────┘ └──────────────────────────────┘│
│                                                            │
│ 逻辑关系: ○ 且(AND)  ○ 或(OR)                              │
└────────────────────────────────────────────────────────────┘
```

### FieldPermissionTab

**字段权限表格:**
| 列名 | 说明 |
|------|------|
| 字段名 | 字段编码（数据库字段名） |
| 显示名称 | 字段的中文显示名称 |
| 权限设置 | 下拉选择：可见/隐藏/只读/脱敏 |
| 脱敏规则 | 仅当选择"脱敏"时显示，选择脱敏类型 |

**批量操作:**
- 按字段类型批量设置（如所有金额字段）
- 全部设为可见
- 全部设为只读

---

## State Management

### Zustand Store

```typescript
interface FineGrainedPermissionState {
  // 当前用户
  selectedUserId: string | null;
  userSummary: {
    name: string;
    department: string;
    roles: string[];
  } | null;
  
  // 权限覆盖
  rolePermissions: Record<string, { has: boolean; source: string }>;
  currentOverrides: PermissionOverride[];
  pendingOverrides: PermissionOverride[];
  
  // 数据范围
  currentDataScopes: Record<string, DataScope>;
  pendingDataScopes: Record<string, DataScope>;
  
  // 字段权限
  currentFieldRestrictions: Record<string, Record<string, FieldRestriction>>;
  pendingFieldRestrictions: Record<string, Record<string, FieldRestriction>>;
  
  // UI 状态
  activeTab: 'override' | 'datascope' | 'field';
  selectedResource: string | null;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions
  selectUser: (userId: string) => Promise<void>;
  selectResource: (resource: string) => void;
  setActiveTab: (tab: string) => void;
  
  // 权限覆盖
  toggleOverride: (resource: string, permissionId: string, type: 'grant' | 'deny' | 'none') => void;
  
  // 数据范围
  updateDataScope: (resource: string, scope: DataScope) => void;
  
  // 字段权限
  updateFieldRestriction: (resource: string, field: string, restriction: FieldRestriction) => void;
  batchUpdateFieldRestrictions: (resource: string, fields: string[], restriction: FieldRestriction) => void;
  
  // 保存和重置
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
}
```

---

## API Integration

### Hooks

```typescript
// useUserPermissions.ts
export function useUserPermissions(userId: string | null) {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => permissionApi.getUserPermissionResult(userId!),
    enabled: !!userId,
  });
}

// useUserOverrides.ts
export function useUserOverrides(userId: string | null) {
  return useQuery({
    queryKey: ['user-overrides', userId],
    queryFn: () => permissionApi.getUserOverrides(userId!),
    enabled: !!userId,
  });
}

// useUpdateUserOverrides.ts
export function useUpdateUserOverrides() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { userId: string; overrides: PermissionOverride[] }) =>
      permissionApi.updateUserOverrides(params.userId, params.overrides),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-overrides', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['user-permissions', variables.userId] });
    },
  });
}
```

---

## Error Handling

### 错误码映射

| 错误码 | 用户提示 | 处理方式 |
|--------|---------|---------|
| `USER_NOT_FOUND` | 用户不存在 | 刷新用户列表 |
| `OVERRIDE_NOT_FOUND` | 权限覆盖不存在 | 刷新权限数据 |
| `INVALID_DATA_SCOPE` | 无效的数据范围配置 | 高亮错误字段 |
| `PERMISSION_DENIED` | 无权限执行此操作 | 显示权限不足提示 |
| `NETWORK_ERROR` | 网络错误，请稍后重试 | 显示重试按钮 |

### Toast 提示规范

| 场景 | 类型 | 消息 |
|------|------|------|
| 保存成功 | success | 权限配置已保存 |
| 保存失败 | error | {具体错误消息} |
| 存在未保存变更 | warning | 您有未保存的变更，是否保存？ |
| 权限剥夺警告 | warning | 剥夺权限将影响用户操作，确认继续？ |