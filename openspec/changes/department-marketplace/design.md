# Design: 部门市场基础

## 数据模型

```typescript
interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  version: string;
  publisher: string;
  rating: number;
  installCount: number;
  tags: string[];
  screenshots: string[];
  price: number;
  category: string;
}
```

## API 设计
```typescript
GET    /api/marketplace/items           // 列表
GET    /api/marketplace/items/:id      // 详情
POST   /api/marketplace/items/:id/install  // 安装
POST   /api/marketplace/items/:id/uninstall  // 卸载
```
