# Design: Workspace 工作台移动端适配

## Context

提供移动端适配。

## Goals / Non-Goals

### Goals

- [x] 实现响应式布局
- [x] 优化触摸交互
- [x] 实现离线支持

### Non-Goals

- [ ] 原生App

## Decisions

### 1. 响应式断点

```css
/* 移动端优先 */
@media (min-width: 768px) { /* 平板 */ }
@media (min-width: 1024px) { /* 桌面 */ }
```

### 2. 移动端布局调整

- 日清列表：全屏模式
- 任务聚合：卡片轮播
- 快捷入口：网格布局

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 功能精简过多 | 保持核心功能可用 |
