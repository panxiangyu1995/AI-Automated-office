# Specifications: Editor AI辅助编辑

## editor-ai-assist

### Schema

```typescript
interface AIAssistResult {
  suggestions: AISuggestion[];
  replacements: AIRepair[];
}

interface AISuggestion {
  start: number;
  end: number;
  original: string;
  suggestion: string;
  reason: string;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/editor/ai/assist | AI辅助请求 |
| POST | /api/editor/ai/rewrite | AI重写 |
