# Specifications: Sub-Agent 运行时核心

## subagent-runtime-core

### Schema

```typescript
interface SubAgentInstance {
  id: string;
  type: string;
  status: 'idle' | 'running' | 'paused' | 'stopped';
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/subagent/create | 创建实例 |
| GET | /api/subagent/:id/status | 获取状态 |
