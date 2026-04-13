# Specifications: Security 工具权限控制

## security-tool-permissions

### Schema

```typescript
interface ToolPermission {
  tool_id: string;
  role_id: string;
  actions: string[];
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/security/tools/permissions | 设置权限 |
| GET | /api/security/tools/permissions | 获取权限列表 |
