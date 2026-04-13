# Specifications: Security 权限边界控制

## security-rbac

### Schema

```typescript
interface ResourcePermission {
  id: string;
  role_id: string;
  resource_type: string;
  resource_id?: string;
  actions: string[];
  field_level: string[];
  row_filter?: string;
}
```

### API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/security/permissions/resource` | 配置资源权限 |
| GET | `/api/security/permissions/resource` | 获取资源权限 |
| POST | `/api/security/permissions/check` | 检查权限 |
