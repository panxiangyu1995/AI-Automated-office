# Specifications: Marketing 营销数据分析

## marketing-analytics

### Description

营销数据分析。

### Schema

```typescript
interface MarketingStats {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_content: number;
  total_views: number;
  total_clicks: number;
  total_conversions: number;
  total_budget: number;
  total_spend: number;
  roi: number;
  ctr: number;
  cvr: number;
}

interface TrendData {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
}

interface ChannelStats {
  channel: string;
  views: number;
  clicks: number;
  conversions: number;
  cost: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/marketing/stats/overview` | 获取总体统计 |
| GET | `/api/marketing/stats/trend` | 获取趋势数据 |
| GET | `/api/marketing/stats/channels` | 获取渠道统计 |
| GET | `/api/marketing/stats/content/:id` | 获取内容统计 |
| GET | `/api/marketing/stats/campaign/:id` | 获取活动统计 |
