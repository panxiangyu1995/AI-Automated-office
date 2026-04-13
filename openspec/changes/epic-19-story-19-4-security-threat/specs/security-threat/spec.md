# Specifications: Security 安全威胁检测

## security-threat

### Schema

```typescript
interface ThreatRule {
  id: string;
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  action: 'alert' | 'block' | 'notify';
}

interface ThreatAlert {
  id: string;
  rule_id: string;
  severity: string;
  description: string;
  status: 'new' | 'investigating' | 'resolved';
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/security/threats/rules | 获取规则 |
| GET | /api/security/threats/alerts | 获取告警 |
| PUT | /api/security/threats/alerts/:id | 更新告警状态 |
| GET | /api/security/threats/dashboard | 安全仪表板 |
