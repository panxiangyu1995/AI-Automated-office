# Specifications: Experience 体验优化建议

## experience-optimize

### Schema

```typescript
interface OptimizationSuggestion {
  id: string;
  category: 'performance' | 'usability' | 'ai_quality';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable_steps: string[];
  status: 'new' | 'implemented' | 'dismissed';
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/experience/suggestions | 获取优化建议 |
| POST | /api/experience/suggestions/:id/implement | 标记已实施 |
