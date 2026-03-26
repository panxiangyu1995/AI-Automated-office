# Design: Sub-Agent执行监控与诊断

## 技术方案

### 实现类型
- **类型**: refactor（重构扩展）
- **优先级**: medium
- **阶段**: Phase 2 - Sub-Agent运行时实现
- **实现方式**: 前后端协同，前端定义类型接口，后端扩展现有Monitor实现

### API设计

#### 前端类型定义

```typescript
// src/features/agent/types/subagent-monitor.types.ts

/**
 * 实时运行时事件
 */
export interface RuntimeEvent {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  type: RuntimeEventType;
  /** 关联的上下文ID */
  contextId: string;
  /** 关联的调用ID */
  callId?: string;
  /** 事件时间戳 */
  timestamp: number;
  /** 事件数据 */
  data: Record<string, unknown>;
}

/**
 * 运行时事件类型
 */
export enum RuntimeEventType {
  ContextCreated = 'context_created',
  ContextDestroyed = 'context_destroyed',
  CallStarted = 'call_started',
  CallCompleted = 'call_completed',
  CallFailed = 'call_failed',
  ToolInvoked = 'tool_invoked',
  ToolCompleted = 'tool_completed',
  ToolFailed = 'tool_failed',
  MemoryInjected = 'memory_injected',
  NestingDepthChanged = 'nesting_depth_changed',
  StatusChanged = 'status_changed',
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 指标ID */
  metricId: string;
  /** 关联的上下文ID */
  contextId: string;
  /** 关联的调用ID */
  callId?: string;
  /** 指标类型 */
  type: MetricType;
  /** 指标值 */
  value: number;
  /** 单位 */
  unit: MetricUnit;
  /** 记录时间 */
  timestamp: number;
}

/**
 * 指标类型
 */
export enum MetricType {
  ResponseTime = 'response_time',         // 响应时间
  TokenUsed = 'token_used',               // Token使用量
  TokenLimit = 'token_limit',             // Token限制
  TokenRate = 'token_rate',               // Token速率
  ErrorCount = 'error_count',             // 错误计数
  ToolCallCount = 'tool_call_count',      // 工具调用次数
  SubAgentCallCount = 'sub_agent_call_count', // Sub-Agent调用次数
  MemoryUsage = 'memory_usage',            // 内存使用
}

/**
 * 指标单位
 */
export enum MetricUnit {
  Milliseconds = 'ms',    // 毫秒
  Seconds = 's',          // 秒
  Count = 'count',        // 计数
  Tokens = 'tokens',      // Token数
  Bytes = 'bytes',       // 字节
  Percent = '%',          // 百分比
}

/**
 * 调用链路追踪数据
 */
export interface TracingData {
  /** 追踪ID */
  traceId: string;
  /** 根调用ID */
  rootCallId: string;
  /** 跨度列表 */
  spans: TracingSpan[];
  /** 创建时间 */
  createdAt: number;
}

/**
 * 追踪跨度
 */
export interface TracingSpan {
  /** 跨度ID */
  spanId: string;
  /** 父跨度ID */
  parentSpanId?: string;
  /** 跨度名称 */
  name: string;
  /** Sub-Agent ID */
  subAgentId: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 持续时间（毫秒） */
  durationMs?: number;
  /** 跨度状态 */
  status: SpanStatus;
  /** 跨度属性 */
  attributes: Record<string, string | number | boolean>;
  /** 子跨度 */
  children: TracingSpan[];
}

/**
 * 跨度状态
 */
export enum SpanStatus {
  Unset = 'unset',
  Ok = 'ok',
  Error = 'error',
}

/**
 * 执行日志条目
 */
export interface ExecutionLogEntry {
  /** 日志ID */
  logId: string;
  /** 关联的上下文ID */
  contextId: string;
  /** 关联的调用ID */
  callId?: string;
  /** 日志级别 */
  level: LogLevel;
  /** 日志消息 */
  message: string;
  /** 日志来源 */
  source: LogSource;
  /** 时间戳 */
  timestamp: number;
  /** 附加数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 日志级别
 */
export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

/**
 * 日志来源
 */
export enum LogSource {
  Context = 'context',
  NestedCall = 'nested_call',
  ToolExecution = 'tool_execution',
  MemoryInjection = 'memory_injection',
  ResultNormalization = 'result_normalization',
}

/**
 * 监控数据查询请求
 */
export interface MonitoringQueryRequest {
  /** 查询类型 */
  queryType: MonitoringQueryType;
  /** 上下文ID */
  contextId?: string;
  /** 调用ID */
  callId?: string;
  /** 时间范围 */
  timeRange: TimeRange;
  /** 过滤条件 */
  filters?: MonitoringFilter[];
}

/**
 * 查询类型
 */
export enum MonitoringQueryType {
  Events = 'events',
  Metrics = 'metrics',
  Tracing = 'tracing',
  Logs = 'logs',
  Summary = 'summary',
}

/**
 * 时间范围
 */
export interface TimeRange {
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
}

/**
 * 监控过滤条件
 */
export interface MonitoringFilter {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator: FilterOperator;
  /** 值 */
  value: unknown;
}

/**
 * 过滤操作符
 */
export enum FilterOperator {
  Eq = 'eq',
  Ne = 'ne',
  Gt = 'gt',
  Gte = 'gte',
  Lt = 'lt',
  Lte = 'lte',
  In = 'in',
  Contains = 'contains',
}

/**
 * 监控摘要
 */
export interface MonitoringSummary {
  /** 摘要时间范围 */
  timeRange: TimeRange;
  /** 总调用数 */
  totalCalls: number;
  /** 成功调用数 */
  successfulCalls: number;
  /** 失败调用数 */
  failedCalls: number;
  /** 平均响应时间 */
  avgResponseTimeMs: number;
  /** 总Token使用量 */
  totalTokensUsed: number;
  /** 错误列表 */
  errors: ErrorSummary[];
  /** 性能趋势 */
  performanceTrend: PerformanceTrendPoint[];
}

/**
 * 错误摘要
 */
export interface ErrorSummary {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误次数 */
  count: number;
  /** 最近发生时间 */
  lastOccurrence: number;
}

/**
 * 性能趋势点
 */
export interface PerformanceTrendPoint {
  /** 时间戳 */
  timestamp: number;
  /** 响应时间 */
  responseTimeMs: number;
  /** Token使用量 */
  tokensUsed: number;
  /** 调用数 */
  callCount: number;
}
```

#### Rust后端接口

```rust
// src-tauri/src/agent/subagent/commands.rs (扩展)

use serde::{Deserialize, Serialize};
use tauri::command;

/// 订阅运行时事件
#[command]
pub async fn subscribe_runtime_events(
    context_id: String,
) -> Result<Stream<RuntimeEvent>, String> {
    // 实现逻辑
}

/// 记录性能指标
#[command]
pub async fn record_metric(
    metric: PerformanceMetric,
) -> Result<(), String> {
    // 实现逻辑
}

/// 查询监控数据
#[command]
pub async fn query_monitoring_data(
    request: MonitoringQueryRequest,
) -> Result<MonitoringQueryResult, String> {
    // 实现逻辑
}

/// 获取监控摘要
#[command]
pub async fn get_monitoring_summary(
    time_range: TimeRange,
) -> Result<MonitoringSummary, String> {
    // 实现逻辑
}

/// 获取追踪数据
#[command]
pub async fn get_tracing_data(
    trace_id: String,
) -> Result<TracingData, String> {
    // 实现逻辑
}
```

### 模块结构

```
src-tauri/src/agent/
├── mod.rs                          # Agent模块入口
├── subagent/
│   ├── mod.rs                      # SubAgent子模块入口
│   ├── monitor.rs                  # 监控核心（扩展现有实现）
│   ├── metrics.rs                  # 性能指标收集（新增）
│   ├── tracing.rs                  # 调用链路追踪（新增）
│   ├── events.rs                   # 事件系统（新增）
│   └── logging.rs                  # 日志记录（新增）
```

### 技术方案详解

#### 1. 监控核心扩展

```rust
// src-tauri/src/agent/subagent/monitor.rs

/// Sub-Agent执行监控器（扩展）
pub struct SubAgentExecutionMonitor {
    /// 事件发布者
    event_publisher: EventPublisher<RuntimeEvent>,
    /// 指标收集器
    metrics_collector: Arc<MetricsCollector>,
    /// 追踪器
    tracer: Arc<SubAgentTracer>,
    /// 日志记录器
    logger: Arc<ExecutionLogger>,
    /// 订阅者列表
    subscribers: RwLock<HashMap<String, UnboundedSender<RuntimeEvent>>>,
}

/// 监控事件类型
#[derive(Debug, Clone)]
pub enum MonitorEvent {
    ContextCreated(String),
    ContextDestroyed(String),
    CallStarted(CallInfo),
    CallCompleted(CallResult),
    CallFailed(CallError),
    ToolInvoked(ToolInfo),
    ToolCompleted(ToolResult),
    NestingDepthChanged { context_id: String, depth: u32 },
    StatusChanged { context_id: String, old: ContextStatus, new: ContextStatus },
}

impl SubAgentExecutionMonitor {
    /// 创建监控器实例
    pub fn new() -> Self {
        Self {
            event_publisher: EventPublisher::new(1024), // 缓冲区大小
            metrics_collector: Arc::new(MetricsCollector::new()),
            tracer: Arc::new(SubAgentTracer::new()),
            logger: Arc::new(ExecutionLogger::new()),
            subscribers: RwLock::new(HashMap::new()),
        }
    }

    /// 订阅事件
    pub async fn subscribe(
        &self,
        context_id: String,
    ) -> Result<UnboundedReceiver<RuntimeEvent>, MonitorError> {
        let (tx, rx) = tokio::sync::mpsc::unbounded_channel();

        let mut subscribers = self.subscribers.write().await;
        subscribers.insert(context_id, tx);

        Ok(rx)
    }

    /// 发布事件
    pub async fn publish(&self, event: RuntimeEvent) {
        self.event_publisher.publish(event.clone()).await;

        // 同时记录日志
        self.logger.log_event(&event).await;
    }

    /// 记录指标
    pub async fn record_metric(&self, metric: PerformanceMetric) {
        self.metrics_collector.record(metric).await;
    }

    /// 开始追踪
    pub fn start_trace(&self, call_id: &str, sub_agent_id: &str) -> TraceGuard {
        self.tracer.start_span(call_id, sub_agent_id)
    }
}
```

#### 2. 性能指标收集

```rust
// src-tauri/src/agent/subagent/metrics.rs

/// 性能指标收集器
pub struct MetricsCollector {
    /// 指标存储
    storage: RwLock<Vec<PerformanceMetric>>,
    /// 聚合指标缓存
    aggregated: RwLock<HashMap<String, AggregatedMetric>>,
    /// 最大存储数量
    max_storage_size: usize,
}

impl MetricsCollector {
    /// 记录单个指标
    pub async fn record(&self, metric: PerformanceMetric) {
        let mut storage = self.storage.write().await;

        // 添加到存储
        storage.push(metric);

        // 限制存储大小
        if storage.len() > self.max_storage_size {
            storage.drain(0..1000); // 删除最早的1000条
        }

        // 更新聚合缓存
        self.update_aggregated(&metric).await;
    }

    /// 记录响应时间
    pub async fn record_response_time(
        &self,
        context_id: &str,
        call_id: &str,
        duration_ms: u64,
    ) {
        self.record(PerformanceMetric {
            metric_id: Uuid::new_v4().to_string(),
            context_id: context_id.to_string(),
            call_id: Some(call_id.to_string()),
            metric_type: MetricType::ResponseTime,
            value: duration_ms as f64,
            unit: MetricUnit::Milliseconds,
            timestamp: Utc::now().timestamp_millis(),
        }).await;
    }

    /// 记录Token使用量
    pub async fn record_token_usage(
        &self,
        context_id: &str,
        call_id: &str,
        input_tokens: u64,
        output_tokens: u64,
    ) {
        self.record(PerformanceMetric {
            metric_id: Uuid::new_v4().to_string(),
            context_id: context_id.to_string(),
            call_id: Some(call_id.to_string()),
            metric_type: MetricType::TokenUsed,
            value: (input_tokens + output_tokens) as f64,
            unit: MetricUnit::Tokens,
            timestamp: Utc::now().timestamp_millis(),
        }).await;
    }

    /// 查询指标
    pub async fn query(
        &self,
        request: &MonitoringQueryRequest,
    ) -> Vec<PerformanceMetric> {
        let storage = self.storage.read().await;

        storage
            .iter()
            .filter(|m| self.matches_filter(m, request))
            .cloned()
            .collect()
    }

    /// 计算聚合指标
    pub async fn get_aggregated(&self, metric_type: MetricType) -> AggregatedMetric {
        let aggregated = self.aggregated.read().await;
        aggregated
            .get(&format!("{:?}", metric_type))
            .cloned()
            .unwrap_or_else(|| AggregatedMetric {
                metric_type,
                count: 0,
                sum: 0.0,
                min: 0.0,
                max: 0.0,
                avg: 0.0,
            })
    }

    /// 更新聚合缓存
    async fn update_aggregated(&self, metric: &PerformanceMetric) {
        let mut aggregated = self.aggregated.write().await;
        let key = format!("{:?}", metric.metric_type);

        let entry = aggregated.entry(key).or_insert_with(|| AggregatedMetric {
            metric_type: metric.metric_type,
            count: 0,
            sum: 0.0,
            min: f64::MAX,
            max: f64::MIN,
            avg: 0.0,
        });

        entry.count += 1;
        entry.sum += metric.value;
        entry.min = entry.min.min(metric.value);
        entry.max = entry.max.max(metric.value);
        entry.avg = entry.sum / entry.count as f64;
    }
}

/// 聚合指标
#[derive(Debug, Clone)]
pub struct AggregatedMetric {
    pub metric_type: MetricType,
    pub count: u64,
    pub sum: f64,
    pub min: f64,
    pub max: f64,
    pub avg: f64,
}
```

#### 3. 调用链路追踪

```rust
// src-tauri/src/agent/subagent/tracing.rs

/// Sub-Agent追踪器
pub struct SubAgentTracer {
    /// 追踪存储
    traces: RwLock<HashMap<String, TracingData>>,
    /// 活跃跨度
    active_spans: RwLock<HashMap<String, TracingSpan>>,
}

impl SubAgentTracer {
    /// 开始跨度
    pub fn start_span(&self, call_id: &str, sub_agent_id: &str) -> TraceGuard {
        let span_id = Uuid::new_v4().to_string();
        let parent_span_id = self.get_active_span_id(call_id);

        let span = TracingSpan {
            span_id: span_id.clone(),
            parent_span_id,
            name: format!("subagent:{}", sub_agent_id),
            sub_agent_id: sub_agent_id.to_string(),
            start_time: Utc::now().timestamp_millis(),
            end_time: None,
            duration_ms: None,
            status: SpanStatus::Unset,
            attributes: HashMap::new(),
            children: Vec::new(),
        };

        // 存储活跃跨度
        {
            let mut active = self.active_spans.write().await;
            active.insert(format!("{}:{}", call_id, span_id), span.clone());
        }

        TraceGuard {
            tracer: self.clone(),
            call_id: call_id.to_string(),
            span_id,
        }
    }

    /// 结束跨度
    pub async fn end_span(&self, call_id: &str, span_id: &str, status: SpanStatus) {
        let span_key = format!("{}:{}", call_id, span_id);

        let mut active = self.active_spans.write().await;
        if let Some(mut span) = active.remove(&span_key) {
            span.end_time = Some(Utc::now().timestamp_millis());
            span.status = status;
            span.duration_ms = span.end_time.unwrap() - span.start_time;

            // 添加到追踪存储
            let trace_id = self.get_or_create_trace(call_id).await;
            let mut traces = self.traces.write().await;
            if let Some(trace) = traces.get_mut(&trace_id) {
                self.add_span_to_tree(&mut trace.spans, &span);
            }
        }
    }

    /// 添加跨度到追踪树
    fn add_span_to_tree(&self, spans: &mut Vec<TracingSpan>, new_span: &TracingSpan) {
        if let Some(parent_id) = &new_span.parent_span_id {
            // 找到父跨度并添加为子节点
            for span in spans.iter_mut() {
                if span.span_id == *parent_id {
                    span.children.push(new_span.clone());
                    return;
                }
                // 递归查找
                self.add_span_to_tree(&mut span.children, new_span);
            }
        }
        // 如果没有父ID或找不到父，添加到根级别
        spans.push(new_span.clone());
    }

    /// 获取追踪数据
    pub async fn get_trace(&self, trace_id: &str) -> Option<TracingData> {
        let traces = self.traces.read().await;
        traces.get(trace_id).cloned()
    }

    /// 获取或创建追踪ID
    async fn get_or_create_trace(&self, call_id: &str) -> String {
        let traces = self.traces.read().await;

        // 查找是否已存在
        for trace in traces.values() {
            if trace.root_call_id == call_id {
                return trace.trace_id.clone();
            }
        }

        // 创建新追踪
        drop(traces);
        let trace_id = Uuid::new_v4().to_string();
        let trace = TracingData {
            trace_id: trace_id.clone(),
            root_call_id: call_id.to_string(),
            spans: Vec::new(),
            created_at: Utc::now().timestamp_millis(),
        };

        let mut traces = self.traces.write().await;
        traces.insert(trace_id.clone(), trace);

        trace_id
    }

    /// 获取活跃跨度ID
    fn get_active_span_id(&self, call_id: &str) -> Option<String> {
        // 返回当前call_id的最新活跃跨度ID
        None // 简化实现
    }
}

/// 追踪守卫（用于自动结束跨度）
pub struct TraceGuard {
    tracer: SubAgentTracer,
    call_id: String,
    span_id: String,
}

impl Drop for TraceGuard {
    fn drop(&mut self) {
        // 当Guard被丢弃时，自动结束跨度
        let tracer = self.tracer.clone();
        let call_id = self.call_id.clone();
        let span_id = self.span_id.clone();

        tokio::spawn(async move {
            tracer.end_span(&call_id, &span_id, SpanStatus::Ok).await;
        });
    }
}
```

#### 4. 事件系统

```rust
// src-tauri/src/agent/subagent/events.rs

/// 事件发布者
pub struct EventPublisher<T> {
    buffer_size: usize,
}

impl<T: Clone> EventPublisher<T> {
    pub fn new(buffer_size: usize) -> Self {
        Self { buffer_size }
    }

    pub async fn publish(&self, event: T) {
        // 实现事件发布逻辑
        // 可以使用tokio的broadcast channel
    }
}

/// 事件订阅者
pub struct EventSubscriber<T> {
    receiver: tokio::sync::mpsc::UnboundedReceiver<T>,
}
```

#### 5. 日志记录

```rust
// src-tauri/src/agent/subagent/logging.rs

/// 执行日志记录器
pub struct ExecutionLogger {
    /// 日志存储
    logs: RwLock<Vec<ExecutionLogEntry>>,
    /// 最大存储大小
    max_size: usize,
    /// 最小日志级别
    min_level: LogLevel,
}

impl ExecutionLogger {
    /// 记录日志
    pub async fn log(
        &self,
        context_id: &str,
        call_id: Option<&str>,
        level: LogLevel,
        source: LogSource,
        message: &str,
        metadata: Option<Record<String, serde_json::Value>>,
    ) {
        // 检查日志级别
        if !self.should_log(level) {
            return;
        }

        let entry = ExecutionLogEntry {
            log_id: Uuid::new_v4().to_string(),
            context_id: context_id.to_string(),
            call_id: call_id.map(|s| s.to_string()),
            level,
            message: message.to_string(),
            source,
            timestamp: Utc::now().timestamp_millis(),
            metadata,
        };

        let mut logs = self.logs.write().await;
        logs.push(entry);

        // 限制大小
        if logs.len() > self.max_size {
            logs.drain(0..1000);
        }
    }

    /// 记录事件为日志
    pub async fn log_event(&self, event: &RuntimeEvent) {
        let (level, source, message) = match event.event_type {
            RuntimeEventType::ContextCreated => (LogLevel::Info, LogSource::Context, "Context created"),
            RuntimeEventType::ContextDestroyed => (LogLevel::Info, LogSource::Context, "Context destroyed"),
            RuntimeEventType::CallStarted => (LogLevel::Info, LogSource::NestedCall, "Call started"),
            RuntimeEventType::CallCompleted => (LogLevel::Info, LogSource::NestedCall, "Call completed"),
            RuntimeEventType::CallFailed => (LogLevel::Error, LogSource::NestedCall, "Call failed"),
            RuntimeEventType::ToolInvoked => (LogLevel::Debug, LogSource::ToolExecution, "Tool invoked"),
            RuntimeEventType::ToolCompleted => (LogLevel::Debug, LogSource::ToolExecution, "Tool completed"),
            RuntimeEventType::ToolFailed => (LogLevel::Warning, LogSource::ToolExecution, "Tool failed"),
            RuntimeEventType::MemoryInjected => (LogLevel::Debug, LogSource::MemoryInjection, "Memory injected"),
            RuntimeEventType::NestingDepthChanged => (LogLevel::Debug, LogSource::NestedCall, "Nesting depth changed"),
            RuntimeEventType::StatusChanged => (LogLevel::Info, LogSource::Context, "Status changed"),
        };

        self.log(
            &event.context_id,
            event.call_id.as_deref(),
            level,
            source,
            message,
            Some(event.data.clone()),
        ).await;
    }

    /// 检查是否应该记录
    fn should_log(&self, level: LogLevel) -> bool {
        let level_values = |l: LogLevel| match l {
            LogLevel::Debug => 0,
            LogLevel::Info => 1,
            LogLevel::Warning => 2,
            LogLevel::Error => 3,
        };

        level_values(level) >= level_values(self.min_level)
    }

    /// 查询日志
    pub async fn query(
        &self,
        request: &MonitoringQueryRequest,
    ) -> Vec<ExecutionLogEntry> {
        let logs = self.logs.read().await;

        logs
            .iter()
            .filter(|l| {
                // 应用过滤条件
                if let Some(context_id) = &request.context_id {
                    if &l.context_id != context_id {
                        return false;
                    }
                }

                if let Some(time_range) = &request.time_range {
                    if l.timestamp < time_range.start_time || l.timestamp > time_range.end_time {
                        return false;
                    }
                }

                true
            })
            .cloned()
            .collect()
    }
}
```

## 安全考虑

1. **日志脱敏**：对日志中的敏感数据进行脱敏处理
2. **访问控制**：监控数据仅允许授权用户访问
3. **存储限制**：限制单个上下文的日志和指标存储量
4. **审计记录**：记录监控数据的访问日志

## 性能考虑

1. **异步写入**：日志和指标使用异步方式记录，不阻塞主流程
2. **采样降频**：高频事件进行采样，避免数据量爆炸
3. **批量处理**：指标聚合使用批量处理减少计算开销
4. **缓存优化**：聚合指标使用缓存减少重复计算
