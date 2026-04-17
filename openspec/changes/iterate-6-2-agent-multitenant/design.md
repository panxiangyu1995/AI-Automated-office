# 设计: Agent多租户支持

## 1. 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    RuntimeSession                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ SessionContext {                                       │     │
│  │   user_id: String,                                     │     │
│  │   tenant_id: String,  ← 多租户隔离关键字段            │     │
│  │   department_id: Option<String>,                       │     │
│  │   permissions: Vec<Permission>,                       │     │
│  │ }                                                     │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ToolExecutor                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ fn execute(ctx: &ToolContext) -> ToolResult {        │   │
│  │   // 校验 tenant_id                                   │   │
│  │   if ctx.session.tenant_id != tool.tenant_id {       │   │
│  │       return Err(TenantMismatchError);                │   │
│  │   }                                                  │   │
│  │   // 执行工具逻辑                                     │   │
│  │ }                                                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 2. 涉及文件

- `src-tauri/src/agent/runtime_session.rs` - 添加tenant_id字段
- `src-tauri/src/session/context.rs` - 添加租户校验逻辑
- `src-tauri/src/agent/permission/engine.rs` - 完善权限校验

## 3. 关键实现

### 3.1 SessionContext添加tenant_id

```rust
pub struct SessionContext {
    pub session_id: String,
    pub user_id: String,
    pub tenant_id: String,  // 新增
    pub department_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
}
```

### 3.2 工具执行时校验

```rust
impl ToolExecutor {
    async fn execute_internal(&self, ctx: &SessionContext, params: &Value) -> Result<Value> {
        // 租户隔离校验
        self.validate_tenant_access(ctx).await?;
        
        // 执行工具逻辑
        self.do_execute(ctx, params).await
    }
    
    async fn validate_tenant_access(&self, ctx: &SessionContext) -> Result<()> {
        // 从工具元数据获取允许的tenant_id列表
        let allowed_tenants = self.get_allowed_tenants().await?;
        
        if !allowed_tenants.contains(&ctx.tenant_id) {
            anyhow::bail!("Tenant access denied: {}", ctx.tenant_id);
        }
        Ok(())
    }
}
```

## 4. 验收标准

- [ ] SessionContext包含tenant_id字段
- [ ] Agent运行时从session获取tenant_id
- [ ] 工具调用时校验tenant_id匹配
- [ ] 跨租户访问返回TenantAccessDenied错误
- [ ] NFR13: 多租户数据隔离验证通过
