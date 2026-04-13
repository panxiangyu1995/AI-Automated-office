# Specifications: Experience Agent行为可视化

## experience-agent-viz

### Schema

```typescript
interface AgentBehavior {
  id: string;
  session_id: string;
  thought_chain: ThoughtStep[];
  tool_calls: ToolCall[];
  final_decision: string;
  confidence: number;
}

interface ThoughtStep {
  step: number;
  thought: string;
  reasoning: string;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/experience/behavior/:session_id | 获取行为详情 |
