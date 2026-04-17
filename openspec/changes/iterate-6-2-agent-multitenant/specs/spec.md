# 规格: Agent多租户支持

## 类型定义

### SessionContext
```rust
pub struct SessionContext {
    pub session_id: String,
    pub user_id: String,
    pub tenant_id: String,  // 多租户隔离字段
    pub department_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}
```

### TenantAccessError
```rust
#[derive(Debug, Error)]
pub enum TenantAccessError {
    #[error("租户访问被拒绝: {0}")]
    AccessDenied(String),
    
    #[error("租户ID不匹配")]
    TenantMismatch,
    
    #[error("租户不存在: {0}")]
    TenantNotFound(String),
}
```

## 校验规则

### 工具调用校验
1. 从 SessionContext 获取 tenant_id
2. 从工具元数据获取允许的 tenant_id 列表（可为空表示不限）
3. 如果列表非空且不包含当前 tenant_id，返回 TenantAccessDenied

### 子代理继承规则
- 子代理自动继承父会话的 tenant_id
- 子代理无法切换到其他租户上下文

## 性能要求
- 租户校验延迟 < 10ms
- 不影响正常工具调用流程
