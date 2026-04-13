# Specifications: After-sales 知识库集成

## after-sales-knowledge

### Description

维修经验自动保存到知识库。

### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR223 | 用户可以将维修经验保存到知识库 | MUST |

### Schema

```typescript
interface KnowledgeContribution {
  title: string;
  content: string;
  category: string;
  tags: string[];
  source_ticket_id: string;
  contributor_id: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected';
  review_comment?: string;
  created_at: number;
  reviewed_at?: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/service/knowledge/contribute | 提交知识贡献 |
| GET | /api/service/knowledge/contributions | 获取贡献列表 |
| POST | /api/service/knowledge/extract | 从工单提取知识 |
