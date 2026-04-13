# Specifications: Security 安全密钥库基础

## security-vault-base

### Schema

```typescript
interface Secret {
  id: string;
  name: string;
  encrypted_value: string;
  version: number;
  created_at: number;
  expires_at?: number;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/security/vault/secrets | 创建密钥 |
| GET | /api/security/vault/secrets/:id | 获取密钥 |
| POST | /api/security/vault/rotate | 轮换密钥 |
