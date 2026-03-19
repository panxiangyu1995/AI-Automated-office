## Context

- **Change:** `epic-2-story-2-6-fine-grained-ui`
- **Story:** Story 2.6 - 细粒度权限 UI
- **Capability:** `fine-grained-permission-ui`
- **需求映射:** FR(FR31, FR32), NFR(NFR16), ARCH(ADR-001), UX(UX-02, UX-04)

本设计文档定义细粒度权限配置前端界面的详细设计，包括组件结构、状态管理和交互流程。

## Goals / Non-Goals

**Goals:**
- 提供直观的用户权限覆盖配置界面
- 实现权限来源对比的可视化展示
- 支持数据范围的可视化配置
- 支持字段级权限的配置

**Non-Goals:**
- 不涉及权限计算逻辑（由 E2-S2.6-01 处理）
- 不涉及权限网关（由 E2-S2.7 处理）
- 不涉及后端 API 实现

## Architecture Design

### 页面组件架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    细粒度权限配置组件架构                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FineGrainedPermissionPage (页面容器)                           │
│  ├── Header                                                     │
│  │   ├── UserSelector (用户选择器)                              │
│  │   └── UserSummary (用户权限摘要)                             │
│  │                                                              │
│  ├── MainContent (Tab 容器)                                     │
│  │   ├── PermissionOverrideTab                                  │
│  │   │   ├── ResourceList (资源列表)                            │
│  │   │   ├── PermissionSourceCompare (权限来源对比)             │
│  │   │   └── OverrideActions (覆盖操作按钮)                     │
│  │   │                                                          │
│  │   ├── DataScopeTab                                           │
│  │   │   ├── ResourceSelector (资源选择)                        │
│  │   │   ├── ScopeTypeSelector (范围类型选择)                   │
│  │   │   ├── DepartmentTreeSelector (部门树选择器)              │
│  │   │   └── CustomRuleEditor (自定义规则编辑器)                │
│  │   │                                                          │
│  │   └── FieldPermissionTab                                     │
│  │       ├── ResourceSelector (资源选择)                        │
│  │       ├── FieldList (字段列表)                               │
│  │       └── FieldRestrictionEditor (字段限制编辑器)            │
│  │                                                              │
│  └── Footer                                                     │
│      ├── ResetButton                                            │
│      └── SaveButton                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 状态管理

```typescript
// stores/fineGrainedPermissionStore.ts
interface FineGrainedPermissionState {
  // 当前用户
  selectedUserId: string | null;
  userSummary: UserPermissionSummary | null;
  
  // 权限覆盖
  rolePermissions: Record<string, boolean>;
  overrides: PermissionOverride[];
  pendingOverrides: PermissionOverride[];
  
  // 数据范围
  dataScopes: Record<string, DataScope>;
  pendingDataScopes: Record<string, DataScope>;
  
  // 字段权限
  fieldRestrictions: Record<string, FieldRestrictions>;
  pendingFieldRestrictions: Record<string, FieldRestrictions>;
  
  // UI 状态
  activeTab: 'override' | 'datascope' | 'field';
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  
  // Actions
  selectUser: (userId: string) => void;
  toggleOverride: (resource: string, permissionId: string, type: 'grant' | 'deny') => void;
  updateDataScope: (resource: string, scope: DataScope) => void;
  updateFieldRestriction: (resource: string, field: string, restriction: FieldRestriction) => void;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
}
```

## Component Design

### UserSelector 组件

```tsx
interface UserSelectorProps {
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
}

const UserSelector: React.FC<UserSelectorProps> = ({ selectedUserId, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: users, isLoading } = useUserSearch(searchQuery);
  
  return (
    <div className="user-selector">
      <Combobox
        value={selectedUserId}
        onChange={onSelect}
        onSearch={setSearchQuery}
        placeholder="搜索用户..."
      >
        {users?.map((user) => (
          <ComboboxOption key={user.id} value={user.id}>
            <Avatar src={user.avatar} size="sm" />
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.department}</div>
            </div>
          </ComboboxOption>
        ))}
      </Combobox>
    </div>
  );
};
```

### PermissionSourceCompare 组件

```tsx
interface PermissionSourceCompareProps {
  resource: string;
  rolePermissions: Record<string, { has: boolean; source: string }>;
  overrides: Record<string, { type: 'grant' | 'deny' }>;
  finalPermissions: Record<string, boolean>;
  onToggleOverride: (permissionId: string, type: 'grant' | 'deny' | 'none') => void;
}

const PermissionSourceCompare: React.FC<PermissionSourceCompareProps> = ({
  resource,
  rolePermissions,
  overrides,
  finalPermissions,
  onToggleOverride,
}) => {
  return (
    <div className="permission-source-compare">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>权限项</TableHead>
            <TableHead>角色权限</TableHead>
            <TableHead>用户覆盖</TableHead>
            <TableHead>最终权限</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(rolePermissions).map(([permId, rolePerm]) => {
            const override = overrides[permId];
            const final = finalPermissions[permId];
            
            return (
              <TableRow key={permId}>
                <TableCell>{permId}</TableCell>
                <TableCell>
                  <Badge variant={rolePerm.has ? 'success' : 'secondary'}>
                    {rolePerm.has ? '✓' : '✗'} {rolePerm.source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={override?.type === 'grant' ? 'default' : 'outline'}
                      onClick={() => onToggleOverride(permId, override?.type === 'grant' ? 'none' : 'grant')}
                    >
                      授权
                    </Button>
                    <Button
                      size="sm"
                      variant={override?.type === 'deny' ? 'destructive' : 'outline'}
                      onClick={() => onToggleOverride(permId, override?.type === 'deny' ? 'none' : 'deny')}
                    >
                      剥夺
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={final ? 'success' : 'destructive'}>
                    {final ? '✓ 有权限' : '✗ 无权限'}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
```

### DataScopeEditor 组件

```tsx
interface DataScopeEditorProps {
  scope: DataScope;
  onChange: (scope: DataScope) => void;
  departments: Department[];
}

const DataScopeEditor: React.FC<DataScopeEditorProps> = ({
  scope,
  onChange,
  departments,
}) => {
  return (
    <div className="data-scope-editor">
      <RadioGroup
        value={scope.type}
        onValueChange={(type) => onChange({ type: type as DataScopeType, rule: null })}
      >
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">全部数据</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="department" id="department" />
            <Label htmlFor="department">仅本部门</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="department_tree" id="department_tree" />
            <Label htmlFor="department_tree">本部门及下级</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="self" id="self" />
            <Label htmlFor="self">仅本人数据</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">自定义规则</Label>
          </div>
        </div>
      </RadioGroup>
      
      {scope.type === 'custom' && (
        <CustomRuleEditor
          rule={scope.rule}
          onChange={(rule) => onChange({ ...scope, rule })}
        />
      )}
    </div>
  );
};
```

### FieldRestrictionEditor 组件

```tsx
interface FieldRestrictionEditorProps {
  fields: FieldDefinition[];
  restrictions: Record<string, FieldRestriction>;
  onChange: (field: string, restriction: FieldRestriction) => void;
}

const FieldRestrictionEditor: React.FC<FieldRestrictionEditorProps> = ({
  fields,
  restrictions,
  onChange,
}) => {
  return (
    <div className="field-restriction-editor">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>字段名</TableHead>
            <TableHead>显示名称</TableHead>
            <TableHead>权限设置</TableHead>
            <TableHead>脱敏规则</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field) => {
            const restriction = restrictions[field.name] || { mode: 'visible' };
            
            return (
              <TableRow key={field.name}>
                <TableCell className="font-mono">{field.name}</TableCell>
                <TableCell>{field.label}</TableCell>
                <TableCell>
                  <Select
                    value={restriction.mode}
                    onValueChange={(mode) => onChange(field.name, { ...restriction, mode })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visible">可见</SelectItem>
                      <SelectItem value="hidden">隐藏</SelectItem>
                      <SelectItem value="readonly">只读</SelectItem>
                      <SelectItem value="masked">脱敏</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {restriction.mode === 'masked' && (
                    <Select
                      value={restriction.maskRule || 'phone'}
                      onValueChange={(maskRule) => onChange(field.name, { ...restriction, maskRule })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">手机号</SelectItem>
                        <SelectItem value="email">邮箱</SelectItem>
                        <SelectItem value="idcard">身份证</SelectItem>
                        <SelectItem value="bankcard">银行卡</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
```

## Interaction Design

### 用户选择流程

```
用户点击用户选择器
     │
     ▼
输入搜索关键词
     │
     ▼
显示匹配用户列表
     │
     ▼
选择用户
     │
     ▼
检查是否有未保存变更
     │
     ├──► 有变更 → 弹出确认对话框
     │         │
     │         ├──► 确认切换 → 放弃变更并加载新用户
     │         └──► 取消 → 保持当前用户
     │
     └──► 无变更 → 加载新用户权限数据
              │
              ▼
         更新页面内容
```

### 配置保存流程

```
用户点击保存按钮
     │
     ▼
收集变更数据（覆盖/数据范围/字段权限）
     │
     ▼
显示确认对话框（展示变更摘要）
     │
     ▼
用户确认
     │
     ▼
调用 API 保存
     │
     ├──► 成功 → 显示成功提示，清空 pending 状态
     │
     └──► 失败 → 显示错误提示，保留 pending 状态
```

## Decisions

1. **采用 Tab 组织三种配置**
   - Rationale: 降低单页面信息密度，引导用户逐步配置。
   - Tab 间共享用户选择状态。

2. **权限来源对比使用表格形式**
   - Rationale: 清晰展示角色权限、覆盖、最终权限三列对比。
   - 使用颜色区分授权/剥夺状态。

3. **数据范围提供预设选项 + 自定义**
   - Rationale: 预设选项覆盖常见场景，自定义满足特殊需求。
   - 自定义规则提供可视化构建器。

4. **字段权限批量配置**
   - Rationale: 字段数量多，批量操作提高效率。
   - 支持按字段类型批量设置（如所有金额字段设置只读）。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 配置界面复杂 | Tab 组织，引导提示 |
| 权限来源难理解 | 对比视图，颜色区分 |
| 自定义规则难配置 | 可视化构建器，预置模板 |
| 配置错误影响大 | 预览确认，变更摘要 |

## Migration Plan

1. 创建页面基础结构和路由
2. 实现用户选择器组件
3. 实现权限覆盖配置 Tab
4. 实现数据范围配置 Tab
5. 实现字段权限配置 Tab
6. 集成后端 API
7. 进行 UI/UX 测试和优化

## Open Questions

1. 是否需要提供权限配置预览功能？
2. 自定义规则构建器的复杂度如何控制？
3. 是否需要支持配置模板导入导出？