# Specifications: Security 敏感数据加密

## security-encryption

### Description

敏感数据加密。

### Schema

```typescript
interface EncryptionConfig {
  id: string;
  table_name: string;
  field_name: string;
  algorithm: 'aes-256-gcm' | 'rsa' | 'bcrypt';
  key_id: string;
  enabled: boolean;
  created_at: number;
}

interface EncryptionKey {
  id: string;
  key_name: string;
  algorithm: string;
  public_key?: string;
  status: 'active' | 'inactive' | 'expired';
  created_at: number;
  expires_at?: number;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/security/encryption/config` | 配置加密字段 |
| GET | `/api/security/encryption/configs` | 获取加密配置 |
| POST | `/api/security/encryption/key` | 生成密钥 |
| GET | `/api/security/encryption/keys` | 获取密钥列表 |
