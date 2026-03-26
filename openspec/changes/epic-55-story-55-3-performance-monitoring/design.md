# Design: 性能监控与指标收集

## 技术方案

### 实现类型
- **类型**: refactor（基于现有 RuntimeMetrics 扩展）
- **优先级**: medium
- **阶段**: Phase 5 - 治理与可靠性增强
- **后端必需**: true

### 前端实现

#### 技术选型
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **图表库**: Recharts（如需要）
- **HTTP 客户端**: fetch API / Tauri IPC

#### 模块结构
```
src/
├── features/
│   └── agent/
│       ├── components/
│       │   ├── LogMetricsCenter.tsx      # 日志指标中心（已存在）
│       │   ├── TaskTraceAnalysis.tsx    # 任务追踪分析（已存在）
│       │   ├── PerformanceDashboard.tsx # 性能仪表板
│       │   └── RealtimeMetrics.tsx      # 实时指标
│       ├── hooks/
│       │   ├── useRuntimeMetrics.ts     # Runtime 指标 Hook
│       │   └── usePerformanceMonitoring.ts  # 性能监控 Hook
│       └── stores/
│           └── metricsStore.ts          # 指标状态
```

#### 核心接口

```typescript
// 指标类型定义
interface PerformanceMetric {
  id: string;
  metricType: MetricType;
  metricName: string;
  value: number;
  unit: MetricUnit;
  dimensions?: MetricDimensions;
  timestamp: number;
}

type MetricType =
  | 'response_time'     // 响应时间
  | 'token_usage'       // Token 使用
  | 'tool_success'      // 工具成功率
  | 'error_rate'        // 错误率
  | 'resource_usage';   // 资源使用

type MetricUnit =
  | 'ms'       // 毫秒
  | 'count'    // 计数
  | 'percentage'  // 百分比
  | 'bytes';   // 字节

interface MetricDimensions {
  sessionId?: string;
  userId?: string;
  tenantId?: string;
  toolName?: string;
  provider?: string;
  stepId?: string;
}

// 实时指标
interface RealtimeMetrics {
  activeSessions: number;
  requestsPerMinute: number;
  avgResponseTime: number;
  errorRate: number;
  tokenUsagePerMinute: number;
}

// 告警规则
interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownSeconds: number;
}

type AlertCondition = 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
type AlertSeverity = 'info' | 'warning' | 'critical';

// 告警历史
interface AlertHistory {
  id: string;
  ruleId: string;
  metricValue: number;
  triggeredAt: number;
  resolvedAt?: number;
  status: AlertStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

type AlertStatus = 'triggered' | 'resolved' | 'acknowledged';

// Hook 接口
interface UsePerformanceMonitoring {
  realtimeMetrics: RealtimeMetrics;
  metrics: PerformanceMetric[];
  alertRules: AlertRule[];
  alertHistory: AlertHistory[];
  loading: boolean;

  // Actions
  fetchMetrics: (params: MetricQuery) => Promise<void>;
  setAlertRule: (rule: AlertRule) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  getMetricTrend: (metricName: string, duration: Duration) => Promise<MetricTrend>;
}
```

### 后端实现

#### 技术选型
- **语言**: Rust
- **异步框架**: Tokio
- **数据库**: SQLite (本地存储)

#### 模块结构
```
src-tauri/src/
├── agent/
│   ├── metrics/
│   │   ├── mod.rs              # 模块入口
│   │   ├── collector.rs        # 指标收集器
│   │   ├── aggregator.rs       # 指标聚合器
│   │   ├── monitor.rs          # 监控器
│   │   ├── alert.rs            # 告警服务
│   │   └── models.rs           # 数据模型
│   └── commands/
│       └── metrics_commands.rs # Tauri 命令
```

#### 核心数据结构

```rust
// 性能指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetric {
    pub id: String,
    pub metric_type: String,
    pub metric_name: String,
    pub value: f64,
    pub unit: String,
    pub dimensions: Option<Value>,
    pub timestamp: i64,
    pub created_at: i64,
}

// 告警规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertRule {
    pub id: String,
    pub name: String,
    pub metric_name: String,
    pub condition: String,
    pub threshold: f64,
    pub severity: String,
    pub enabled: bool,
    pub cooldown_seconds: u64,
    pub created_at: i64,
    pub updated_at: i64,
}

// 告警历史
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertHistory {
    pub id: String,
    pub rule_id: String,
    pub metric_value: f64,
    pub triggered_at: i64,
    pub resolved_at: Option<i64>,
    pub status: String,
    pub acknowledged_by: Option<String>,
    pub acknowledged_at: Option<i64>,
}

// 实时指标
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RealtimeMetrics {
    pub active_sessions: u32,
    pub requests_per_minute: f64,
    pub avg_response_time: f64,
    pub error_rate: f64,
    pub token_usage_per_minute: f64,
}
```

#### 核心服务实现

```rust
// 指标收集器
pub struct MetricsCollector {
    db: Database,
    tx: Channel<PerformanceMetric>,
}

impl MetricsCollector {
    // 记录指标
    pub async fn record(&self, metric: PerformanceMetric) -> Result<(), MetricsError> {
        self.tx.send(metric).await?;
        Ok(())
    }

    // 记录响应时间
    pub async fn record_response_time(
        &self,
        session_id: &str,
        ttft_ms: f64,
        ttct_ms: f64,
    ) -> Result<(), MetricsError> {
        let metric = PerformanceMetric {
            id: generate_uuid(),
            metric_type: "response_time".to_string(),
            metric_name: "time_to_first_token".to_string(),
            value: ttft_ms,
            unit: "ms".to_string(),
            dimensions: Some(json!({
                "sessionId": session_id,
                "type": "ttft"
            })),
            timestamp: current_timestamp(),
            created_at: current_timestamp(),
        };
        self.record(metric).await?;

        let metric = PerformanceMetric {
            id: generate_uuid(),
            metric_type: "response_time".to_string(),
            metric_name: "time_to_complete".to_string(),
            value: ttct_ms,
            unit: "ms".to_string(),
            dimensions: Some(json!({
                "sessionId": session_id,
                "type": "ttct"
            })),
            timestamp: current_timestamp(),
            created_at: current_timestamp(),
        };
        self.record(metric).await
    }

    // 记录 Token 使用
    pub async fn record_token_usage(
        &self,
        session_id: &str,
        user_id: &str,
        prompt_tokens: u32,
        completion_tokens: u32,
    ) -> Result<(), MetricsError> {
        let metric = PerformanceMetric {
            id: generate_uuid(),
            metric_type: "token_usage".to_string(),
            metric_name: "prompt_tokens".to_string(),
            value: prompt_tokens as f64,
            unit: "count".to_string(),
            dimensions: Some(json!({
                "sessionId": session_id,
                "userId": user_id,
            })),
            timestamp: current_timestamp(),
            created_at: current_timestamp(),
        };
        self.record(metric).await?;

        let metric = PerformanceMetric {
            id: generate_uuid(),
            metric_type: "token_usage".to_string(),
            metric_name: "completion_tokens".to_string(),
            value: completion_tokens as f64,
            unit: "count".to_string(),
            dimensions: Some(json!({
                "sessionId": session_id,
                "userId": user_id,
            })),
            timestamp: current_timestamp(),
            created_at: current_timestamp(),
        };
        self.record(metric).await
    }
}

// 监控器
pub struct PerformanceMonitor {
    collector: Arc<MetricsCollector>,
    alert_service: Arc<AlertService>,
}

impl PerformanceMonitor {
    // 获取实时指标
    pub async fn get_realtime_metrics(&self) -> Result<RealtimeMetrics, MetricsError> {
        let now = current_timestamp();
        let one_minute_ago = now - 60000;

        // 查询最近一分钟的指标
        let metrics = self.collector.query_within(one_minute_ago, now).await?;

        // 计算实时指标
        let active_sessions = metrics.iter()
            .filter(|m| m.metric_name == "active_session")
            .count() as u32;

        let requests_per_minute = metrics.iter()
            .filter(|m| m.metric_name == "request")
            .count() as f64;

        let avg_response_time = metrics.iter()
            .filter(|m| m.metric_name == "time_to_complete")
            .map(|m| m.value)
            .sum::<f64>() / metrics.iter()
            .filter(|m| m.metric_name == "time_to_complete")
            .count().max(1) as f64;

        let error_rate = {
            let total = metrics.iter().filter(|m| m.metric_name == "request").count() as f64;
            let errors = metrics.iter().filter(|m| m.metric_name == "error").count() as f64;
            if total > 0.0 { errors / total } else { 0.0 }
        };

        let token_usage_per_minute = metrics.iter()
            .filter(|m| m.metric_type == "token_usage")
            .map(|m| m.value)
            .sum::<f64>();

        Ok(RealtimeMetrics {
            active_sessions,
            requests_per_minute,
            avg_response_time,
            error_rate,
            token_usage_per_minute,
        })
    }
}

// 告警服务
pub struct AlertService {
    db: Database,
    rules: HashMap<String, AlertRule>,
}

impl AlertService {
    // 检查告警规则
    pub async fn check_rules(&self, metric: &PerformanceMetric) -> Result<Vec<AlertHistory>, MetricsError> {
        let mut triggered = Vec::new();

        for rule in self.rules.values() {
            if !rule.enabled {
                continue;
            }

            if rule.metric_name != metric.metric_name {
                continue;
            }

            if self.evaluate_condition(&rule.condition, metric.value, rule.threshold) {
                let alert = AlertHistory {
                    id: generate_uuid(),
                    rule_id: rule.id.clone(),
                    metric_value: metric.value,
                    triggered_at: current_timestamp(),
                    resolved_at: None,
                    status: "triggered".to_string(),
                    acknowledged_by: None,
                    acknowledged_at: None,
                };
                triggered.push(alert);
            }
        }

        Ok(triggered)
    }

    fn evaluate_condition(&self, condition: &str, value: f64, threshold: f64) -> bool {
        match condition {
            "gt" => value > threshold,
            "lt" => value < threshold,
            "gte" => value >= threshold,
            "lte" => value <= threshold,
            "eq" => (value - threshold).abs() < f64::EPSILON,
            _ => false,
        }
    }
}
```

### API 设计

#### Tauri 命令

```rust
// 记录指标
#[tauri::command]
pub async fn record_metric(
    metric_type: String,
    metric_name: String,
    value: f64,
    unit: String,
    dimensions: Option<Value>,
) -> Result<String, String>;

// 查询指标
#[tauri::command]
pub async fn query_metrics(
    metric_names: Option<Vec<String>>,
    start_time: Option<i64>,
    end_time: Option<i64>,
    dimensions: Option<Value>,
    aggregation: Option<String>,  // avg, sum, count, max, min
    interval: Option<u64>,        // 分组间隔（秒）
) -> Result<Vec<AggregatedMetric>, String>;

// 获取实时指标
#[tauri::command]
pub async fn get_realtime_metrics() -> Result<RealtimeMetrics, String>;

// 设置告警规则
#[tauri::command]
pub async fn set_alert_rule(rule: AlertRule) -> Result<String, String>;

// 获取告警规则
#[tauri::command]
pub async fn get_alert_rules() -> Result<Vec<AlertRule>, String>;

// 删除告警规则
#[tauri::command]
pub async fn delete_alert_rule(rule_id: String) -> Result<bool, String>;

// 获取告警历史
#[tauri::command]
pub async fn get_alert_history(
    rule_id: Option<String>,
    status: Option<String>,
    start_time: Option<i64>,
    end_time: Option<i64>,
) -> Result<Vec<AlertHistory>, String>;

// 确认告警
#[tauri::command]
pub async fn acknowledge_alert(
    alert_id: String,
    user_id: String,
) -> Result<bool, String>;
```

## 组件设计

### 前端组件

#### PerformanceDashboard
- **职责**: 性能监控仪表板主视图
- **Props**: 无
- **状态**: 实时指标、告警信息、趋势图表

#### RealtimeMetrics
- **职责**: 实时指标展示
- **Props**:
  - `metrics: RealtimeMetrics`
- **状态**: 自动刷新

### 后端模块

#### MetricsCollector
- **职责**: 指标收集和写入
- **方法**:
  - `record()` - 记录指标
  - `record_response_time()` - 记录响应时间
  - `record_token_usage()` - 记录 Token 使用
  - `record_tool_success()` - 记录工具成功率

#### PerformanceMonitor
- **职责**: 性能监控核心
- **方法**:
  - `get_realtime_metrics()` - 获取实时指标
  - `get_metric_trend()` - 获取指标趋势

#### AlertService
- **职责**: 告警管理
- **方法**:
  - `check_rules()` - 检查告警规则
  - `trigger_alert()` - 触发告警
  - `resolve_alert()` - 解决告警

## 状态管理

### Zustand Store

```typescript
interface MetricsState {
  realtimeMetrics: RealtimeMetrics | null;
  metrics: PerformanceMetric[];
  alertRules: AlertRule[];
  alertHistory: AlertHistory[];
  loading: boolean;

  // Actions
  fetchRealtimeMetrics: () => Promise<void>;
  fetchMetrics: (params: MetricQuery) => Promise<void>;
  setAlertRule: (rule: AlertRule) => Promise<void>;
  acknowledgeAlert: (alertId: string, userId: string) => Promise<void>;
}
```

## 安全考虑

- 遵循 ADR-023 监控与可观测性设计
- 实现指标数据的访问控制
- 实现告警通知的权限校验
- 实现敏感操作审计

## 性能考虑

- 使用异步写入，避免阻塞主流程
- 实现采样降频减少数据量
- 实现数据聚合减少存储
- 定期清理过期数据
- 使用内存缓存实时指标

## 测试策略

### 单元测试
- MetricsCollector 收集测试
- AlertService 规则检查测试
- 指标聚合计算测试

### 集成测试
- 端到端指标收集测试
- 告警触发和解测试
- 数据聚合测试

### E2E 测试
- 性能仪表板功能测试
- 告警配置和通知测试
