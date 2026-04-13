# Specifications: Connectors 连接器基础架构

## connector-core

### Schema

```typescript
interface Connector {
  id: string;
  name: string;
  type: string;
  status: 'disconnected' | 'connected' | 'error';
  created_at: number;
}

interface ConnectorType {
  id: string;
  name: string;
  icon: string;
  auth_type: 'api_key' | 'oauth2' | 'basic';
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/connectors/types | 获取类型 |
| POST | /api/connectors | 创建连接器 |
| POST | /api/connectors/:id/test | 测试连接 |
