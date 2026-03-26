# Proposal: 错误恢复与故障转移机制

## 变更类型
- [x] 新功能 (new)

## 背景

### 业务背景
Agent Runtime 在执行过程中可能遇到各种异常情况：
- LLM 服务不可用或响应超时
- 工具调用失败
- 会话状态异常
- 网络连接问题

为了保证系统的可靠性和连续性，需要实现完善的错误恢复和故障转移机制，使得 Agent 能够在遇到可恢复错误时自动重试，在遇到不可恢复错误时优雅降级并通知用户。

### 技术背景
现有 `FailoverSessionRepair.tsx` 组件已存在，但核心的 `ErrorRecoveryManager` 需要从零实现。需要：
- 实现错误分类和自动重试策略
- 实现 LLM 服务故障的自动切换
- 实现会话状态的自动修复
- 实现故障通知与人工介入流程

## 目标

### 核心目标
实现错误恢复与故障转移机制，满足以下验收标准：

1. **创建 ErrorRecoveryManager 错误恢复管理器**
   - 统一管理所有错误恢复逻辑
   - 实现错误分类和优先级
   - 提供错误处理策略接口

2. **实现工具调用失败的自动重试策略**
   - 支持指数退避重试
   - 支持最大重试次数配置
   - 支持重试条件自定义
   - 记录重试历史

3. **实现 LLM 服务故障的自动切换**
   - 检测 LLM 服务可用性
   - 实现 Provider 自动切换
   - 支持降级到备用 Provider
   - 保持会话上下文一致

4. **添加会话状态的自动修复机制**
   - 检测会话状态异常
   - 自动恢复到上一个稳定状态
   - 支持检查点保存和恢复
   - 会话历史完整性保证

5. **实现故障通知与人工介入流程**
   - 实时故障告警
   - 告警级别分类（INFO/WARN/ERROR/CRITICAL）
   - 支持人工介入确认
   - 故障处理进度追踪

## 范围

### 包含
- 创建 ErrorRecoveryManager 错误恢复管理器
- 实现工具调用失败的自动重试策略
- 实现 LLM 服务故障的自动切换
- 添加会话状态的自动修复机制
- 实现故障通知与人工介入流程

### 不包含
- 非本 Story 范围内的功能
- 底层网络重试机制（由底层库处理）
- LLM Provider 的健康检查（由 Provider 管理）
- 持久化故障记录（由 Story 55.1 审计日志实现）

## 影响范围

### 前端
- **影响组件**：
  - `src/features/agent/components/FailoverSessionRepair.tsx`（已存在，需扩展）
  - 可能需要新增故障通知组件
- **影响 Hooks**：
  - `useErrorRecovery` Hook
  - `useFailover` Hook
- **影响 Stores**：
  - `errorRecoveryStore`

### 后端
- **新增模块**：
  - `src-tauri/src/agent/recovery/mod.rs` - 错误恢复核心模块
  - `src-tauri/src/agent/recovery/error_manager.rs` - 错误管理器
  - `src-tauri/src/agent/recovery/retry_strategy.rs` - 重试策略
  - `src-tauri/src/agent/recovery/failover.rs` - 故障转移
  - `src-tauri/src/agent/recovery/session_repair.rs` - 会话修复
  - `src-tauri/src/agent/recovery/notifier.rs` - 通知服务
- **Tauri 命令**：
  - `execute_with_retry` - 带重试的执行
  - `switch_llm_provider` - 切换 LLM Provider
  - `repair_session` - 修复会话状态
  - `get_recovery_status` - 获取恢复状态
  - `confirm_manual_intervention` - 确认人工介入

### 数据库
- **新增表结构**：
```sql
-- 错误记录表
CREATE TABLE error_logs (
    id TEXT PRIMARY KEY,
    error_type TEXT NOT NULL,
    error_code TEXT NOT NULL,
    error_message TEXT,
    context JSON,
    retry_count INTEGER DEFAULT 0,
    recovered BOOLEAN DEFAULT FALSE,
    recovered_at INTEGER,
    created_at INTEGER NOT NULL
);

-- 检查点表
CREATE TABLE session_checkpoints (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    checkpoint_data JSON NOT NULL,
    created_at INTEGER NOT NULL
);

-- 故障通知表
CREATE TABLE failure_notifications (
    id TEXT PRIMARY KEY,
    error_log_id TEXT,
    notification_type TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by TEXT,
    acknowledged_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (error_log_id) REFERENCES error_logs(id)
);
```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | 高 | 高 | Task 101 提供基础架构，本 Story 依赖其后完成 |
| 前端接口已存在但未连接 | 中 | 中 | 逐步对接测试 |
| 重试导致雪崩效应 | 中 | 高 | 实现熔断器和限流机制 |
| 状态修复导致数据不一致 | 低 | 高 | 使用检查点机制，保证原子性 |
| Provider 切换丢失上下文 | 中 | 中 | 实现上下文序列化和恢复 |

## 依赖

### 前置依赖
- **Task 101**: 后端 Rust Agent 基础架构（必须先完成）
- **Story 51.1**: 主 Agent 协调器 - 核心协调模块
- **Story 44.4**: 异常处理机制（相关）

### 后置依赖
- **Story 55.1**: 完整审计日志系统（记录错误恢复日志）
- **Story 55.3**: 性能监控与指标收集（监控恢复性能）

## 实现步骤

1. **创建 ErrorRecoveryManager 错误恢复管理器**
   - 定义错误分类和优先级
   - 设计错误处理策略接口
   - 实现错误处理核心逻辑

2. **实现工具调用失败的自动重试策略**
   - 实现指数退避算法
   - 配置最大重试次数和超时
   - 实现重试条件判断
   - 记录重试历史

3. **实现 LLM 服务故障的自动切换**
   - 实现 Provider 健康检测
   - 实现 Provider 切换逻辑
   - 实现上下文序列化
   - 保持会话一致性

4. **添加会话状态的自动修复机制**
   - 实现检查点保存
   - 实现状态检测和异常识别
   - 实现状态恢复逻辑
   - 保证恢复的原子性

5. **实现故障通知与人工介入流程**
   - 实现通知服务
   - 实现告警级别分类
   - 实现人工介入确认
   - 实现处理进度追踪

## 验收标准

- [ ] ErrorRecoveryManager 正确处理所有错误类型
- [ ] 工具调用失败自动重试正常工作
- [ ] LLM Provider 故障时自动切换
- [ ] 会话状态异常时自动修复
- [ ] 故障通知正确发送
- [ ] 人工介入流程正常工作
