# Specification: 上下文压缩触发与执行

## 需求来源

### PRD 需求
- FR443: 必须实现 Token 使用实时监测
- FR444: 必须支持上下文窗口阈值检测
- FR445: 必须支持多种压缩策略

### 架构约束
- ADR-031: 上下文管理规范
- ADR-032: 压缩策略规范
- ADR-033: Token 计数规范
- ADR-034: 压缩事件规范

### UX 规范
- UX-01: AI 即入口，透明可控
- UX-04: 操作可追溯

## 功能规格

### 用户故事

**As an** Agent Runtime,
**I want to** 自动监测上下文 Token 使用，在达到阈值时自动触发压缩，
**So that** 保持对话连贯性，避免上下文溢出导致的对话中断。

## 输入输出规格

### 输入规格

#### invoke_trigger_compression 命令输入

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| session_id | string | 是 | 会话唯一标识 | 非空 |
| strategy | string | 否 | 压缩策略名称 | 默认 "hybrid" |
| force | boolean | 否 | 是否强制压缩 | 默认 false |

#### invoke_get_token_usage 命令输入

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| session_id | string | 是 | 会话唯一标识 | 非空 |

### 输出规格

#### invoke_trigger_compression 命令输出

| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 压缩是否成功 |
| original_tokens | number | 原始 Token 数 |
| compressed_tokens | number | 压缩后 Token 数 |
| compression_ratio | number | 压缩比 |
| applied_strategies | string[] | 应用的策略列表 |
| preserved_elements | string[] | 保留的关键元素 |
| discarded_elements | string[] | 丢弃的元素 |

#### invoke_get_token_usage 命令输出

| 字段 | 类型 | 描述 |
|------|------|------|
| current_tokens | number | 当前 Token 数 |
| max_tokens | number | 最大 Token 数 |
| usage_rate | number | 使用率 (0-1) |
| is_warning | boolean | 是否警告状态 |
| is_critical | boolean | 是否严重状态 |
| recommended_action | string | 建议动作 |

## 验收场景

### 场景 1: 自动压缩触发

**Given** 对话上下文 Token 使用率达到 80%
**When** 用户发送新消息
**Then** 系统自动触发压缩流程
**And** 发送 `compression_start` 事件到前端
**And** 用户可以看到压缩进度

### 场景 2: 强制压缩触发

**Given** 对话上下文 Token 使用率达到 95%
**When** 用户发送新消息
**Then** 系统立即触发强制压缩（force_compress）
**And** 跳过用户确认步骤

### 场景 3: 手动压缩触发

**Given** 用户手动调用 `invoke_trigger_compression`
**When** 命令执行
**Then** 系统执行压缩并返回压缩结果
**And** 更新会话上下文

### 场景 4: 摘要生成压缩

**Given** 用户选择 "summarize" 策略
**When** 压缩执行
**Then** 系统生成对话历史摘要
**And** 保留关键信息和结论
**And** 返回压缩比约 30%

### 场景 5: 滑动窗口压缩

**Given** 用户选择 "sliding_window" 策略
**When** 压缩执行
**Then** 系统保留最近 N 条消息
**And** 丢弃较早的消息
**And** 保留系统上下文

### 场景 6: 关键事实提取压缩

**Given** 用户选择 "key_fact_extraction" 策略
**When** 压缩执行
**Then** 系统提取关键实体、决策和偏好
**And** 生成结构化的关键事实列表
**And** 返回压缩比约 20%

### 场景 7: 混合策略压缩

**Given** 用户未指定策略或选择 "hybrid"
**When** 压缩执行
**Then** 系统依次应用：关键事实提取 → 摘要生成 → 滑动窗口
**And** 根据上下文类型自动调整各策略比例

### 场景 8: 压缩通知

**Given** 压缩过程开始
**When** 压缩各阶段执行
**Then** 前端收到 `compression_progress` 事件（phase, progress_percent）
**When** 压缩完成
**Then** 前端收到 `compression_complete` 事件

### 场景 9: 空上下文压缩

**Given** 对话历史为空
**When** 用户触发压缩
**Then** 返回原上下文，不执行压缩
**And** 返回 success: true, compression_ratio: 1.0

### 场景 10: Token 使用查询

**Given** 用户调用 `invoke_get_token_usage`
**When** 命令执行
**Then** 返回当前 Token 使用情况
**And** 包含使用率和推荐动作

## 压缩事件规格

### compression_start 事件

```json
{
  "type": "compression_start",
  "session_id": "sess_xxx",
  "current_tokens": 7500,
  "target_tokens": 5000,
  "estimated_duration_ms": 1500
}
```

### compression_progress 事件

```json
{
  "type": "compression_progress",
  "session_id": "sess_xxx",
  "phase": "summarizing",
  "progress_percent": 0.65
}
```

### compression_complete 事件

```json
{
  "type": "compression_complete",
  "session_id": "sess_xxx",
  "original_tokens": 7500,
  "compressed_tokens": 4200,
  "compression_ratio": 0.56,
  "applied_strategies": ["key_fact_extraction", "summarize"]
}
```

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | 处理方式 | 严重级别 |
|--------|----------|----------|----------|
| CC001 | Session not found | 返回错误 | ERROR |
| CC002 | Compression timeout | 返回错误，可重试 | ERROR |
| CC003 | Strategy not found | 使用默认策略 | WARN |
| CC004 | Context too large | 强制压缩 | WARN |
| CC005 | Compression failed | 返回错误详情 | ERROR |
| CC006 | Invalid strategy params | 返回错误 | ERROR |
| CC007 | Summary generation failed | 降级到滑动窗口 | WARN |

### 错误响应结构

```json
{
  "success": false,
  "error": {
    "code": "CC002",
    "message": "Compression timeout after 5000ms",
    "severity": "ERROR",
    "can_retry": true
  },
  "original_tokens": 8000,
  "compressed_tokens": null
}
```

## 边界条件

### 边界条件清单

| 边界条件 | 预期行为 |
|----------|----------|
| session_id 为空 | 返回 CC001 错误 |
| 上下文为空 | 返回原上下文，compression_ratio = 1.0 |
| 已达到 max_tokens | 强制压缩，忽略 force 参数 |
| 压缩后仍超限 | 继续压缩直到满足限制 |
| 未知策略名 | 使用默认 hybrid 策略 |
| 压缩超时 | 返回 CC002 错误，保留原上下文 |
| 压缩过程中新消息 | 新消息进入队列，等待压缩完成 |

### Token 估算规则

与 Story 53.1 保持一致：

1. **中文**: 1 Token ≈ 1.5 字符
2. **英文**: 1 Token ≈ 4 字符
3. **代码**: 1 Token ≈ 4 字符

### 阈值配置

| 阈值类型 | 默认值 | 可配置范围 |
|----------|--------|------------|
| warning_threshold | 0.8 | 0.6 - 0.9 |
| critical_threshold | 0.9 | 0.8 - 0.95 |
| force_threshold | 0.95 | 0.9 - 0.99 |

### 压缩策略参数

#### SummarizeStrategy

| 参数 | 默认值 | 说明 |
|------|--------|------|
| preserve_ratio | 0.3 | 保留比例 |
| max_length | 2000 | 最大长度 |

#### SlidingWindowStrategy

| 参数 | 默认值 | 说明 |
|------|--------|------|
| window_size | 20 | 窗口大小（消息数） |
| preserve_recent | true | 保留最近消息 |

#### KeyFactExtractionStrategy

| 参数 | 默认值 | 说明 |
|------|--------|------|
| max_facts | 50 | 最大事实数 |
| relevance_threshold | 0.7 | 相关性阈值 |

### 性能指标

| 指标 | 目标值 |
|------|--------|
| 压缩延迟 | < 2s |
| 压缩过程内存增量 | < 50MB |
| Token 估算误差 | < 5% |
