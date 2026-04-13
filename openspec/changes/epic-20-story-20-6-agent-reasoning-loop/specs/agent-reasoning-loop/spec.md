# Specifications: Agent 推理循环

## agent-reasoning-loop

### Schema

```typescript
interface ReasoningStep {
  step: number;
  thought: string;
  action?: string;
  result?: any;
  confidence: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/agent/reason | 执行推理 |
| GET | /api/agent/reason/:id/steps | 获取推理步骤 |
