# Specifications: GraphMemory 图推理引擎

## graphmemory-inference

### Schema

```typescript
interface PathResult {
  path: string[];
  length: number;
  confidence: number;
}

interface InferredRelation {
  source_id: string;
  target_id: string;
  relation: string;
  confidence: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/graph/inference/path | 路径发现 |
| POST | /api/graph/inference/relation | 关系推断 |
