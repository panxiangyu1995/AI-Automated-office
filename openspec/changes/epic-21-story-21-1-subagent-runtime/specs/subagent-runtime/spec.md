# Specifications: Sub-Agent 运行时核心

## subagent-runtime

### Schema

```typescript
interface SubAgentInstance {
  id: string;
  type: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
  created_at: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/subagent/create | 创建实例 |
| GET | /api/subagent/:id/status | 获取状态 |
| POST | /api/subagent/:id/stop | 停止实例 |
