# Specification: 多租户-存储层隔离强化

## 需求来源

- **功能不变性需求**: 现有存储功能必须保持兼容
- **架构合规**: 遵循架构文档的租户隔离要求
- **安全要求**: 必须防止跨租户数据访问

## 约束条件

1. **功能不变性**: 所有存储 API 必须保持向后兼容
2. **租户隔离**: 所有查询必须按 tenant_id 过滤
3. **数据完整性**: 所有插入必须设置 tenant_id

## 技术约束

1. **默认租户**: 现有数据的 tenant_id 默认值为 "default"
2. **索引优化**: tenant_id 字段必须有索引
3. **双重隔离**: 数据库文件隔离 + 表字段隔离

## 验收标准

### 功能验收

- [ ] `SessionStore.list` 按 tenant_id 过滤
- [ ] `SessionStore.create` 设置 tenant_id
- [ ] `MessageStore.list_by_session` 按 tenant_id 过滤
- [ ] `MessageStore.create` 设置 tenant_id
- [ ] `MemoryStore.query` 按 tenant_id 过滤
- [ ] `MemoryStore.insert` 设置 tenant_id

### 架构验收

- [ ] SessionStore 包含 tenant_id
- [ ] MessageStore 包含 tenant_id
- [ ] MemoryStore 包含 tenant_id
- [ ] StorageManager 传递 tenant_id

### 质量验收

- [ ] cargo build 成功
- [ ] cargo test 通过
- [ ] cargo clippy 无警告
- [ ] 单元测试覆盖率 ≥ 80%

## 数据完整性保证

1. **非空约束**: tenant_id NOT NULL
2. **索引**: tenant_id 有索引
3. **默认值**: 现有数据 tenant_id 为 "default"

## 性能要求

1. **查询性能**: 带 tenant_id 过滤的查询 < 10ms
2. **插入性能**: 设置 tenant_id 的插入 < 20ms
3. **索引效率**: 索引覆盖查询
