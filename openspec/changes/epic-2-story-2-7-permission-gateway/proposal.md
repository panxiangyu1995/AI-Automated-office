## Why

Epic 2 用户认证与部门权限系统需要在后端实现统一的权限网关，确保所有 API 请求都经过权限校验。Story 2.7 Backend permission gateway 实现权限网关中间件，提供租户隔离、角色权限、数据范围、字段级权限的统一校验，并返回标准化的 403 响应。

本 Story 解决以下问题：
1. 如何在所有 API 请求中统一执行权限校验
2. 如何实现多租户数据隔离
3. 如何返回标准化的权限拒绝响应

## What Changes

### 新增内容
- 构建认证和权限中间件
- 添加租户隔离检查
- 添加资源权限检查
- 返回标准 403 响应契约

### 需求映射
- **FR:** FR29, FR30, FR31, FR32
- **NFR:** NFR16
- **ARCH:** ADR-005
- **UX:** N/A

### 依赖关系
- **E2-S2.6-01** - 需要细粒度权限计算支持

## Capabilities

### New Capabilities
- `permission-gateway`: 提供 Story 2.7 权限网关能力，实现统一的权限校验中间件。

### Modified Capabilities
- 所有需要权限保护的 API 端点都将通过权限网关

## Impact

### Go 云端后端
- 新增 AuthMiddleware 认证中间件
- 新增 PermissionMiddleware 权限中间件
- 新增 TenantMiddleware 租户隔离中间件
- 新增标准 403 响应格式

### API 变更
- 所有需要认证的 API 返回标准 401/403 响应
- 403 响应包含资源标识、所需权限、申请入口

## Technical Decisions

### 中间件分层架构

```
Request → TenantMiddleware → AuthMiddleware → PermissionMiddleware → Handler
              ↓                     ↓                     ↓
         租户隔离             用户认证            权限校验
              ↓                     ↓                     ↓
         403 Tenant             401 Unauthorized     403 Forbidden
```

### 403 响应契约设计

| 字段 | 类型 | 说明 |
|------|------|------|
| code | string | 错误代码，固定为 PERMISSION_DENIED |
| http_status | int | HTTP 状态码，固定为 403 |
| message | string | 用户友好的错误消息 |
| resource | string | 被拒绝的资源标识 |
| required_permission | string | 执行该操作所需的权限 |
| apply_entry | string | 申请权限的入口 URL |
| trace_id | string | 请求追踪 ID |

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 中间件性能影响 | 权限结果缓存、异步预加载 |
| 过度拦截 | 白名单机制、细粒度配置 |
| 错误响应不一致 | 统一响应格式、错误码规范 |

## Migration Plan

1. 实现 TenantMiddleware 租户隔离中间件
2. 实现 AuthMiddleware 认证中间件
3. 实现 PermissionMiddleware 权限中间件
4. 定义标准 403 响应契约
5. 逐步迁移现有 API 使用中间件
6. 进行集成测试验证

## Open Questions

- 是否需要支持权限缓存预热？
- 是否需要支持权限变更实时通知？