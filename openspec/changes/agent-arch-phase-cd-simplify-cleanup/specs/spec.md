# Specification: Agent Runtime 架构重构 - Phase C+D: 子系统精简与清理

## 约束条件

- 简化的路由系统必须保留 Keyword 匹配能力
- 简化的记忆系统必须保留个人记忆和共享记忆功能
- 合并后的监控模块必须保留事件推送和指标收集能力
- 所有删除的模块不影响外部 API
- 所有 `cargo test` 必须继续通过

## 验收标准

### C1: 路由系统简化

- [ ] `SimpleRouter` 结构体创建完成
- [ ] Keyword 匹配逻辑实现完成
- [ ] Manual/Auto/Hybrid 模式切换实现完成
- [ ] `SubAgentRoutingService` 删除
- [ ] `routing_types.rs` 删除
- [ ] SemanticRouter 删除
- [ ] RiskEvaluation 删除
- [ ] ConfirmationState 删除

### C2: 记忆系统精简

- [ ] `MemoryScope::Inherited` 删除
- [ ] `MemoryScope::SessionOnly` 删除
- [ ] 个人记忆功能保留
- [ ] 共享记忆功能保留
- [ ] 上下文窗口管理保留

### C3: 监控模块合并

- [ ] `monitoring.rs` 创建完成
- [ ] `EventEmitter` trait 实现完成
- [ ] `MetricsCollector` 结构体实现完成
- [ ] `monitoring_types.rs` 删除
- [ ] `audit.rs` 删除
- [ ] `audit_types.rs` 删除
- [ ] `audit_siem.rs` 删除
- [ ] `events.rs` 删除

### D1: 空壳模块删除

- [ ] `execution_integration.rs` 删除
- [ ] `pilot.rs` 删除
- [ ] `router/` 目录删除
- [ ] `model_router.rs` 删除

### D2: mod.rs 更新

- [ ] 导出从 55 个减少到 ~20 个
- [ ] 所有保留模块正确导出
- [ ] `cargo check` 无错误

### D3: 功能回归验证

- [ ] `cargo test` 全部通过
- [ ] `npm run lint` 通过
- [ ] `npm run build` 成功
- [ ] 浏览器测试验证 Agent 执行正常

## 边界条件

- 路由无匹配：回退到主 Agent（保持原有行为）
- 记忆存储失败：记录错误但不影响主流程
- 监控事件发送失败：静默失败，不阻塞主流程
