# Design: 多租户数据隔离

## 技术方案

```rust
// 租户中间件
pub struct TenantMiddleware {
    tenant_id: TenantId,
    user_id: UserId,
}

impl TenantMiddleware {
    pub fn new(tenant_id: TenantId) -> Self;
    pub fn apply<T: TenantScoped>(&self, query: &mut T) -> Result<(), TenantError>;
    pub fn verify_access(&self, resource: &Resource) -> Result<(), TenantError>;
}
```

## 验收标准
1. 所有查询自动注入租户 ID
2. 跨租户访问被阻止
3. 租户配置可以管理
