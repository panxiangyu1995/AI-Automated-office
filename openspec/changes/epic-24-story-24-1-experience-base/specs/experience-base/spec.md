# Specifications: Experience 体验可视化基础架构

## experience-metrics

### Schema

```typescript
interface ExperienceMetrics {
  id: string;
  session_id: string;
  response_time: number;
  token_count: number;
  tool_calls: number;
  error_count: number;
  satisfaction_score?: number;
}

interface ExperienceSummary {
  period: string;
  avg_response_time: number;
  total_sessions: number;
  error_rate: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/experience/metrics | 记录指标 |
| GET | /api/experience/summary | 获取汇总 |
