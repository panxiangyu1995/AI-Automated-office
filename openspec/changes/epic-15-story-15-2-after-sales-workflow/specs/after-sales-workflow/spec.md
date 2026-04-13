# Specifications: After-sales 售后工单流程管理

## after-sales-workflow

### Description

工单流程管理，支持自动分配、处理记录、回访。

### Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR221 | 用户可以分配工单给处理人 | MUST |
| FR222 | 处理人可以更新工单状态和处理记录 | MUST |
| FR224 | 用户可以查看工单面板和统计数据 | MUST |
| FR225 | 用户可以管理客户回访记录 | MUST |

### Schema

```typescript
interface ProcessingRecord {
  id: string;
  ticket_id: string;
  operator_id: string;
  operator_name: string;
  action: 'created' | 'assigned' | 'processing' | 'comment' | 'callback' | 'completed' | 'cancelled';
  content: string;
  attachments?: string[];
  created_at: number;
}

interface CallbackRecord {
  id: string;
  ticket_id: string;
  callback_type: 'auto' | 'manual';
  callback_time: number;
  callback_result: 'satisfied' | 'unsatisfied' | 'pending';
  feedback?: string;
  created_at: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/service/tickets/:id/records | 添加处理记录 |
| GET | /api/service/tickets/:id/records | 获取处理记录列表 |
| POST | /api/service/tickets/:id/callback | 添加回访记录 |
| GET | /api/service/tickets/:id/callback | 获取回访记录 |
| POST | /api/service/tickets/:id/auto-assign | 自动分配工单 |
