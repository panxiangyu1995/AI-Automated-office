# Specifications: Marketing AI内容生成增强

## marketing-ai-content

### Schema

```typescript
interface ContentVariant {
  id: string;
  original_id: string;
  platform: string;
  content: string;
  created_at: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/marketing/ai/variants | 生成变体 |
| POST | /api/marketing/ai/seo | SEO优化建议 |
