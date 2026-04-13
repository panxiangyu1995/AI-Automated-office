# Specifications: Connectors 数据同步管理

## connector-sync

### Schema

```typescript
interface SyncTask {
  id: string;
  connector_id: string;
  direction: 'push' | 'pull' | 'bidirectional';
  schedule: string;
  status: 'idle' | 'running' | 'paused' | 'error';
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/connectors/sync/tasks | 创建任务 |
| GET | /api/connectors/sync/tasks | 获取任务列表 |
| POST | /api/connectors/sync/tasks/:id/run | 执行同步 |
