# Specifications: Security 安全审计基础架构

## security-audit-log

### Description

安全审计日志。

### Schema

```typescript
interface AuditLog {
  id: string;
  event_type: AuditEventType;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  result: 'success' | 'failure';
  ip_address: string;
  user_agent: string;
  details: Record<string, any>;
  created_at: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/security/audit` | 记录审计日志（内部） |
| GET | `/api/security/audit` | 查询审计日志 |
| GET | `/api/security/audit/:id` | 获取审计详情 |
| GET | `/api/security/audit/export` | 导出审计日志 |
