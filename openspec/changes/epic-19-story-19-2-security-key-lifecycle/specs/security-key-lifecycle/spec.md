# Specifications: Security 密钥生命周期管理

## security-key-lifecycle

### Schema

```typescript
interface KeyLifecycle {
  key_id: string;
  created_at: number;
  last_used_at?: number;
  expires_at?: number;
  status: 'active' | 'rotating' | 'expired' | 'destroyed';
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/security/keys/lifecycle | 获取生命周期状态 |
| POST | /api/security/keys/destroy | 销毁密钥 |
