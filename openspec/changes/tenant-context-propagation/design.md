# Design: 多租户-租户上下文传播

## 优化前架构

```
┌──────────────────┐
│ SessionMetadata   │
│ - tenant_id ✓    │
│ - user_id ✓      │
└──────────────────┘
         │
         │ 未传递
         ▼
┌──────────────────┐
│ PermissionEngine │
│ ExecutionContext │
│ - tenant_id ✓    │
│                  │
│ ❌ 未实际使用    │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Tool Execution   │
│ ❌ 无租户校验    │
└──────────────────┘
```

**问题：**
- tenant_id 在 ExecutionContext 中存在但未使用
- 权限计算未按租户隔离
- 工具执行无租户校验

## 优化后架构

```
┌──────────────────┐
│ SessionMetadata   │
└──────────────────┘
         │
         │ 提取
         ▼
┌──────────────────┐
│ TenantContext    │  [新增]
│ - tenant_id      │
│ - user_id        │
│ - role           │
│ - department_id   │
└──────────────────┘
         │
         │ 传递
         ▼
┌──────────────────┐
│ PermissionEngine │
│                  │
│ ✓ 使用tenant_id  │
│   进行隔离       │
└──────────────────┘
         │
         │ 校验
         ▼
┌──────────────────┐
│ Tool Execution   │
│                  │
│ ✓ 租户权限校验  │
└──────────────────┘
```

## 详细设计

### 1. TenantContext 结构体

```rust
// src-tauri/src/session/context.rs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TenantContext {
    /// 租户 ID
    pub tenant_id: String,
    /// 用户 ID
    pub user_id: String,
    /// 用户角色
    pub role: String,
    /// 部门 ID（可选）
    pub department_id: Option<String>,
}

impl TenantContext {
    /// 从 SessionMetadata 创建 TenantContext
    pub fn from_metadata(metadata: &SessionMetadata) -> Self {
        Self {
            tenant_id: metadata.tenant_id.clone(),
            user_id: metadata.user_id.clone(),
            role: "user".to_string(),  // TODO: 从用户信息获取
            department_id: None,
        }
    }
    
    /// 从 Claims 创建 TenantContext
    #[cfg(feature = "jwt")]
    pub fn from_claims(claims: &Claims) -> Result<Self, String> {
        Ok(Self {
            tenant_id: claims.tid.clone(),
            user_id: claims.sub.clone(),
            role: claims.role.clone(),
            department_id: claims.dept_id.clone(),
        })
    }
}
```

### 2. PermissionEngine 集成

```rust
impl PermissionEngine {
    /// 使用 TenantContext 计算权限
    pub async fn calculate_permissions(
        &self,
        context: &TenantContext,
    ) -> Result<UserPermissions, PermissionError> {
        // 构造 ExecutionContext（内部使用）
        let exec_context = ExecutionContext::new(
            context.tenant_id.clone(),
            context.user_id.clone(),
            context.role.clone(),
        ).with_department(
            context.department_id.clone().unwrap_or_default()
        );
        
        // 按租户获取部门权限
        let department_perms = self.get_department_permissions_for_tenant(
            &context.tenant_id,
            &context.department_id,
        ).await?;
        
        // 按租户获取角色权限
        let role_perms = self.get_role_permissions_for_tenant(
            &context.tenant_id,
            &context.role,
        )?;
        
        // 合并权限（使用原有逻辑）
        let merged = self.merge_permissions(&exec_context, &department_perms, &role_perms);
        let final_perms = self.apply_blacklist(merged, &context.user_id);
        
        Ok(final_perms)
    }
    
    /// 按租户获取部门权限
    async fn get_department_permissions_for_tenant(
        &self,
        tenant_id: &str,
        department_id: &Option<String>,
    ) -> Result<DepartmentPermissions, PermissionError> {
        // TODO: 从数据库按租户查询部门权限
        // 目前使用模拟实现
        self.get_department_permissions_internal(department_id).await
    }
    
    /// 按租户获取角色权限
    fn get_role_permissions_for_tenant(
        &self,
        tenant_id: &str,
        role: &str,
    ) -> Result<RolePermissions, PermissionError> {
        // TODO: 从数据库按租户查询角色权限
        // 目前使用模拟实现
        self.get_role_permissions_internal(role)
    }
}
```

### 3. Agent 执行流程集成

```rust
// src-tauri/src/agent/execution.rs
pub async fn execute_with_context(
    &self,
    request: &ExecuteRequest,
    metadata: &SessionMetadata,
) -> Result<ExecuteResponse, AgentError> {
    // 从 metadata 创建 TenantContext
    let tenant_context = TenantContext::from_metadata(metadata);
    
    // 传递上下文进行权限计算
    let permissions = self.permission_engine
        .calculate_permissions(&tenant_context)
        .await?;
    
    // 工具执行前校验
    for tool_call in &request.tool_calls {
        if !permissions.is_tool_allowed(&tool_call.name) {
            return Err(AgentError::PermissionDenied(tool_call.name.clone()));
        }
    }
    
    // 执行工具...
}
```

### 4. 工具执行管道集成

```rust
// src-tauri/src/agent/tools/pipeline.rs
pub struct ToolExecutionPipeline {
    permission_engine: Arc<PermissionEngine>,
    tool_registry: Arc<ToolRegistry>,
}

impl ToolExecutionPipeline {
    pub async fn execute(
        &self,
        request: &ToolRequest,
        tenant_context: &TenantContext,
    ) -> Result<ToolResponse, ToolError> {
        // 权限校验
        let permissions = self.permission_engine
            .calculate_permissions(tenant_context)
            .await?;
        
        if !permissions.is_tool_allowed(&request.tool_name) {
            return Err(ToolError::PermissionDenied {
                tool: request.tool_name.clone(),
                tenant: tenant_context.tenant_id.clone(),
            });
        }
        
        // 执行工具...
    }
}
```

## 缓存策略

```rust
impl PermissionEngine {
    /// 缓存键生成
    fn cache_key(&self, context: &TenantContext) -> String {
        format!(
            "{}:{}:{}:{}",
            context.tenant_id,
            context.user_id,
            context.role,
            context.department_id.as_ref().unwrap_or(&"none".to_string())
        )
    }
}
```

## 测试策略

### 单元测试

1. **TenantContext 创建测试**
2. **权限计算使用租户测试**
3. **缓存键生成测试**

### 集成测试

1. **跨租户权限隔离测试**
2. **工具执行租户校验测试**
