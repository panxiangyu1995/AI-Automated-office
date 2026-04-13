# Specifications: Connectors Webhook事件管理

## connector-webhook

### Schema

```typescript
interface Webhook {
  id: string;
  connector_id: string;
  url: string;
  events: string[];
  retry_policy: RetryPolicy;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | /api/connectors/webhooks | 创建Webhook |
| GET | /api/connectors/webhooks/:id/events | 获取事件历史 |
