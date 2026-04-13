# Design: Workspace 工作台基础架构

## Context

借鉴VSCode工作台体验，设计统一的工作入口区域。

## Goals / Non-Goals

### Goals

- [x] 实现工作台框架
- [x] 实现日清列表
- [x] 实现任务聚合
- [x] 实现布局预设

### Non-Goals

- [ ] 个性化定制（Story 18.2）

## Decisions

### 1. 数据库Schema

```sql
CREATE TABLE workspace_layouts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    layout TEXT NOT NULL, -- JSON
    is_default INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE workspace_todos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    source_module TEXT NOT NULL,
    source_id TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    status TEXT DEFAULT 'pending',
    created_at INTEGER NOT NULL,
    completed_at INTEGER
);
```

### 2. 工作台布局

```
┌─────────────────────────────────────────────────┐
│ 布局预设选择器 │ 日期 │ 快捷操作 │ 用户头像   │
├─────────────────────────────────────────────────┤
│ ┌───────────────┐ ┌─────────────────────────┐   │
│ │   日清列表    │ │      任务聚合区         │   │
│ │               │ │                         │   │
│ │ ☐ 待办1      │ │ [HR] 待审批 3件        │   │
│ │ ☐ 待办2      │ │ [财务] 待处理 2件      │   │
│ │ ☑ 已完成     │ │ [审批] 进行中 5件      │   │
│ │               │ │                         │   │
│ └───────────────┘ └─────────────────────────┘   │
├─────────────────────────────────────────────────┤
│              最近访问 / 收藏内容                  │
└─────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 多模块任务聚合性能 | 使用缓存和增量更新 |
| 布局预设冲突 | 使用乐观锁 |
