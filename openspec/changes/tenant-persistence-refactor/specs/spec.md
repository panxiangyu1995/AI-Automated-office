# Specification: 多租户-租户持久化改造

## 需求来源

- **功能不变性需求**: 现有租户管理命令必须保持兼容
- **架构合规**: 遵循架构文档的分层设计原则
- **云端一致性**: 与 cloud-server 的租户中间件保持架构一致

## 约束条件

1. **功能不变性**: 所有现有租户 API 必须保持向后兼容
2. **数据持久化**: 租户数据必须持久化到 SQLite
3. **抽象层次**: 使用 Repository Pattern 解耦数据访问
4. **渐进迁移**: 支持从内存存储平滑迁移到持久化存储

## 技术约束

1. **SQLite 版本**: 使用 sqlx 0.7+
2. **异步支持**: 使用 async/await 异步模式
3. **错误处理**: 使用 thiserror 定义错误类型
4. **类型安全**: 使用类型系统保证数据完整性

## 验收标准

### 功能验收

- [ ] `tenant_list` 命令返回所有租户
- [ ] `tenant_get_current` 命令返回当前租户
- [ ] `tenant_get_config` 命令返回租户配置
- [ ] `tenant_update_config` 命令更新租户配置
- [ ] `tenant_get_stats` 命令返回租户统计

### 架构验收

- [ ] TenantState 使用 Repository 模式
- [ ] Repository 使用 trait 抽象
- [ ] 数据库迁移脚本正确
- [ ] 错误类型统一

### 质量验收

- [ ] cargo build 成功
- [ ] cargo test 通过
- [ ] cargo clippy 无警告
- [ ] 单元测试覆盖率 ≥ 80%

## 数据完整性保证

1. **主键约束**: tenants.id 和 tenant_configs.tenant_id 为主键
2. **外键约束**: tenant_configs.tenant_id 引用 tenants.id
3. **唯一约束**: tenants.code 唯一
4. **索引**: code 和 status 字段有索引

## 性能要求

1. **查询性能**: 租户查询 < 10ms
2. **写入性能**: 租户创建/更新 < 50ms
3. **内存占用**: Repository 实例 < 1KB
