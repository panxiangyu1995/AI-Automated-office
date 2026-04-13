# Specifications: GraphMemory Agent图记忆集成

## graphmemory-agent

### Schema

```typescript
interface GraphQueryTool {
  name: 'graph_query';
  description: string;
  parameters: {
    query: string;
    max_results: number;
  };
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/graph/agent/query | Agent查询图 |
| POST | /api/graph/agent/inject | 注入图上下文 |
