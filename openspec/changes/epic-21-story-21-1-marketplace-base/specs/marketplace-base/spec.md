# Specifications: Marketplace 插件市场基础架构

## marketplace-base

### Schema

```typescript
interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  rating: number;
  install_count: number;
  category: string;
  is_installed: boolean;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/marketplace/plugins | 获取插件列表 |
| GET | /api/marketplace/plugins/:id | 获取详情 |
| GET | /api/marketplace/categories | 获取分类 |
