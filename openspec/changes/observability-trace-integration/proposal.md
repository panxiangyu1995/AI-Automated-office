# Proposal: Agent可观测性面板

## 变更类型
- [x] 增强功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

前端组件已存在：
- `src/features/session/components/AgentObservabilityPanel.tsx`
- `src/features/agent/components/TaskTraceAnalysis.tsx`
- `src-tauri/src/agent/monitoring.rs` - 监控模块

**缺失部分**：Trace/Span 链路追踪集成。

## 目标

完善 Agent 可观测性 (FR1100-FR1106)：
1. 实现 Trace/Span 数据模型
2. 实现链路追踪收集器
3. 实现监控面板数据聚合
4. 实现性能指标展示
5. 实现慢操作告警

## 影响范围

### 前端
- `src/features/session/components/AgentObservabilityPanel.tsx` - 扩展现有组件

### 后端
- `src-tauri/src/agent/monitoring.rs` - 扩展现有模块

## 依赖

- **前置依赖**: Task 157 (Agent E2E集成测试)

## 验收标准

1. Trace 链路能够正确展示
2. 性能指标能够正确采集
3. 慢操作告警能够触发
