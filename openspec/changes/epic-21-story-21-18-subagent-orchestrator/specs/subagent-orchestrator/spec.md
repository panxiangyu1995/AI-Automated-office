# Specifications: Sub-Agent 编排器

## subagent-orchestrator

### Schema

```typescript
interface OrchestrationTask {
  id: string;
  parent_task: string;
  sub_tasks: string[];
  status: 'pending' | 'running' | 'completed';
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/orchestrator/decompose | 分解任务 |
| GET | /api/orchestrator/:id/status | 获取状态 |
