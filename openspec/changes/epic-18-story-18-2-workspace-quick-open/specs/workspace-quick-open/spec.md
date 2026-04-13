# Specifications: Workspace 快速打开功能

## workspace-quick-open

### Schema

```typescript
interface RecentItem {
  id: string;
  type: string;
  title: string;
  url: string;
  last_opened: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workspace/recent | 获取最近列表 |
| POST | /api/workspace/search | 快速搜索 |
