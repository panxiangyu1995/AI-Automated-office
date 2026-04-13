# Specifications: GraphMemory 图记忆基础架构

## graphmemory-core

### Schema

```typescript
interface GraphNode {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
  created_at: number;
}

interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  relation: string;
  properties: Record<string, any>;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/graph/nodes | 创建节点 |
| GET | /api/graph/nodes | 获取节点列表 |
| POST | /api/graph/edges | 创建边 |
| GET | /api/graph/traverse | 图遍历 |
