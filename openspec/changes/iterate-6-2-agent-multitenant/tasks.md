# 任务: Agent多租户支持

## 步骤清单

### Task 1: SessionContext添加tenant_id字段
- [ ] 修改 `session/context.rs` 添加 tenant_id 字段
- [ ] 修改 SessionContext::new() 接收 tenant_id 参数
- [ ] 更新所有 SessionContext 实例化处

### Task 2: RuntimeSession添加tenant_id传递
- [ ] 修改 `agent/runtime_session.rs`
- [ ] 在会话创建时从认证信息获取 tenant_id
- [ ] 确保所有子代理继承父会话的 tenant_id

### Task 3: 工具执行器添加租户校验
- [ ] 修改 `agent/tools/` 中的基础执行器
- [ ] 添加 validate_tenant_access 校验方法
- [ ] 在 execute 入口处调用校验

### Task 4: 完善权限引擎
- [ ] 修改 `agent/permission/engine.rs`
- [ ] 工具权限校验时同时检查 tenant_id
- [ ] 返回清晰的租户隔离错误信息

### Task 5: 测试验证
- [ ] 单元测试: SessionContext tenant_id 传递
- [ ] 单元测试: 跨租户访问被拒绝
- [ ] 集成测试: 工具调用时正确校验 tenant_id
