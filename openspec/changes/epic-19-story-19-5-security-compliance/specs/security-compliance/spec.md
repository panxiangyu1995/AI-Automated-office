# Specifications: Security 安全合规报告

## security-compliance

### Schema

```typescript
interface ComplianceCheck {
  id: string;
  framework: 'gdpr' | 'iso27001' | 'custom';
  category: string;
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  last_checked: number;
}

interface SecurityReport {
  id: string;
  title: string;
  period_start: number;
  period_end: number;
  content: string;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | /api/security/compliance/check | 执行检查 |
| GET | /api/security/compliance/reports | 获取报告 |
| POST | /api/security/compliance/reports | 生成报告 |
