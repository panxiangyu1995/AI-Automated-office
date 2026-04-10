# Specification: 多租户-用户-租户关联

## 需求来源

- **功能不变性需求**: 现有认证功能必须保持兼容
- **架构合规**: 遵循架构文档的多租户隔离要求
- **云端一致性**: 与 cloud-server 的用户-租户关联保持一致

## 约束条件

1. **功能不变性**: 现有认证 API 必须保持向后兼容
2. **数据完整性**: 用户必须有 tenant_id
3. **租户内唯一性**: 用户名在租户内唯一，而非全局唯一
4. **平滑迁移**: 现有用户自动归属默认租户

## 技术约束

1. **SQLite 迁移**: 使用 ALTER TABLE ADD COLUMN
2. **默认值**: 现有用户 tenant_id 默认值为 "default"
3. **索引**: 租户 ID 和用户名组合唯一索引

## 验收标准

### 功能验收

- [ ] `auth/login` 支持指定租户登录
- [ ] `auth/register` 支持指定租户注册
- [ ] `auth/get_current_user` 返回用户的 tenant_id
- [ ] 用户名在租户内唯一

### 架构验收

- [ ] User 结构体包含 tenant_id
- [ ] AuthService 方法支持 tenant_id 参数
- [ ] 数据库迁移正确执行
- [ ] 索引约束正确创建

### 质量验收

- [ ] cargo build 成功
- [ ] cargo test 通过
- [ ] cargo clippy 无警告
- [ ] 单元测试覆盖率 ≥ 80%

## 数据完整性保证

1. **外键约束**: users.tenant_id → tenants.id（可选，如 SQLite 支持）
2. **唯一约束**: (tenant_id, username) 为唯一组合
3. **非空约束**: tenant_id NOT NULL
4. **索引**: tenant_id 有索引

## 性能要求

1. **查询性能**: 按租户用户查询 < 10ms
2. **登录性能**: 租户登录 < 100ms
3. **注册性能**: 租户注册 < 100ms
