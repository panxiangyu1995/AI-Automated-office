# Specifications: Security 单点登录(SSO)

## security-sso

### Schema

```typescript
interface SSOConfig {
  provider: 'saml' | 'oauth2' | 'oidc';
  client_id: string;
  client_secret: string;
  discovery_url: string;
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/sso/config | 配置SSO |
| GET | /api/auth/sso/login | 发起SSO登录 |
| POST | /api/auth/sso/callback | SSO回调 |
