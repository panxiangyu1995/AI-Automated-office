# Specifications: Connectors 连接器监控

## connector-monitoring

### Schema

```typescript
interface ConnectorMetrics {
  connector_id: string;
  uptime: number;
  request_count: number;
  error_count: number;
  avg_response_time: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/connectors/monitoring/metrics | 获取指标 |
| GET | /api/connectors/monitoring/health | 健康检查 |
