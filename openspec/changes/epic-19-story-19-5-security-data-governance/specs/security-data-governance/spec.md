# Specifications: Security 数据治理

## security-data-governance

### Schema

```typescript
interface DataClassification {
  id: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  rules: DataRule[];
}

interface DataMaskingRule {
  field: string;
  type: 'mask' | 'hash' | 'encrypt';
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/security/governance/classifications | 获取分类 |
| POST | /api/security/governance/rules | 创建规则 |
