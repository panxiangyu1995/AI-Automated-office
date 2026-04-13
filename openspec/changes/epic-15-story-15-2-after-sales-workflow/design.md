# Design: After-sales 售后工单流程管理

## Context

在Story 15.1基础架构上，实现完整的工单处理流程。

## Goals / Non-Goals

**Goals:**
- 实现自动分配逻辑
- 实现处理记录和时间线
- 实现工单回访
- 实现统计面板

**Non-Goals:**
- 不实现AI辅助（Story 15.3）

## Decisions

### 1. 自动分配策略

根据工单类型和人员专长进行智能分配：
- 维修类 → 有维修专长的空闲人员
- 投诉类 → 经验丰富人员
- 咨询类 → 按负载均衡分配

### 2. 处理记录设计

```typescript
interface ProcessingRecord {
  id: string;
  ticket_id: string;
  operator_id: string;
  operator_name: string;
  action: string;
  content: string;
  attachments?: string[];
  created_at: number;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 分配逻辑复杂 | 采用规则引擎模式，便于扩展 |
