# Design: Workspace 工作台通知与提醒

## Context

聚合各模块通知，提供统一提醒。

## Goals / Non-Goals

### Goals

- [x] 实现通知聚合
- [x] 实现提醒设置
- [x] 实现未读管理

### Non-Goals

- [ ] 通知推送

## Decisions

### 1. 通知类型

```typescript
interface WorkspaceNotification {
  id: string;
  type: 'approval' | 'message' | 'mention' | 'system';
  title: string;
  content: string;
  source_module: string;
  source_id: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: number;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 通知过多 | 实现免打扰时段 |
