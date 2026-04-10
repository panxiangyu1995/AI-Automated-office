# Proposal: 多租户-租户上下文传播

## 变更类型
- [ ] 新功能
- [ ] 架构优化
- [ ] 性能优化
- [x] 代码重构

## 背景

当前 `PermissionEngine` 的 `ExecutionContext` 有 `tenant_id` 字段，但：

1. **上下文未传递** - Agent 执行流程未传递租户上下文
2. **权限未隔离** - 权限计算未按租户隔离
3. **数据未过滤** - 工具调用未使用租户上下文

## 优化目标

在 Agent 执行流程中传递 `TenantContext`，实现：

1. 权限计算的租户隔离
2. 工具调用的租户校验
3. 数据访问的租户过滤

## 功能不变性保证

**必须保持的现有功能：**
- `PermissionEngine.calculate_permissions` - 权限计算
- `PermissionEngine.check_tool_permission` - 工具权限检查
- 三层权限合并 (Platform/Department/Role)

## 优化方案

### 1. TenantContext 定义

```rust
// src-tauri/src/session/context.rs
#[derive(Debug, Clone)]
pub struct TenantContext {
    pub tenant_id: String,
    pub user_id: String,
    pub role: String,
    pub department_id: Option<String>,
}

impl TenantContext {
    pub fn from_metadata(metadata: &SessionMetadata) -> Self {
        Self {
            tenant_id: metadata.tenant_id.clone(),
            user_id: metadata.user_id.clone(),
            role: "user".to_string(),
            department_id: None,
        }
    }
}
```

### 2. PermissionEngine 集成

```rust
impl PermissionEngine {
    pub async fn calculate_permissions(
        &self,
        context: &TenantContext,
    ) -> Result<UserPermissions, PermissionError> {
        let exec_context = ExecutionContext::new(
            context.tenant_id.clone(),
            context.user_id.clone(),
            context.role.clone(),
        ).with_department(
            context.department_id.clone().unwrap_or_default()
        );
        
        // ... 原有逻辑
    }
}
```

### 3. Agent 执行流程集成

```rust
// 在 Agent 执行开始时创建 TenantContext
let tenant_context = TenantContext::from_metadata(&session_metadata);

// 传递给权限引擎
let permissions = permission_engine
    .calculate_permissions(&tenant_context)
    .await?;

// 工具执行时校验
if !permissions.is_tool_allowed(tool_id) {
    return Err(ToolError::PermissionDenied(tool_id));
}
```

## 影响范围

### 涉及文件
- `src-tauri/src/session/context.rs` - **新增** TenantContext 定义
- `src-tauri/src/agent/permission/engine.rs` - PermissionEngine
- `src-tauri/src/agent/execution.rs` - Agent 执行流程
- `src-tauri/src/agent/tools/pipeline.rs` - 工具执行管道

### 不影响文件
- `src-tauri/src/tenant/` - 租户模块
- `src-tauri/src/auth/` - 认证模块

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 上下文传递遗漏 | 中 | 高 | 添加编译时检查 |
| 性能下降 | 低 | 中 | 使用缓存优化 |
| 权限逻辑变更 | 低 | 中 | 保持原有合并算法 |

## 依赖

- **前置依赖:** Task 221 (用户-租户关联)
- **后置依赖:** Task 223 (存储层隔离强化)

## 验证计划

```bash
cargo build --lib
cargo test permission
cargo clippy
```
