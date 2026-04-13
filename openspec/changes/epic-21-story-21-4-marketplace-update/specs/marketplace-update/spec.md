# Specifications: Marketplace 插件更新与版本管理

## marketplace-update

### Schema

```typescript
interface PluginUpdate {
  plugin_id: string;
  current_version: string;
  latest_version: string;
  changelog: string;
  is_compatible: boolean;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/marketplace/plugins/updates | 检测更新 |
| POST | /api/marketplace/plugins/:id/update | 执行更新 |
