## Why

Epic 2 用户认证与部门权限系统需要提供可视化的权限管理界面。Story 2.5 Permission Center UI 为管理员提供直观的角色管理和权限配置界面，实现 FR29（按部门分配用户权限）和 FR30（部门权限模型）的前端交互需求。

本 Story 解决以下问题：
1. 如何让管理员直观地管理角色和权限
2. 如何展示复杂的三层权限模型
3. 如何实现权限的批量配置和分配

## What Changes

### 新增内容
- 创建角色管理页面
- 构建分组权限矩阵组件
- 实现权限来源追溯功能
- 实现权限变更保存功能

### 需求映射
- **FR:** FR29, FR30
- **NFR:** NFR16
- **ARCH:** ADR-001
- **UX:** UX-02, UX-04

### 依赖关系
- **E2-S2.5-01** - 需要三层权限模型的数据支持
- **E2-S2.1-03** - 需要前端认证状态管理

## Capabilities

### New Capabilities
- `permission-center-ui`: 提供 Story 2.5 权限中心的前端界面，支持角色管理和权限配置的可视化操作。

### Modified Capabilities
- 无（新增 Capability，不修改现有功能）

## Impact

### 前端 React + TypeScript
- 新增权限中心页面组件
- 新增权限矩阵组件
- 新增角色列表组件
- 新增权限 API 集成

### 依赖 API
- GET /api/admin/roles - 获取角色列表
- POST /api/admin/roles - 创建角色
- PUT /api/admin/roles/:id - 更新角色
- DELETE /api/admin/roles/:id - 删除角色
- GET /api/admin/permissions - 获取权限列表
- PUT /api/admin/roles/:id/permissions - 更新角色权限
- GET /api/admin/users/:id/roles - 获取用户角色
- PUT /api/admin/users/:id/roles - 更新用户角色

### 依赖关系
- 依赖 E2-S2.5-01 完成权限模型定义
- 为 E2-S2.6-02 细粒度权限 UI 提供基础

## Technical Decisions

### 组件架构

```
src/features/permission/
├── components/
│   ├── PermissionCenter.tsx      # 权限中心主页面
│   ├── RoleList.tsx              # 角色列表组件
│   ├── RoleCard.tsx              # 角色信息卡片
│   ├── PermissionMatrix.tsx      # 权限矩阵组件
│   ├── PermissionGroup.tsx       # 权限分组组件
│   ├── UserRoleAssign.tsx        # 用户角色分配组件
│   └── RoleForm.tsx              # 角色创建/编辑表单
├── hooks/
│   ├── useRoles.ts               # 角色数据 Hook
│   ├── usePermissions.ts         # 权限数据 Hook
│   └── useRolePermissions.ts     # 角色权限 Hook
├── types/
│   └── permission.types.ts       # 权限相关类型
└── api/
    └── permissionApi.ts          # 权限 API 封装
```

### 状态管理
- 使用 Zustand 管理权限中心状态
- 权限矩阵选中状态本地管理
- 角色数据通过 React Query 缓存

### UI 组件选择
- 使用 Shadcn/ui 的 Table、Card、Dialog、Checkbox 组件
- 使用 Lucide React 图标
- 遵循 UX-04 深蓝色系配色

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 权限矩阵过于复杂 | 按模块分组折叠，支持搜索过滤 |
| 权限变更频繁 | 提供批量操作，操作确认提示 |
| 性能问题 | 虚拟滚动、分页加载、缓存策略 |
| 权限冲突难以理解 | 提供权限来源追溯，高亮冲突项 |

## Migration Plan

1. 创建权限中心页面基础结构
2. 实现角色列表和角色卡片组件
3. 实现权限矩阵组件（核心功能）
4. 集成后端 API 进行数据交互
5. 添加权限来源追溯功能
6. 进行 UI/UX 测试和优化

## Open Questions

- 权限矩阵是否支持拖拽批量选择？
- 是否需要权限变更历史记录？
- 权限冲突如何可视化展示？