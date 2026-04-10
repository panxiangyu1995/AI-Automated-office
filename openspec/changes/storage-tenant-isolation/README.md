# 存储层隔离强化

## 概述

本变更为多租户架构优化的第四阶段，确保所有存储操作通过 tenant_id 进行数据隔离。

## 依赖

- **前置依赖**: Task 222 (租户上下文传播)

## 优化内容

1. **SessionStore**: 增加 tenant_id 字段，按 tenant_id 过滤
2. **MessageStore**: 增加 tenant_id 字段，按 tenant_id 过滤
3. **MemoryStore**: 增加 tenant_id 字段，按 tenant_id 过滤
4. **StorageManager**: 传递 tenant_id 给 Store

## 验证

```bash
cargo build --lib
cargo test storage
cargo clippy -- -D warnings
```

## 回滚

- 回退 Store 结构体到无 tenant_id 字段版本
