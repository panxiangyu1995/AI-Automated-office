# Design: After-sales 知识库集成

## Context

利用知识库RAG能力，实现维修经验的积累和复用。

## Goals / Non-Goals

**Goals:**
- 工单完成后自动提取经验摘要
- 提交知识审核
- 关联常见问题到知识库

**Non-Goals:**
- 不实现知识库基础能力（已存在）

## Decisions

### 1. 经验提取时机

工单完成后弹出知识贡献引导：
- 用户可选择"保存到知识库"
- 系统自动提取处理摘要
- 提交审核流程

### 2. 知识贡献模板

```typescript
interface KnowledgeContribution {
  title: string; // "产品X维修-问题Y解决方案"
  content: string; // 处理过程摘要
  category: "维修经验";
  tags: string[]; // 产品型号、问题类型
  source_ticket_id: string;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 知识质量参差不齐 | 强制审核流程 |
