# Specification: Sub-Agent执行监控与诊断

## 需求来源

### PRD 需求
- FR924: Sub-Agent执行必须支持实时监控
- FR938: Sub-Agent执行必须支持调用链路追踪

### 架构约束
- ADR-013: Sub-Agent架构设计规范
- ADR-023: 可观测性设计规范

### UX 规范
- UX-01: Agent对话交互规范
- UX-04: 实时状态展示规范

## 功能规格

### 用户故事

**As an** Agent Runtime System,
**I want to** 实现sub-agent执行的实时监控、性能指标收集、调用链路追踪，集成到现有的subagentexecutionmonitor,
**So that** 我可以实时了解Sub-Agent的执行状态，快速定位和诊断问题。

### 核心概念

1. **RuntimeEvent**: 运行时事件，描述Sub-Agent执行过程中的状态变化
2. **PerformanceMetric**: 性能指标，包含响应时间、Token使用量等度量数据
3. **TracingSpan**: 追踪跨度，代表调用链路中的一个执行单元
4. **ExecutionLogEntry**: 执行日志条目，记录详细的执行信息

## 输入输出规格

### subscribe_runtime_events 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| contextId | string | 是 | 非空，UUID格式 | 上下文ID |

### subscribe_runtime_events 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| 类型 | Stream<RuntimeEvent> | 运行时事件流 |

### record_metric 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| metricId | string | 是 | 非空 | 指标ID |
| contextId | string | 是 | 非空 | 上下文ID |
| callId | string | 否 | - | 调用ID |
| type | MetricType | 是 | 枚举值 | 指标类型 |
| value | number | 是 | - | 指标值 |
| unit | MetricUnit | 是 | 枚举值 | 单位 |
| timestamp | number | 是 | 正整数 | 时间戳 |

### query_monitoring_data 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| queryType | MonitoringQueryType | 是 | 枚举值 | 查询类型 |
| contextId | string | 否 | UUID格式 | 上下文ID过滤 |
| callId | string | 否 | UUID格式 | 调用ID过滤 |
| timeRange | TimeRange | 是 | - | 时间范围 |
| filters | MonitoringFilter[] | 否 | - | 过滤条件 |

### query_monitoring_data 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| events | RuntimeEvent[] | 事件列表（queryType=events时） |
| metrics | PerformanceMetric[] | 指标列表（queryType=metrics时） |
| tracing | TracingData | 追踪数据（queryType=tracing时） |
| logs | ExecutionLogEntry[] | 日志列表（queryType=logs时） |

### get_monitoring_summary 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| timeRange | TimeRange | 是 | - | 时间范围 |

### get_monitoring_summary 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| timeRange | TimeRange | 时间范围 |
| totalCalls | number | 总调用数 |
| successfulCalls | number | 成功调用数 |
| failedCalls | number | 失败调用数 |
| avgResponseTimeMs | number | 平均响应时间（毫秒） |
| totalTokensUsed | number | 总Token使用量 |
| errors | ErrorSummary[] | 错误列表 |
| performanceTrend | PerformanceTrendPoint[] | 性能趋势 |

## 验收场景

### 场景1: 订阅运行时事件

- **GIVEN** Sub-Agent执行过程中
- **WHEN** 监控客户端订阅指定上下文的运行时事件
- **THEN** 客户端收到该上下文的所有后续事件

**详细步骤**:
1. 客户端调用`subscribe_runtime_events`并提供contextId
2. 返回事件流
3. 当Sub-Agent执行过程中发生状态变化时，事件被推送到流中
4. 事件类型包括：ContextCreated、CallStarted、ToolInvoked、StatusChanged等

### 场景2: 记录响应时间指标

- **GIVEN** Sub-Agent调用执行完成
- **WHEN** 记录响应时间指标
- **THEN** 指标被存储并可用于聚合查询

**详细步骤**:
1. 在调用结束是记录durationMs
2. 创建PerformanceMetric，type为ResponseTime
3. 调用`record_metric`存储
4. 指标可用于后续的聚合查询

### 场景3: 记录Token使用量

- **GIVEN** LLM调用完成
- **WHEN** 记录Token使用量
- **THEN** 输入和输出的Token数被分别记录

**详细步骤**:
1. LLM调用完成后获取input_tokens和output_tokens
2. 创建PerformanceMetric，type为TokenUsed
3. 值为input_tokens + output_tokens
4. 调用`record_metric`存储

### 场景4: 调用链路追踪

- **GIVEN** 发生了嵌套的Sub-Agent调用
- **WHEN** 调用完成后查询追踪数据
- **THEN** 返回完整的调用链路树结构

**详细步骤**:
1. 每个Sub-Agent调用开始时创建TracingSpan
2. 调用结束时更新span的endTime和status
3. spans按照父子关系构建为树
4. 通过`get_tracing_data`可获取完整链路

### 场景5: 查询监控日志

- **GIVEN** 需要查看特定上下文的执行日志
- **WHEN** 调用`query_monitoring_data`查询logs
- **THEN** 返回该上下文的日志列表

**详细步骤**:
1. 构建MonitoringQueryRequest，queryType为Logs
2. 设置contextId和时间范围
3. 调用`query_monitoring_data`
4. 返回按时间排序的日志列表

### 场景6: 获取监控摘要

- **GIVEN** 需要了解整体运行状况
- **WHEN** 调用`get_monitoring_summary`
- **THEN** 返回包含调用统计、错误列表、性能趋势的摘要

**详细步骤**:
1. 定义时间范围
2. 聚合该时间范围内的所有指标
3. 统计成功/失败调用数
4. 计算平均响应时间
5. 汇总错误信息
6. 生成性能趋势点
7. 返回MonitoringSummary

### 场景7: 性能趋势分析

- **GIVEN** 需要分析Sub-Agent的性能趋势
- **WHEN** 获取监控摘要中的performanceTrend
- **THEN** 返回按时间排列的性能数据点

**详细步骤**:
1. 将时间范围切分为多个时间窗口
2. 每个窗口计算平均响应时间、Token使用量、调用数
3. 返回PerformanceTrendPoint数组

## 错误处理

### 错误码定义

| 错误码 | 错误名称 | 错误信息 | 处理方式 |
|--------|----------|----------|----------|
| MONITOR_001 | ContextNotFound | "Context not found: {contextId}" | 返回404，检查上下文ID |
| MONITOR_002 | SubscriptionFailed | "Failed to subscribe to events: {detail}" | 返回错误，检查订阅参数 |
| MONITOR_003 | MetricRecordFailed | "Failed to record metric: {detail}" | 返回错误，检查指标数据 |
| MONITOR_004 | QueryFailed | "Monitoring query failed: {detail}" | 返回错误，检查查询参数 |
| MONITOR_005 | TraceNotFound | "Trace not found: {traceId}" | 返回404，检查追踪ID |
| MONITOR_006 | BufferFull | "Event buffer is full, some events may be lost" | 系统警告，降低事件频率 |

## 枚举类型定义

### RuntimeEventType

| 值 | 描述 |
|----|------|
| ContextCreated | 上下文创建 |
| ContextDestroyed | 上下文销毁 |
| CallStarted | 调用开始 |
| CallCompleted | 调用完成 |
| CallFailed | 调用失败 |
| ToolInvoked | 工具调用 |
| ToolCompleted | 工具完成 |
| ToolFailed | 工具失败 |
| MemoryInjected | 记忆注入 |
| NestingDepthChanged | 嵌套深度变化 |
| StatusChanged | 状态变化 |

### MetricType

| 值 | 描述 | 单位 |
|----|------|------|
| ResponseTime | 响应时间 | ms |
| TokenUsed | Token使用量 | tokens |
| TokenLimit | Token限制 | tokens |
| TokenRate | Token速率 | tokens/s |
| ErrorCount | 错误计数 | count |
| ToolCallCount | 工具调用次数 | count |
| SubAgentCallCount | Sub-Agent调用次数 | count |
| MemoryUsage | 内存使用 | bytes |

### MetricUnit

| 值 | 描述 |
|----|------|
| Milliseconds | 毫秒 |
| Seconds | 秒 |
| Count | 计数 |
| Tokens | Token数 |
| Bytes | 字节 |
| Percent | 百分比 |

### LogLevel

| 值 | 描述 |
|----|------|
| Debug | 调试级别 |
| Info | 信息级别 |
| Warning | 警告级别 |
| Error | 错误级别 |

### LogSource

| 值 | 描述 |
|----|------|
| Context | 上下文操作 |
| NestedCall | 嵌套调用 |
| ToolExecution | 工具执行 |
| MemoryInjection | 记忆注入 |
| ResultNormalization | 结果归一化 |

### SpanStatus

| 值 | 描述 |
|----|------|
| Unset | 未设置 |
| Ok | 成功 |
| Error | 错误 |

### MonitoringQueryType

| 值 | 描述 |
|----|------|
| Events | 运行时事件 |
| Metrics | 性能指标 |
| Tracing | 调用追踪 |
| Logs | 执行日志 |
| Summary | 监控摘要 |

## 边界条件

1. **事件缓冲区满**: 当事件缓冲区满时，最旧的事件被丢弃，并发出MONITOR_006警告
2. **指标存储限制**: 单个指标的存储上限为10000条，超出后删除最旧的
3. **日志存储限制**: 单个上下文的日志存储上限为5000条
4. **追踪数据保留**: 追踪数据在24小时后自动清理
5. **查询时间范围**: 最大支持查询7天内的数据
6. **采样降频**: 高频事件（如心跳）每秒最多记录10条
7. **空结果**: 查询结果为空时返回空数组而非错误
