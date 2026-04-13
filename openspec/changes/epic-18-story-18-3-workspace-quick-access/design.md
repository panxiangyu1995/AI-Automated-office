# Design: Workspace 工作台快捷入口管理

## Context

提供快捷入口能力。

## Goals / Non-Goals

### Goals

- [x] 实现收藏功能
- [x] 实现快速搜索
- [x] 实现快捷方式

### Non-Goals

- [ ] 完整导航系统

## Decisions

### 1. 快捷入口类型

```typescript
interface QuickAccess {
  id: string;
  type: 'favorite' | 'recent' | 'shortcut';
  name: string;
  icon?: string;
  url: string;
  order: number;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 入口过多影响体验 | 限制最大数量（如20个） |
