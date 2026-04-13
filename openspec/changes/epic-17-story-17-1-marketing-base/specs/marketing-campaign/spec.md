# Specifications: Marketing 市场宣传模块基础架构

## marketing-campaign

### Description

营销活动管理，支持活动创建、执行追踪。

### Schema

```typescript
interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: 'online' | 'offline' | 'hybrid';
  status: CampaignStatus;
  start_date: string;
  end_date?: string;
  budget: number;
  channels: string[];
  content_ids: string[];
  stats: CampaignStats;
  tenant_id: string;
  created_at: number;
  updated_at: number;
}

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

interface CampaignStats {
  views: number;
  clicks: number;
  conversions: number;
  cost: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/marketing/campaigns` | 创建活动 |
| GET | `/api/marketing/campaigns` | 查询活动列表 |
| GET | `/api/marketing/campaigns/:id` | 获取活动详情 |
| PUT | `/api/marketing/campaigns/:id` | 更新活动 |
| PUT | `/api/marketing/campaigns/:id/status` | 更新状态 |
| DELETE | `/api/marketing/campaigns/:id` | 删除活动 |

## marketing-content

### Description

营销内容管理，支持内容创建、审批。

### Schema

```typescript
interface MarketingContent {
  id: string;
  title: string;
  body: string;
  type: ContentType;
  status: ContentStatus;
  campaign_id?: string;
  author_id: string;
  author_name: string;
  tags: string[];
  attachments: string[];
  published_at?: number;
  tenant_id: string;
  created_at: number;
  updated_at: number;
}

type ContentType = 'article' | 'social_post' | 'email' | 'video_script';
type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected';
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/marketing/contents` | 创建内容 |
| GET | `/api/marketing/contents` | 查询内容列表 |
| GET | `/api/marketing/contents/:id` | 获取内容详情 |
| PUT | `/api/marketing/contents/:id` | 更新内容 |
| DELETE | `/api/marketing/contents/:id` | 删除内容 |
| POST | `/api/marketing/contents/:id/submit` | 提交审批 |
