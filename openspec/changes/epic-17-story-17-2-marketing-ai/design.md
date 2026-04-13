# Design: Marketing AI文案辅助生成

## Context

利用AI能力辅助生成营销文案。

## Goals / Non-Goals

### Goals

- [x] 实现多风格文案生成
- [x] 实现社交媒体帖子生成
- [x] 实现邮件文案生成
- [x] 实现内容优化

### Non-Goals

- [ ] 数据分析（Story 17.3）

## Decisions

### 1. 文案类型

```typescript
type ContentStyle = 
  | 'professional'  // 专业正式
  | 'casual'       // 轻松随意
  | 'humorous'     // 幽默风趣
  | 'inspirational'; // 励志感人

type ContentPlatform = 
  | 'wechat'       // 微信公众号
  | 'weibo'        // 微博
  | 'email'        // 邮件
  | 'website';     // 网站

type ContentLength = 'short' | 'medium' | 'long';
```

### 2. AI Prompt设计

```typescript
const SYSTEM_PROMPT = `你是一位专业的营销文案专家。请根据用户需求生成高质量的营销文案。

风格要求：
- 专业但不晦涩
- 吸引但不夸大
- 符合品牌调性`;

function buildGeneratePrompt(req: GenerateRequest): string {
  const styleDesc = {
    professional: '专业正式',
    casual: '轻松随意',
    humorous: '幽默风趣',
    inspirational: '励志感人',
  }[req.style];
  
  const platformDesc = {
    wechat: '微信公众号',
    weibo: '微博',
    email: '邮件营销',
    website: '官网文章',
  }[req.platform];
  
  const lengthDesc = {
    short: '100-200字',
    medium: '300-500字',
    long: '800-1000字',
  }[req.length];
  
  return `请为${platformDesc}生成一篇${styleDesc}风格的文案：
  
主题：${req.topic}
${req.keywords ? `关键词：${req.keywords.join(', ')}` : ''}
长度：${lengthDesc}

请生成符合要求的文案。`;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| AI生成内容不符合品牌调性 | 提供风格选择和编辑功能 |
| 内容重复 | 提供多种变体生成 |
