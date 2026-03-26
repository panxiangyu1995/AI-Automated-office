# Specification: 性能监控与指标收集

## 需求来源

### PRD 需求
- **FR606**: 性能监控 - 系统应提供性能监控能力
- **FR607**: 指标收集 - 支持关键性能指标的收集
- **FR608**: 告警管理 - 支持性能告警配置和通知

### 架构约束
- **ADR-023**: 监控与可观测性设计

### UX 规范
- **UX-01**: 核心交互设计原则

### NFR 约束
- **NFR1**: 响应性 - 操作响应时间 < 2s
- **NFR16**: 可靠性 - 系统可用性 > 99.9%
- **NFR23**: 可观测性 - 系统状态可追踪

---

## 功能规格

### 用户故事

**As an** System Administrator,
**I want to** 实时监控系统性能指标，及时发现和处理性能问题，
**So that** 我可以保障系统稳定运行，满足 SLA 要求。

### 验收场景

#### Scenario 1: 记录 Agent 响应时间
- **GIVEN** 用户通过 Agent 执行任务
- **WHEN** Agent 产生响应
- **THEN** 系统记录以下指标：
  - 首次响应时间（TTFT）
  - 完整响应时间（TTCT）
  - 各步骤响应时间

#### Scenario 2: 记录 Token 使用
- **GIVEN** 用户通过 Agent 执行任务
- **WHEN** LLM 调用完成
- **THEN** 系统记录以下指标：
  - Prompt Token 数量
  - Completion Token 数量
  - 总 Token 数量
  - Token 使用成本估算

#### Scenario 3: 记录工具调用成功率
- **GIVEN** 用户通过 Agent 执行任务
- **WHEN** 工具调用完成（成功或失败）
- **THEN** 系统记录以下指标：
  - 工具名称
  - 调用结果（成功/失败）
  - 失败原因（如果失败）
  - 执行时长

#### Scenario 4: 查询历史指标
- **GIVEN** 管理员需要查看历史性能数据
- **WHEN** 管理员设置查询条件（时间范围、指标类型）
- **THEN** 系统返回聚合后的指标数据：
  - 支持按时间间隔聚合
  - 支持多指标查询
  - 支持维度过滤

#### Scenario 5: 设置告警规则
- **GIVEN** 管理员需要配置性能告警
- **WHEN** 管理员创建或更新告警规则
- **THEN** 系统保存告警规则：
  - 支持条件：大于、小于、等于、大于等于、小于等于
  - 支持告警级别：INFO、WARN、CRITICAL
  - 支持冷却时间配置

#### Scenario 6: 触发告警
- **GIVEN** 告警规则已配置且启用
- **WHEN** 指标值满足告警条件
- **THEN** 系统触发告警：
  - 记录告警历史
  - 通知相关人员
  - 显示告警信息

#### Scenario 7: 确认告警
- **GIVEN** 告警已触发
- **WHEN** 管理员确认告警
- **THEN** 系统更新告警状态：
  - 记录确认人
  - 记录确认时间
  - 更新告警状态

#### Scenario 8: 查看实时指标
- **GIVEN** 管理员需要查看系统实时状态
- **WHEN** 管理员打开性能监控仪表板
- **THEN** 系统显示实时指标：
  - 活跃会话数
  - 每分钟请求数
  - 平均响应时间
  - 错误率
  - Token 使用率

---

## 实现规格

### 输入规格

#### record_metric 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| metric_type | string | 是 | 枚举值 | response_time, token_usage, tool_success, error_rate, resource_usage |
| metric_name | string | 是 | 非空 | 指标名称 |
| value | number | 是 | - | 指标值 |
| unit | string | 是 | 枚举值 | ms, count, percentage, bytes |
| dimensions | object | 否 | JSON 对象 | 维度信息 |

#### query_metrics 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| metric_names | string[] | 否 | 指标名称数组 | 查询的指标 |
| start_time | number | 否 | Unix timestamp | 开始时间 |
| end_time | number | 否 | Unix timestamp | 结束时间 |
| dimensions | object | 否 | JSON 对象 | 维度过滤 |
| aggregation | string | 否 | enum | avg, sum, count, max, min |
| interval | number | 否 | 秒 | 分组间隔 |

#### set_alert_rule 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| id | string | 否 | UUID 格式 | 规则 ID（新增时不填） |
| name | string | 是 | 非空 | 规则名称 |
| metric_name | string | 是 | 指标名称 | 监控的指标 |
| condition | string | 是 | enum | gt, lt, eq, gte, lte |
| threshold | number | 是 | - | 阈值 |
| severity | string | 是 | enum | info, warning, critical |
| enabled | boolean | 否 | 默认 true | 是否启用 |
| cooldown_seconds | number | 否 | 默认 300 | 冷却时间（秒） |

### 输出规格

#### RealtimeMetrics 响应

```json
{
  "success": true,
  "data": {
    "activeSessions": 10,
    "requestsPerMinute": 45.5,
    "avgResponseTime": 1250.3,
    "errorRate": 0.02,
    "tokenUsagePerMinute": 15000
  }
}
```

#### query_metrics 响应

```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "metricName": "time_to_complete",
        "timestamp": 1711545600000,
        "value": 1250.3,
        "unit": "ms",
        "aggregation": "avg"
      }
    ],
    "total": 100
  }
}
```

#### set_alert_rule 响应

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "响应时间告警",
    "metricName": "time_to_complete",
    "condition": "gt",
    "threshold": 5000,
    "severity": "critical",
    "enabled": true,
    "cooldownSeconds": 300,
    "createdAt": 1711545600000
  }
}
```

#### get_alert_history 响应

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-001",
        "ruleId": "rule-001",
        "metricValue": 5500,
        "triggeredAt": 1711545600000,
        "resolvedAt": 1711545660000,
        "status": "resolved",
        "acknowledgedBy": "user-001",
        "acknowledgedAt": 1711545630000
      }
    ],
    "total": 10
  }
}
```

---

## 边界条件

### 输入边界

| 场景 | 输入 | 预期行为 |
|------|------|----------|
| 无效 metric_type | `"invalid"` | 返回错误：INVALID_METRIC_TYPE |
| 无效 unit | `"invalid"` | 返回错误：INVALID_UNIT |
| 无效 condition | `"invalid"` | 返回错误：INVALID_CONDITION |
| 无效 severity | `"invalid"` | 返回错误：INVALID_SEVERITY |
| cooldown < 60 | 30 | 自动修正为 60 |
| interval = 0 | 0 | 返回错误：INVALID_INTERVAL |
| 时间范围超限 | > 30 天 | 返回错误：TIME_RANGE_TOO_LARGE |

### 场景边界

| 场景 | 条件 | 预期行为 |
|------|------|----------|
| 查询无结果 | 没有任何指标 | 返回空列表 |
| 告警规则冲突 | 同指标同条件 | 更新现有规则 |
| 冷却中触发 | 同一规则冷却期内 | 忽略本次触发 |
| 指标数据过期 | > 90 天 | 自动清理 |

---

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | HTTP 状态码 | 处理方式 |
|--------|----------|-------------|----------|
| INVALID_METRIC_TYPE | 无效的指标类型 | 400 | 返回支持的类型 |
| INVALID_UNIT | 无效的单位 | 400 | 返回支持的单位 |
| INVALID_CONDITION | 无效的条件 | 400 | 返回支持的条件 |
| INVALID_SEVERITY | 无效的告警级别 | 400 | 返回支持的级别 |
| INVALID_INTERVAL | 无效的分组合间隔 | 400 | 提示有效范围 |
| TIME_RANGE_TOO_LARGE | 时间范围过大 | 400 | 提示最大范围 |
| RULE_NOT_FOUND | 告警规则不存在 | 404 | 检查规则 ID |
| ALERT_NOT_FOUND | 告警不存在 | 404 | 检查告警 ID |
| DATABASE_ERROR | 数据库错误 | 500 | 记录错误日志 |
| COLLECTION_ERROR | 指标收集错误 | 500 | 记录错误日志 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_METRIC_TYPE",
    "message": "无效的指标类型：invalid",
    "details": {
      "supportedTypes": ["response_time", "token_usage", "tool_success", "error_rate", "resource_usage"]
    }
  }
}
```

---

## 数据模型

### PerformanceMetric

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| metric_type | string | 指标类型 |
| metric_name | string | 指标名称 |
| value | number | 指标值 |
| unit | string | 单位 |
| dimensions | JSON | 维度信息 |
| timestamp | number | 时间戳 |
| created_at | number | 创建时间 |

### AlertRule

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| name | string | 规则名称 |
| metric_name | string | 指标名称 |
| condition | string | 条件 |
| threshold | number | 阈值 |
| severity | string | 告警级别 |
| enabled | boolean | 是否启用 |
| cooldown_seconds | number | 冷却时间 |
| created_at | number | 创建时间 |
| updated_at | number | 更新时间 |

### AlertHistory

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| rule_id | string | 关联规则 ID |
| metric_value | number | 触发时的指标值 |
| triggered_at | number | 触发时间 |
| resolved_at | number | 解决时间 |
| status | string | 状态 |
| acknowledged_by | string | 确认人 |
| acknowledged_at | number | 确认时间 |

---

## 性能要求

| 指标 | 要求 |
|------|------|
| 指标收集延迟 | < 5ms |
| 实时指标更新间隔 | 1s |
| 历史查询响应时间 | < 1s |
| 告警触发延迟 | < 1s |
| 数据保留期限 | 90 天 |
| 最大指标数/秒 | 10000 |
