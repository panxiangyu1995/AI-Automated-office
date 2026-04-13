# Specifications: Marketplace 插件发布管理

## marketplace-publish

### Schema

```typescript
interface PluginVersion {
  id: string;
  plugin_id: string;
  version: string;
  changelog: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/marketplace/developer/plugins | 创建插件 |
| POST | /api/marketplace/developer/plugins/:id/versions | 发布版本 |
