## ADDED Requirements

### Requirement: Story 2.5 UI - 权限中心界面能力基线
系统 SHALL 实现权限中心前端界面，满足 FR(FR29, FR30) 和 UX(UX-02, UX-04) 的要求。

#### Scenario: 能力基线建立
- **WHEN** 管理员访问权限中心页面时
- **THEN** 系统 MUST 展示角色列表和权限矩阵的可视化界面

### Requirement: Story 2.5 UI-1 - 创建角色管理页面
系统 MUST 实现 Create role management page 功能，支持角色的增删改查操作。

#### Scenario: Story 2.5 UI-1 验证通过
- **WHEN** 管理员在权限中心页面操作时
- **THEN** 系统 SHALL 能够正确展示和管理角色数据

### Requirement: Story 2.5 UI-2 - 构建分组权限矩阵
系统 MUST 实现 Build grouped permission matrix 功能，按模块分组展示权限列表。

#### Scenario: Story 2.5 UI-2 验证通过
- **WHEN** 管理员查看角色权限时
- **THEN** 系统 SHALL 按模块分组展示所有可用权限，支持勾选配置

### Requirement: Story 2.5 UI-3 - 展示权限来源
系统 MUST 实现 Show permission sources for a role 功能，追溯权限的来源途径。

#### Scenario: Story 2.5 UI-3 验证通过
- **WHEN** 管理员查看某权限详情时
- **THEN** 系统 SHALL 展示该权限的来源（角色继承/直接分配/部门绑定）

### Requirement: Story 2.5 UI-4 - 保存权限变更
系统 MUST 实现 Save role permission changes 功能，持久化权限配置变更。

#### Scenario: Story 2.5 UI-4 验证通过
- **WHEN** 管理员保存权限变更时
- **THEN** 系统 SHALL 调用后端 API 持久化变更，并提供操作结果反馈

---

## UI Component Specification

### PermissionCenter Page

**路由:** `/admin/permissions`

**布局结构:**
```
┌──────────────────────────────────────────────────────────────┐
│ [权限中心]                              [新建角色] [刷新]     │
├─────────────────────┬────────────────────────────────────────┤
│                     │                                        │
│  [搜索角色...]      │  角色名称: 超级管理员                  │
│                     │  角色编码: super_admin                 │
│  ▼ 基础权限 (2)     │  ──────────────────────────────────   │
│    超级管理员       │                                        │
│    普通员工         │  ┌──────────────────────────────────┐ │
│                     │  │ 权限配置                          │ │
│  ▼ 部门权限 (1)     │  │ ──────────────────────────────── │ │
│    部门管理员       │  │ ☼ 人事管理           [全选][清空] │ │
│                     │  │   ☑ 员工信息 [查看][编辑][删除]   │ │
│  ▼ 审批权限 (1)     │  │   ☑ 部门架构 [查看][编辑]         │ │
│    审批人           │  │   ☐ 考勤记录 [查看][编辑]         │ │
│                     │  │                                    │ │
│  [+ 新建角色]       │  │ ☼ 财务管理           [全选][清空] │ │
│                     │  │   ☐ 发票管理 [查看][编辑]         │ │
│                     │  │   ☐ 台账管理 [查看][编辑]         │ │
│                     │  └──────────────────────────────────┘ │
│                     │                                        │
│                     │           [重置] [保存变更]            │
└─────────────────────┴────────────────────────────────────────┘
```

### RoleList Component

**Props:**
```typescript
interface RoleListProps {
  roles: Role[];
  selectedId: string | null;
  onSelect: (roleId: string) => void;
  onCreate: () => void;
  searchPlaceholder?: string;
}
```

**交互规范:**
| 操作 | 行为 |
|------|------|
| 点击角色项 | 选中角色，加载权限数据 |
| 双击角色项 | 打开角色编辑对话框 |
| 搜索输入 | 实时过滤角色列表 |
| 点击新建角色 | 打开创建角色对话框 |

### PermissionMatrix Component

**Props:**
```typescript
interface PermissionMatrixProps {
  permissions: Permission[];
  selectedIds: string[];
  inheritedIds?: string[];  // 继承的权限（不可修改）
  onToggle: (permissionId: string) => void;
  onBatchToggle: (module: string, selected: boolean) => void;
  readOnly?: boolean;
}
```

**交互规范:**
| 操作 | 行为 |
|------|------|
| 点击复选框 | 切换单个权限选中状态 |
| 点击模块标题 | 展开/收起模块权限列表 |
| 点击"全选" | 选中当前模块所有权限 |
| 点击"清空" | 清除当前模块所有权限 |

### RoleForm Dialog

**字段定义:**
| 字段 | 类型 | 必填 | 验证规则 |
|------|------|------|---------|
| 角色名称 | text | 是 | 2-50字符 |
| 角色编码 | text | 是 | 字母数字下划线，全局唯一 |
| 权限层级 | select | 是 | base/department/approval |
| 描述 | textarea | 否 | 最多200字符 |

---

## State Management

### Zustand Store

```typescript
interface PermissionStore {
  // 状态
  roles: Role[];
  selectedRoleId: string | null;
  permissions: Permission[];
  currentRolePermissions: string[];
  pendingChanges: Record<string, boolean>;
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  
  // 计算属性
  selectedRole: Role | null;
  hasUnsavedChanges: boolean;
  permissionsByModule: Record<string, Permission[]>;
  permissionsByLayer: Record<string, Permission[]>;
  
  // Actions
  fetchRoles: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
  selectRole: (roleId: string) => void;
  togglePermission: (permissionId: string) => void;
  batchToggle: (module: string, selected: boolean) => void;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
  setSearchQuery: (query: string) => void;
  
  // CRUD Actions
  createRole: (data: CreateRoleDTO) => Promise<Role>;
  updateRole: (id: string, data: UpdateRoleDTO) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
}
```

---

## API Integration

### Hooks

```typescript
// useRoles.ts
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => permissionApi.getRoles(),
    staleTime: 5 * 60 * 1000,
  });
}

// usePermissions.ts
export function usePermissions(layer?: PermissionLayer) {
  return useQuery({
    queryKey: ['permissions', layer],
    queryFn: () => permissionApi.getPermissions(layer),
    staleTime: 10 * 60 * 1000,
  });
}

// useRolePermissions.ts
export function useRolePermissions(roleId: string | null) {
  return useQuery({
    queryKey: ['role-permissions', roleId],
    queryFn: () => permissionApi.getRolePermissions(roleId!),
    enabled: !!roleId,
  });
}

// useUpdateRolePermissions.ts
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { roleId: string; permissionIds: string[] }) =>
      permissionApi.updateRolePermissions(params.roleId, params.permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions', variables.roleId] });
    },
  });
}
```

---

## Error Handling

### 错误码映射

| 错误码 | 用户提示 | 处理方式 |
|--------|---------|---------|
| `ROLE_NOT_FOUND` | 角色不存在 | 刷新角色列表 |
| `ROLE_CODE_DUPLICATE` | 角色编码已存在 | 高亮编码字段 |
| `SYSTEM_ROLE_IMMUTABLE` | 系统角色不可修改 | 禁用编辑按钮 |
| `PERMISSION_DENIED` | 无权限执行此操作 | 显示权限不足提示 |
| `NETWORK_ERROR` | 网络错误，请稍后重试 | 显示重试按钮 |

### Toast 提示规范

| 场景 | 类型 | 消息 |
|------|------|------|
| 创建角色成功 | success | 角色 "{name}" 创建成功 |
| 更新角色成功 | success | 角色信息已更新 |
| 删除角色成功 | success | 角色 "{name}" 已删除 |
| 保存权限成功 | success | 权限配置已保存 |
| 操作失败 | error | {具体错误消息} |
| 存在未保存变更 | warning | 您有未保存的变更，是否保存？ |