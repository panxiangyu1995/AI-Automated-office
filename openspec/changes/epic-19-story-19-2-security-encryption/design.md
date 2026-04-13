# Design: Security 敏感数据加密

## Context

实现敏感数据的加密保护。

## Goals / Non-Goals

### Goals

- [x] 实现敏感字段识别
- [x] 实现字段级加密
- [x] 实现密钥管理

### Non-Goals

- [ ] 数据库透明加密

## Decisions

### 1. 加密策略

```typescript
interface EncryptionConfig {
  field: string;
  table: string;
  algorithm: 'aes-256-gcm' | 'rsa';
  key_id: string;
  enabled: boolean;
}

const SENSITIVE_FIELDS = [
  { field: 'password', algorithm: 'bcrypt' },
  { field: 'phone', algorithm: 'aes-256-gcm' },
  { field: 'id_card', algorithm: 'aes-256-gcm' },
  { field: 'bank_account', algorithm: 'aes-256-gcm' },
];
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 密钥丢失 | 使用密钥轮换和备份机制 |
