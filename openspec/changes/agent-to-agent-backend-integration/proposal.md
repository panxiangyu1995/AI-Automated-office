# Proposal: Agent-to-Agent通信后端集成

## 变更类型
- [x] 新功能
- [ ] 重构
- [ ] 优化
- [ ] 开发

## 背景

当前 Agent-to-Agent 通信前端组件已创建：
- `src/features/agent/components/AgentIntercom.tsx` - Agent间消息通信组件（1018行）

**缺失部分**：后端通信服务、消息路由、权限控制、审计日志。

## 目标

将 AgentIntercom 组件与后端通信服务集成，实现：
1. Agent间消息传递（FR59-FR68）
2. 消息权限校验
3. 审计日志记录
4. 消息状态追踪（已发送/已送达/已读）

## 范围

### 包含
- Agent间消息数据模型
- 消息路由服务
- 权限校验中间件
- 审计日志记录
- 与前端AgentIntercom集成

### 不包含
- 人与人之间的直接消息（由统一消息系统负责）
- Agent与外部系统的通信

## 影响范围

### 后端
- `src-tauri/src/message/` - 新增Agent通信服务
- `src-tauri/src/agent/intercom.rs` - 新增Agent间通信模块
- `src-tauri/src/audit/` - 审计日志模块

### 前端
- `src/features/agent/components/AgentIntercom.tsx` - 集成后端API

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 消息循环 | 低 | 高 | 添加消息去重机制 |
| 权限泄露 | 中 | 高 | 严格权限校验 |
| 性能瓶颈 | 中 | 中 | 异步消息队列 |

## 依赖

- **前置依赖**: Task 157 (Agent E2E集成测试)
- **后置依赖**: Task 167 (群聊功能)

## 验收标准

1. Agent能够向其他Agent发送消息
2. 消息发送前需员工确认（FR60）
3. 员工可以查看发送和接收记录（FR61）
4. 员工可以设置Agent通信权限（FR62）
5. 消息记录完整审计（FR66）
