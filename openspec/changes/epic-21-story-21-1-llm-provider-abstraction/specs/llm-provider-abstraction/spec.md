# Specifications: LLM Provider 抽象层

## llm-provider-abstraction

### Schema

```typescript
interface LLMProvider {
  name: string;
  endpoint: string;
  api_key: string;
  models: string[];
  is_default: boolean;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/llm/providers | 获取列表 |
| POST | /api/llm/providers | 添加Provider |
