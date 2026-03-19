## Why

Epic 2 用户认证与部门权限系统需要提供细粒度权限配置的可视化界面。Story 2.6 Fine-grained permission UI 为管理员提供用户级权限覆盖、数据范围配置、字段级权限配置的前端界面，实现 FR31（细粒度权限到个人级别）和 FR32（数据访问权限部门级/个人级）的前端交互需求。

本 Story 解决以下问题：
1. 如何让管理员直观地配置用户级权限覆盖
2. 如何展示权限来源对比（角色权限 vs 用户覆盖）
3. 如何配置数据范围和字段级权限

## What Changes

### 新增内容
- 创建用户权限覆盖配置页面
- 实现权限来源对比展示组件
- 实现数据范围配置组件
- 实现字段权限配置组件

### 需求映射
- **FR:** FR31, FR32
- **NFR:** NFR16
- **ARCH:** ADR-001
- **UX:** UX-02, UX-04

### 依赖关系
- **E2-S2.6-01** - 需要细粒度权限覆盖数据支持
- **E2-S2.5-02** - 需要权限中心 UI 作为基础

## Capabilities

### New Capabilities
- `fine-grained-permission-ui`: 提供 Story 2.6 细粒度权限配置的前端界面，支持用户级权限覆盖、数据范围配置、字段级权限配置的可视化操作。

### Modified Capabilities
- `permission-center-ui` (E2-S2.5-02): 可从用户管理跳转到细粒度权限配置

## Impact

### 前端 React + TypeScript
- 新增细粒度权限配置页面组件
- 新增权限来源对比组件
- 新增数据范围配置组件
- 新增字段权限配置组件

### 依赖 API
- GET /api/admin/users/:id/permission-overrides - 获取用户权限覆盖
- PUT /api/admin/users/:id/permission-overrides - 更新用户权限覆盖
- GET /api/admin/users/:id/permissions - 获取用户完整权限结果
- GET /api/admin/resources - 获取资源列表

## Technical Decisions

### 组件架构

```
src/features/permission/
├── components/
│   ├── FineGrainedPermissionPage.tsx    # 细粒度权限配置主页面
│   ├── UserSelector.tsx                 # 用户选择器
│   ├── PermissionOverrideTab.tsx        # 权限覆盖配置 Tab
│   ├── DataScopeTab.tsx                 # 数据范围配置 Tab
│   ├── FieldPermissionTab.tsx           # 字段权限配置 Tab
│   ├── PermissionSourceCompare.tsx      # 权限来源对比组件
│   ├── DataScopeEditor.tsx              # 数据范围编辑器
│   ├── CustomRuleEditor.tsx             # 自定义规则编辑器
│   └── FieldRestrictionEditor.tsx       # 字段限制编辑器
├── hooks/
│   ├── useUserPermissions.ts            # 用户权限 Hook
│   └── usePermissionOverrides.ts        # 权限覆盖 Hook
└── types/
    └── fine-grained.types.ts            # 细粒度权限类型
```

### Tab 组织方式
采用 Tab 切换方式组织三种配置：
1. 权限覆盖配置 - 配置用户额外的授权或剥夺
2. 数据范围配置 - 配置用户可访问的数据范围
3. 字段权限配置 - 配置字段级的显示/隐藏/只读

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 配置界面复杂 | 分 Tab 组织，逐步引导 |
| 权限来源难理解 | 提供对比视图，颜色区分来源 |
| 自定义规则难配置 | 提供可视化规则构建器 |
| 配置错误影响大 | 提供预览和确认机制 |

## Migration Plan

1. 创建细粒度权限配置页面基础结构
2. 实现用户选择器和基本信息展示
3. 实现权限覆盖配置 Tab
4. 实现数据范围配置 Tab
5. 实现字段权限配置 Tab
6. 集成后端 API 进行数据交互
7. 进行 UI/UX 测试和优化

## Open Questions

- 自定义规则是否需要提供可视化构建器？
- 是否需要提供权限配置预览功能？
- 是否需要记录权限配置变更历史？