# Specification: 错误恢复与故障转移机制

## 需求来源

### PRD 需求
- **FR603**: 错误恢复 - 系统应具备自动错误恢复能力
- **FR604**: 故障转移 - LLM 服务故障时自动切换到备用服务
- **FR605**: 会话修复 - 会话状态异常时自动修复

### 架构约束
- **ADR-001**: Agent 核心架构设计

### UX 规范
- **UX-01**: 核心交互设计原则
- **UX-04**: 错误处理和反馈设计

### NFR 约束
- **NFR1**: 响应性 - 操作响应时间 < 2s
- **NFR16**: 可靠性 - 系统可用性 > 99.9%
- **NFR22**: 可测试性 - 关键路径测试覆盖

---

## 功能规格

### 用户故事

**As an** Enterprise User,
**I want to** Agent 在遇到可恢复错误时自动重试，在遇到不可恢复错误时优雅降级，
**So that** 我的任务不会因为临时故障而中断，提高工作效率。

### 验收场景

#### Scenario 1: 工具调用失败自动重试
- **GIVEN** 用户执行 Agent 任务，工具调用失败
- **WHEN** 错误类型为可重试类型（如网络超时）
- **THEN** 系统自动执行指数退避重试：
  - 初始延迟 1s，最大延迟 30s
  - 最大重试 3 次
  - 退避乘数 2.0
  - 记录重试历史

#### Scenario 2: LLM Provider 故障自动切换
- **GIVEN** 当前 LLM Provider 不可用
- **WHEN** 健康检查连续失败超过阈值（3 次）
- **THEN** 系统自动切换到备用 Provider：
  - 保持会话上下文一致
  - 通知用户切换信息
  - 记录切换日志

#### Scenario 3: 会话状态异常自动修复
- **GIVEN** Agent 会话状态异常
- **WHEN** 检测到状态不一致或超时
- **THEN** 系统自动恢复到上一个稳定检查点：
  - 通知用户修复过程
  - 保持操作历史完整性
  - 记录修复日志

#### Scenario 4: 不可恢复错误处理
- **GIVEN** 发生不可恢复的错误（如权限不足）
- **WHEN** 重试次数耗尽或错误不可重试
- **THEN** 系统执行以下流程：
  - 记录错误详情
  - 发送故障通知
  - 提示用户人工介入
  - 提供错误详情和解决方案

#### Scenario 5: 人工介入确认
- **GIVEN** 系统需要人工介入处理错误
- **WHEN** 用户查看故障通知并点击确认
- **THEN** 系统记录介入结果：
  - 记录处理人
  - 记录处理时间
  - 记录处理动作
  - 继续或终止任务

#### Scenario 6: 故障通知告警
- **GIVEN** 发生故障需要通知管理员
- **WHEN** 故障发生
- **THEN** 系统根据告警级别发送通知：
  - INFO: 仅记录
  - WARN: 通知用户
  - ERROR: 通知管理员
  - CRITICAL: 通知所有人并锁定系统

---

## 实现规格

### 输入规格

#### execute_with_retry 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| operation | string | 是 | 非空 | 操作名称 |
| context | object | 是 | JSON 对象 | 操作上下文 |
| retryConfig | object | 否 | RetryConfig | 重试配置 |

#### switch_llm_provider 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| target_provider | string | 是 | Provider ID | 目标 Provider |

#### repair_session 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| session_id | string | 是 | UUID 格式 | 会话 ID |

#### confirm_manual_intervention 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| notification_id | string | 是 | UUID 格式 | 通知 ID |
| action | string | 是 | enum | continue, abort, retry |
| user_id | string | 是 | UUID 格式 | 处理人 ID |

### 输出规格

#### RetryConfig 结构

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| max_retries | number | 3 | 最大重试次数 |
| initial_delay_ms | number | 1000 | 初始延迟（毫秒） |
| max_delay_ms | number | 30000 | 最大延迟（毫秒） |
| backoff_multiplier | number | 2.0 | 退避乘数 |
| retryable_errors | string[] | 见下文 | 可重试的错误类型 |

**默认 retryable_errors**: `["network_error", "timeout_error", "llm_error"]`

#### RecoveryStatus 响应

```json
{
  "success": true,
  "data": {
    "isRecovering": true,
    "currentAction": "retrying_tool_call",
    "progress": 66.7,
    "error": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "tool_error",
      "code": "TOOL_CALL_FAILED",
      "message": "工具调用失败",
      "retryCount": 2,
      "createdAt": 1711545600000
    },
    "checkpointId": "checkpoint-001"
  }
}
```

#### SwitchProviderResponse 响应

```json
{
  "success": true,
  "data": {
    "previousProvider": "openai",
    "currentProvider": "zhipu",
    "switchReason": "health_check_failed",
    "switchTime": 1711545600000
  }
}
```

#### RepairSessionResponse 响应

```json
{
  "success": true,
  "data": {
    "sessionId": "session-123",
    "checkpointId": "checkpoint-001",
    "restoredState": {
      "stepIndex": 5,
      "messages": []
    },
    "repairTime": 500
  }
}
```

---

## 边界条件

### 输入边界

| 场景 | 输入 | 预期行为 |
|------|------|----------|
| retryConfig 超限 | max_retries > 10 | 自动修正为 10 |
| initial_delay_ms 为 0 | 0 | 自动修正为 100 |
| backoff_multiplier < 1 | 0.5 | 自动修正为 1.5 |
| target_provider 不存在 | "invalid" | 返回错误：PROVIDER_NOT_FOUND |
| session_id 不存在 | "invalid" | 返回错误：SESSION_NOT_FOUND |
| notification_id 不存在 | "invalid" | 返回错误：NOTIFICATION_NOT_FOUND |
| action 不合法 | "invalid" | 返回错误：INVALID_ACTION |

### 场景边界

| 场景 | 条件 | 预期行为 |
|------|------|----------|
| 连续重试失败 | 3 次重试全部失败 | 触发故障转移或人工介入 |
| 全部 Provider 不可用 | 无健康 Provider | 返回错误：NO_HEALTHY_PROVIDER |
| 会话无检查点 | 首次执行 | 返回错误：NO_CHECKPOINTS |
| 恢复超时 | 恢复操作 > 30s | 返回错误：REPAIR_TIMEOUT |
| 熔断触发 | 连续失败 > 阈值 | 暂停服务并进行告警 |

---

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | HTTP 状态码 | 处理方式 |
|--------|----------|-------------|----------|
| RETRY_EXHAUSTED | 重试次数耗尽 | 500 | 触发故障转移或人工介入 |
| NO_HEALTHY_PROVIDER | 没有可用的 Provider | 503 | 等待恢复或人工配置 |
| PROVIDER_NOT_FOUND | Provider 不存在 | 404 | 检查 Provider 配置 |
| SESSION_NOT_FOUND | 会话不存在 | 404 | 创建新会话 |
| NO_CHECKPOINTS | 没有可用的检查点 | 400 | 提示无法恢复 |
| REPAIR_TIMEOUT | 会话修复超时 | 504 | 终止会话，要求重建 |
| NOTIFICATION_NOT_FOUND | 通知不存在 | 404 | 检查通知 ID |
| INVALID_ACTION | 无效的操作 | 400 | 提示支持的操作 |
| CIRCUIT_BREAKER_OPEN | 熔断器开启 | 503 | 等待冷却后重试 |
| UNRECOVERABLE_ERROR | 不可恢复的错误 | 500 | 记录并请求人工介入 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "RETRY_EXHAUSTED",
    "message": "重试次数耗尽，仍未成功",
    "details": {
      "totalRetries": 3,
      "lastError": {
        "type": "tool_error",
        "code": "TOOL_CALL_FAILED",
        "message": "工具调用失败"
      }
    },
    "recoverable": false,
    "requiresManualIntervention": true
  }
}
```

---

## 数据模型

### AgentError

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| type | string | 错误类型 |
| code | string | 错误码 |
| message | string | 错误信息 |
| context | JSON | 上下文信息 |
| retry_count | number | 已重试次数 |
| recovered | boolean | 是否已恢复 |
| recovered_at | number | 恢复时间戳 |
| created_at | number | 创建时间戳 |

### SessionCheckpoint

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| session_id | string | 会话 ID |
| checkpoint_data | JSON | 检查点数据 |
| created_at | number | 创建时间戳 |

### FailureNotification

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| error_log_id | string | 关联错误 ID |
| notification_type | string | 通知类型 |
| level | string | 告警级别 |
| message | string | 通知消息 |
| acknowledged | boolean | 是否已确认 |
| acknowledged_by | string | 处理人 ID |
| acknowledged_at | number | 处理时间 |
| created_at | number | 创建时间戳 |

---

## 性能要求

| 指标 | 要求 |
|------|------|
| 重试响应延迟 | < 50ms |
| Provider 切换时间 | < 5s |
| 会话恢复时间 | < 2s |
| 熔断器响应时间 | < 100ms |
| 通知发送延迟 | < 1s |
