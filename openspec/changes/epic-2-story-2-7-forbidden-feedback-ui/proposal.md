## Why

Epic 2 用户认证与部门权限系统需要提供统一的前端权限拒绝反馈机制。Story 2.7 Forbidden feedback UI 实现 403 页面、无权限空状态、权限守卫组件和申请入口，为用户提供友好的权限拒绝反馈体验。

本 Story 解决以下问题：
1. 如何在用户无权限时提供友好的反馈界面
2. 如何实现按钮级的权限控制（隐藏/禁用/空状态）
3. 如何引导用户申请所需权限

## What Changes

### 新增内容
- 创建 403 页面和无权限空状态组件
- 添加权限守卫组件
- 显示拒绝原因和所需权限
- 添加申请权限入口

### 需求映射
- **FR:** FR29, FR31, FR32
- **NFR:** NFR16
- **ARCH:** ADR-001
- **UX:** UX-02, UX-04

### 依赖关系
- **E2-S2.7-01** - 需要 403 响应契约数据支持

## Capabilities

### New Capabilities
- `forbidden-feedback-ui`: 提供 Story 2.7 权限拒绝反馈的前端界面，支持统一的权限拒绝展示和申请入口。

### Modified Capabilities
- 所有需要权限控制的前端组件都可使用权限守卫组件

## Impact

### 前端 React + TypeScript
- 新增 403 页面组件
- 新增无权限空状态组件
- 新增权限守卫组件
- 新增权限申请弹窗组件
- 新增全局 403 响应拦截处理

### API 依赖
- POST /api/permissions/apply - 提交权限申请

## Technical Decisions

### 权限守卫模式

```
PermissionGuard 组件支持三种模式：
1. hidden - 无权限时完全隐藏（默认）
2. disabled - 无权限时显示禁用状态
3. empty - 无权限时显示空状态占位
```

### 403 响应处理流程

```
API 返回 403 响应
     │
     ▼
全局拦截器捕获
     │
     ▼
解析响应数据（resource、required_permission、apply_entry）
     │
     ▼
显示 ForbiddenModal 弹窗
     │
     ├──► 用户点击"申请权限" → 打开 ApplyPermissionModal
     │
     └──► 用户关闭弹窗 → 返回上一页或跳转首页
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 403 弹窗频繁弹出 | 相同资源短时间内只弹出一次 |
| 权限申请流程复杂 | 简化为填写原因 + 提交 |
| 禁用状态用户困惑 | 提供 Tooltip 说明原因 |

## Migration Plan

1. 实现 ForbiddenPage 403 页面
2. 实现 NoPermissionEmpty 空状态组件
3. 实现 PermissionGuard 守卫组件
4. 实现 403 响应全局拦截
5. 实现 ForbiddenModal 弹窗
6. 实现 ApplyPermissionModal 申请弹窗
7. 进行 UI/UX 测试

## Open Questions

- 权限申请是否需要审批流程展示？
- 403 弹窗是否需要"不再提示"选项？