# 用户-租户关联

## 概述

本变更为多租户架构优化的第二阶段，为 User 表增加 tenant_id 字段，建立用户与租户的关联。

## 依赖

- **前置依赖**: Task 220 (租户持久化改造)
- **后置依赖**: Task 222 (租户上下文传播)

## 优化内容

1. **数据库迁移**: users 表增加 tenant_id 字段
2. **User 结构体**: 增加 tenant_id 字段
3. **AuthService**: login/register 方法增加 tenant_id 参数
4. **唯一性约束**: 用户名从全局唯一改为租户内唯一

## 验证

```bash
cargo build --lib
cargo test auth
cargo clippy -- -D warnings
```

## 回滚

- 删除 v8 迁移文件
- 回退 User 结构体和 AuthService 到无 tenant_id 版本
