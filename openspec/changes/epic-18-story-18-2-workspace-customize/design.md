# Design: Workspace 工作台个性化定制

## Context

提供工作台个性化定制能力。

## Goals / Non-Goals

### Goals

- [x] 实现组件拖拽排序
- [x] 实现快捷方式配置
- [x] 实现主题适配

### Non-Goals

- [ ] 完全自定义面板

## Decisions

### 1. 配置结构

```typescript
interface WorkspaceConfig {
  user_id: string;
  layout: WorkspaceLayout;
  shortcuts: ShortcutConfig[];
  theme: 'light' | 'dark' | 'auto';
  widget_positions: Record<string, number>;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 布局保存冲突 | 使用乐观锁或时间戳合并 |
