# Specifications: Marketing AI文案辅助生成

## marketing-ai-generate

### Description

AI文案辅助生成。

### Schema

```typescript
interface GenerateRequest {
  topic: string;
  type: ContentType;
  platform: ContentPlatform;
  style: ContentStyle;
  length: ContentLength;
  keywords?: string[];
}

interface GenerateResponse {
  content: string;
  alternatives: string[];
  suggestions: string[];
}

type ContentStyle = 'professional' | 'casual' | 'humorous' | 'inspirational';
type ContentPlatform = 'wechat' | 'weibo' | 'email' | 'website';
type ContentLength = 'short' | 'medium' | 'long';
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/marketing/ai/generate` | AI生成文案 |
| POST | `/api/marketing/ai/optimize` | AI优化文案 |
| POST | `/api/marketing/ai/variations` | 生成多个版本 |
