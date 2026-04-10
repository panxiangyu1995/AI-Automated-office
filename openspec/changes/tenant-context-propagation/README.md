# 租户上下文传播

## 概述

本变更为多租户架构优化的第三阶段，在 Agent 执行流程中传递 TenantContext，实现权限计算的租户隔离。

## 依赖

- **前置依赖**: Task 221 (用户-租户关联)
- **后置依赖**: Task 223 (存储层隔离强化)

## 优化内容

1. **TenantContext**: 定义 TenantContext 结构体
2. **PermissionEngine**: calculate_permissions 使用 TenantContext
3. **Agent 执行**: 执行流程传递 TenantContext
4. **工具执行**: 管道集成租户校验

## 验证

```bash
cargo build --lib
cargo test permission
cargo clippy -- -D warnings
```

## 回滚

- 回退 PermissionEngine 到未使用 TenantContext 版本
