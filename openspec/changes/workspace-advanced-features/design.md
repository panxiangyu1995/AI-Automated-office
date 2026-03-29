# Design: workspace-advanced-features

## Context

前三阶段已完成：
- Phase 1: 工作区数据模型和 CRUD
- Phase 2: Quick Open 搜索能力
- Phase 3: 布局预设系统

本阶段实现高级功能：项目模板、工具/插件配置、成员权限管理。

**约束：**
- 依赖 Phase 1 的 workspaceStore 和成员关系
- 需复用现有工具和插件系统
- 配置需支持继承（workspace → project → user）

## Goals / Non-Goals

**Goals:**
- 实现项目模板系统
- 实现工作区级工具配置
- 实现工作区级插件配置
- 实现成员邀请和角色管理
- 实现默认入口配置

**Non-Goals：**
- 不实现细粒度字段级权限（过复杂）
- 不实现模板市场/分享
- 不实现跨租户模板迁移

## Decisions

### Decision 1: 项目模板结构

**选择：**
```typescript
interface ProjectTemplate {
  id: UUID
  workspaceId?: UUID  // null for global
  name: string
  description: string
  icon: string
  config: {
    toolConfig: JSON
    permissionScope: JSON
    initialTabs: string[]
    layoutPresetId?: UUID
  }
  createdBy: UUID
  createdAt: Date
}
```

**替代方案考虑：**
- 仅项目级模板：无法跨工作区共享
- 仅全局模板：灵活性差

**理由：**
- 支持工作区私有模板和全局共享模板

### Decision 2: 工具配置继承

**选择：**
- 继承链：平台默认 → 工作区配置 → 项目配置 → 用户覆盖
- 每层可禁用或覆盖上层配置

**理由：**
- 灵活的配置机制
- 减少重复配置

### Decision 3: 成员邀请流程

**选择：**
- 管理员输入邮箱或用户名
- 系统发送邀请或直接添加
- 成员接受后获得相应角色

**替代方案考虑：**
- 仅管理员手动添加：无法自助邀请
- 开放注册：安全风险

**理由：**
- 平衡安全性和便利性

## Risks / Trade-offs

[Risk] 模板创建复杂可能导致用户困惑
→ [Mitigation] 提供模板向导和预设模板

[Risk] 配置继承复杂可能导致预期外行为
→ [Mitigation] 提供配置可视化，明确标注继承来源

## Open Questions

1. 是否支持模板预览？
2. 是否支持模板版本？
3. 工具配置是否需要沙箱预览？
