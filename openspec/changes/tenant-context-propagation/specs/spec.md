# Specification: 多租户-租户上下文传播

## 需求来源

- **功能不变性需求**: 现有权限计算功能必须保持兼容
- **架构合规**: 遵循架构文档的租户隔离要求
- **云端一致性**: 与 cloud-server 的权限系统保持一致

## 约束条件

1. **功能不变性**: 权限计算结果必须保持一致
2. **租户隔离**: 不同租户的权限必须隔离
3. **上下文传递**: 所有权限校验必须通过 TenantContext

## 技术约束

1. **异步模式**: 使用 async/await
2. **缓存优化**: 使用缓存减少重复计算
3. **错误处理**: 统一的错误类型

## 验收标准

### 功能验收

- [ ] `PermissionEngine.calculate_permissions` 接受 TenantContext
- [ ] 权限计算按租户隔离
- [ ] 工具权限检查按租户校验
- [ ] 三层权限合并算法保持不变

### 架构验收

- [ ] TenantContext 结构体定义完整
- [ ] TenantContext::from_metadata 实现正确
- [ ] PermissionEngine 集成 TenantContext
- [ ] Agent 执行流程传递 TenantContext

### 质量验收

- [ ] cargo build 成功
- [ ] cargo test 通过
- [ ] cargo clippy 无警告
- [ ] 单元测试覆盖率 ≥ 80%

## 缓存策略

1. **缓存键**: tenant_id:user_id:role:department_id
2. **缓存 TTL**: 5 分钟（可配置）
3. **缓存失效**: 用户权限变更时清除

## 性能要求

1. **计算性能**: 权限计算 < 50ms
2. **缓存命中**: 缓存命中时 < 5ms
3. **内存占用**: 缓存 < 1MB
