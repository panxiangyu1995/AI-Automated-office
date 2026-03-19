## Context

- **Change:** `epic-2-story-2-5-permission-center-ui`
- **Story:** Story 2.5 - 权限中心 UI
- **Capability:** `permission-center-ui`
- **需求映射:** FR(FR29, FR30), NFR(NFR16), ARCH(ADR-001), UX(UX-02, UX-04)

本设计文档定义权限中心前端界面的详细设计，包括组件结构、状态管理和交互流程。

## Goals / Non-Goals

**Goals:**
- 提供直观的角色管理界面
- 实现分组权限矩阵的可视化配置
- 支持权限来源追溯
- 实现权限变更的保存和反馈

**Non-Goals:**
- 不涉及细粒度权限配置（由 E2-S2.6-02 处理）
- 不涉及权限网关逻辑（由 E2-S2.7 处理）
- 不涉及后端 API 实现（由 E2-S2.5-01 处理）

## Architecture Design

### 组件架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    权限中心组件架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PermissionCenter (页面容器)                                    │
│  ├── Header                                                     │
│  │   ├── PageTitle                                              │
│  │   └── ActionButtons (新建角色、刷新)                         │
│  │                                                              │
│  ├── MainContent                                                │
│  │   ├── RoleListPanel (左侧)                                   │
│  │   │   ├── SearchInput                                        │
│  │   │   ├── LayerGroup (按层级分组)                            │
│  │   │   │   ├── LayerHeader                                    │
│  │   │   │   └── RoleItems                                      │
│  │   │   └── AddRoleButton                                      │
│  │   │                                                          │
│  │   └── PermissionPanel (右侧)                                 │
│  │       ├── RoleInfoCard                                       │
│  │       │   ├── RoleName, Code, Description                   │
│  │       │   └── Stats (用户数、权限数)                         │
│  │       ├── PermissionMatrix                                   │
│  │       │   ├── ModuleGroup                                    │
│  │       │   │   ├── ModuleHeader                               │
│  │       │   │   └── PermissionRows                             │
│  │       │   │       └── PermissionCheckboxes                   │
│  │       │   └── MatrixActions                                  │
│  │       └── ActionFooter                                       │
│  │           ├── SaveButton                                     │
│  │           └── ResetButton                                    │
│  │                                                              │
│  └── Dialogs                                                    │
│      ├── CreateRoleDialog                                       │
│      ├── EditRoleDialog                                         │
│      ├── DeleteConfirmDialog                                    │
│      └── PermissionSourceDialog                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 状态管理

```typescript
// stores/permissionStore.ts
interface PermissionState {
  // 角色列表
  roles: Role[];
  selectedRoleId: string | null;
  
  // 权限数据
  permissions: Permission[];
  permissionsByLayer: Record<PermissionLayer, Permission[]>;
  permissionsByModule: Record<string, Permission[]>;
  
  // 当前角色权限
  currentRolePermissions: string[];
  pendingChanges: Record<string, boolean>; // permissionId -> selected
  
  // UI 状态
  searchQuery: string;
  expandedModules: string[];
  isSaving: boolean;
  
  // Actions
  selectRole: (roleId: string) => void;
  togglePermission: (permissionId: string) => void;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
}
```

### 数据流设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    权限中心数据流                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户操作                                                       │
│     │                                                           │
│     ▼                                                           │
│  Component Event                                                │
│     │                                                           │
│     ▼                                                           │
│  Zustand Store Action                                           │
│     │                                                           │
│     ├──► 更新本地状态（即时反馈）                               │
│     │                                                           │
│     └──► 调用 API（保存变更）                                   │
│            │                                                    │
│            ▼                                                    │
│         permissionApi                                            │
│            │                                                    │
│            ▼                                                    │
│         Go Cloud Backend                                         │
│            │                                                    │
│            ▼                                                    │
│         数据库更新                                               │
│            │                                                    │
│            ▼                                                    │
│         返回结果                                                 │
│            │                                                    │
│            ▼                                                    │
│         更新 Store                                               │
│            │                                                    │
│            ▼                                                    │
│         UI 刷新                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Design

### PermissionMatrix 组件

```tsx
interface PermissionMatrixProps {
  permissions: Permission[];
  selectedIds: string[];
  onToggle: (permissionId: string) => void;
  onBatchToggle: (module: string, selected: boolean) => void;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  selectedIds,
  onToggle,
  onBatchToggle,
}) => {
  const groupedPermissions = groupByModule(permissions);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  
  return (
    <div className="permission-matrix">
      {Object.entries(groupedPermissions).map(([module, perms]) => (
        <PermissionGroup
          key={module}
          module={module}
          permissions={perms}
          selectedIds={selectedIds}
          expanded={expandedModules.includes(module)}
          onToggleExpand={() => toggleExpand(module)}
          onToggle={onToggle}
          onBatchToggle={(selected) => onBatchToggle(module, selected)}
        />
      ))}
    </div>
  );
};
```

### RoleList 组件

```tsx
interface RoleListProps {
  roles: Role[];
  selectedId: string | null;
  onSelect: (roleId: string) => void;
  onCreate: () => void;
}

const RoleList: React.FC<RoleListProps> = ({
  roles,
  selectedId,
  onSelect,
  onCreate,
}) => {
  const groupedByLayer = groupByLayer(roles);
  
  return (
    <div className="role-list">
      <div className="role-list-header">
        <SearchInput placeholder="搜索角色..." />
        <Button onClick={onCreate}>
          <Plus className="w-4 h-4" />
          新建角色
        </Button>
      </div>
      
      {Object.entries(groupedByLayer).map(([layer, layerRoles]) => (
        <div key={layer} className="role-layer-group">
          <div className="layer-header">
            <Badge variant={getLayerVariant(layer)}>
              {getLayerLabel(layer)}
            </Badge>
            <span className="count">{layerRoles.length}</span>
          </div>
          <div className="role-items">
            {layerRoles.map((role) => (
              <RoleItem
                key={role.id}
                role={role}
                selected={selectedId === role.id}
                onClick={() => onSelect(role.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### RoleInfoCard 组件

```tsx
interface RoleInfoCardProps {
  role: Role;
  userCount: number;
  permissionCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

const RoleInfoCard: React.FC<RoleInfoCardProps> = ({
  role,
  userCount,
  permissionCount,
  onEdit,
  onDelete,
}) => {
  return (
    <Card className="role-info-card">
      <CardHeader>
        <div className="role-header">
          <div>
            <CardTitle>{role.name}</CardTitle>
            <CardDescription>{role.code}</CardDescription>
          </div>
          <div className="role-actions">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
            </Button>
            {!role.is_system && (
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{role.description}</p>
        <div className="role-stats mt-4">
          <div className="stat">
            <Users className="w-4 h-4" />
            <span>{userCount} 用户</span>
          </div>
          <div className="stat">
            <Shield className="w-4 h-4" />
            <span>{permissionCount} 权限</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

## Interaction Design

### 角色选择流程

```
用户点击角色
     │
     ▼
检查是否有未保存变更
     │
     ├──► 有变更 → 弹出确认对话框
     │         │
     │         ├──► 确认保存 → 保存后切换
     │         ├──► 放弃变更 → 直接切换
     │         └──► 取消 → 保持当前
     │
     └──► 无变更 → 直接切换角色
              │
              ▼
         加载角色权限数据
              │
              ▼
         更新权限矩阵显示
```

### 权限变更保存流程

```
用户点击保存按钮
     │
     ▼
收集变更数据
     │
     ▼
显示保存中状态
     │
     ▼
调用 API 保存
     │
     ├──► 成功 → 显示成功提示
     │         │
     │         └──► 清空 pendingChanges
     │
     └──► 失败 → 显示错误提示
               │
               └──► 保留 pendingChanges（可重试）
```

## Decisions

1. **权限矩阵按模块分组折叠显示**
   - Rationale: 权限数量多，分组折叠可降低信息密度。
   - 支持展开/收起，默认全部展开。

2. **权限变更即时反馈但延迟保存**
   - Rationale: 用户可先预览变更，确认后再保存。
   - 避免频繁请求后端，支持批量保存。

3. **角色切换时检查未保存变更**
   - Rationale: 防止用户丢失未保存的变更。
   - 提供保存/放弃/取消三种选项。

4. **使用 Shadcn/ui 组件库**
   - Rationale: 遵循 UX-02 规范，保持风格一致。
   - 复用成熟组件，降低开发成本。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 权限矩阵性能问题 | 虚拟滚动、按需加载、缓存策略 |
| 变更丢失风险 | 切换前确认、自动暂存 |
| 操作复杂度高 | 提供批量操作、操作引导 |
| 权限冲突难理解 | 权限来源追溯、冲突高亮 |

## Migration Plan

1. **Phase 1: 基础结构**
   - 创建权限中心页面路由
   - 实现页面布局骨架
   - 创建 Zustand Store

2. **Phase 2: 角色管理**
   - 实现角色列表组件
   - 实现角色信息卡片
   - 实现角色创建/编辑对话框

3. **Phase 3: 权限矩阵**
   - 实现权限矩阵组件
   - 实现权限分组组件
   - 实现批量操作功能

4. **Phase 4: API 集成**
   - 集成角色管理 API
   - 集成权限查询 API
   - 实现数据缓存策略

5. **Phase 5: 测试优化**
   - 编写组件单元测试
   - 进行 E2E 测试
   - UI/UX 优化调整

## Open Questions

1. **权限预览功能**：是否需要提供权限预览功能，让管理员查看某角色的完整权限树？
2. **权限模板**：是否需要支持权限模板，快速创建相似角色？
3. **权限审计**：是否需要在权限变更时记录操作日志？