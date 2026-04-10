# 多租户架构优化

## 概述

本次优化旨在将桌面端多租户实现从"内存存储+形式隔离"升级为"持久化存储+实际隔离"，与云端架构保持一致。

## 包含的变更

| 变更 | OpenSpec | Task ID | 优先级 |
|------|----------|---------|--------|
| 租户持久化改造 | tenant-persistence-refactor | Task 220 | 高 |
| 用户-租户关联 | user-tenant-association | Task 221 | 高 |
| 租户上下文传播 | tenant-context-propagation | Task 222 | 高 |
| 存储层隔离强化 | storage-tenant-isolation | Task 223 | 中 |

## 依赖关系

```
Task 220 (租户持久化)
    │
    ▼
Task 221 (用户-租户关联)
    │
    ▼
Task 222 (租户上下文传播)
    │
    ▼
Task 223 (存储层隔离强化)
```

## 优化目标

1. **数据持久化** - 租户数据从内存存储改为 SQLite 持久化
2. **用户关联** - User 表增加 tenant_id，建立用户与租户关联
3. **上下文传递** - Agent 执行流程传递 TenantContext
4. **存储隔离** - Store 层按 tenant_id 进行数据隔离

## 架构改进

### 优化前

- TenantState 使用 Mutex 内存存储
- User 表无 tenant_id
- 权限计算未使用租户隔离
- Store 层无 tenant_id 过滤

### 优化后

- TenantState 使用 Repository 模式 + SQLite
- User 表包含 tenant_id
- PermissionEngine 使用 TenantContext
- Store 层按 tenant_id 隔离

## 验证

```bash
# 编译验证
cargo build --lib

# 单元测试
cargo test tenant
cargo test auth
cargo test permission
cargo test storage

# 代码质量
cargo clippy -- -D warnings
```

## 回滚方案

每个阶段都有明确的回滚方案，详见各变更的 tasks.md。
