# Proposal: 性能监控与指标收集

## 变更类型
- [x] 重构 (refactor)

## 背景

### 业务背景
随着 Agent Runtime 系统负载增加，需要对系统性能进行实时监控，以便：
- 及时发现性能瓶颈
- 优化资源分配
- 保障服务质量（SLA）
- 为容量规划提供数据支撑

### 技术背景
现有 `LogMetricsCenter.tsx` 和 `TaskTraceAnalysis.tsx` 组件已存在，`RuntimeMetrics` 需要扩展为完整的性能监控系统。需要：
- 扩展 RuntimeMetrics 支持全量性能指标
- 实现 Agent 响应时间监控
- 实现 Token 使用统计与预警
- 添加工具调用成功率监控
- 创建性能监控仪表板

## 目标

### 核心目标
实现性能监控与指标收集，满足以下验收标准：

1. **扩展 RuntimeMetrics 支持全量性能指标**
   - 支持指标类型：响应时间、吞吐量、错误率、资源使用率
   - 支持指标聚合：实时、本小时、本日、本周、本月
   - 支持指标导出

2. **实现 Agent 响应时间监控**
   - 记录首次响应时间（TTFT）
   - 记录完整响应时间（TTFT + TTCT）
   - 记录各步骤响应时间
   - 支持响应时间分布统计

3. **实现 Token 使用统计与预警**
   - 记录每次请求的 Token 消耗
   - 统计 Token 使用趋势
   - 设置 Token 配额预警
   - 支持按用户/租户统计

4. **添加工具调用成功率监控**
   - 记录工具调用次数和成功次数
   - 统计工具调用成功率
   - 分析失败原因分布
   - 支持按工具类型统计

5. **创建性能监控仪表板**
   - 实时指标展示
   - 历史趋势图表
   - 告警信息展示
   - 支持数据导出

## 范围

### 包含
- 扩展 RuntimeMetrics 支持全量性能指标
- 实现 Agent 响应时间监控
- 实现 Token 使用统计与预警
- 添加工具调用成功率监控
- 创建性能监控仪表板

### 不包含
- 非本 Story 范围内的功能
- 云端监控集成（由云端服务实现）
- 自动化扩缩容（由基础设施层实现）
- APM 探针集成（将来可能实现）

## 影响范围

### 前端
- **影响组件**：
  - `src/features/agent/components/LogMetricsCenter.tsx`（已存在，需扩展）
  - `src/features/agent/components/TaskTraceAnalysis.tsx`（已存在，需扩展）
  - 需要新增性能仪表板组件
- **影响 Hooks**：
  - `useRuntimeMetrics` Hook
  - `usePerformanceMonitoring` Hook
- **影响 Stores**：
  - `metricsStore`

### 后端
- **新增模块**：
  - `src-tauri/src/agent/metrics/mod.rs` - 性能指标核心模块
  - `src-tauri/src/agent/metrics/collector.rs` - 指标收集器
  - `src-tauri/src/agent/metrics/aggregator.rs` - 指标聚合器
  - `src-tauri/src/agent/metrics/monitor.rs` - 监控器
  - `src-tauri/src/agent/metrics/alert.rs` - 告警服务
  - `src-tauri/src/agent/metrics/models.rs` - 数据模型
- **Tauri 命令**：
  - `record_metric` - 记录指标
  - `query_metrics` - 查询指标
  - `get_realtime_metrics` - 获取实时指标
  - `set_alert_rule` - 设置告警规则
  - `get_alert_history` - 获取告警历史

### 数据库
- **新增表结构**：
```sql
-- 性能指标表
CREATE TABLE performance_metrics (
    id TEXT PRIMARY KEY,
    metric_type TEXT NOT NULL,  -- response_time, token_usage, tool_success
    metric_name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,  -- ms, count, percentage
    dimensions JSON,  -- 维度信息（user_id, tenant_id, tool_name等）
    timestamp INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);

-- 告警规则表
CREATE TABLE alert_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    condition TEXT NOT NULL,  -- gt, lt, eq, gte, lte
    threshold REAL NOT NULL,
    severity TEXT NOT NULL,  -- info, warning, critical
    enabled BOOLEAN DEFAULT TRUE,
    cooldown_seconds INTEGER DEFAULT 300,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 告警历史表
CREATE TABLE alert_history (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL,
    metric_value REAL NOT NULL,
    triggered_at INTEGER NOT NULL,
    resolved_at INTEGER,
    status TEXT NOT NULL,  -- triggered, resolved, acknowledged
    acknowledged_by TEXT,
    acknowledged_at INTEGER,
    FOREIGN KEY (rule_id) REFERENCES alert_rules(id)
);
```

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | 高 | 高 | Task 101 提供基础架构，本 Story 依赖其后完成 |
| 前端接口已存在但未连接 | 中 | 中 | 逐步对接测试 |
| 指标采集影响性能 | 中 | 中 | 使用异步写入，采样降频 |
| 数据量增长过快 | 中 | 中 | 实现数据聚合和定期清理 |
| 告警风暴 | 低 | 中 | 实现告警聚合和去重 |

## 依赖

### 前置依赖
- **Task 101**: 后端 Rust Agent 基础架构（必须先完成）
- **Story 51.1**: 主 Agent 协调器 - 核心协调模块
- **Story 51.3**: 工具执行管道 - 完整执行链

### 后置依赖
- **Story 55.1**: 完整审计日志系统（使用指标进行性能分析）
- **Story 55.4**: 安全检查强化（使用指标进行异常检测）

## 实现步骤

1. **扩展 RuntimeMetrics 支持全量性能指标**
   - 定义指标类型和维度
   - 设计指标存储格式
   - 实现指标收集接口
   - 实现异步写入

2. **实现 Agent 响应时间监控**
   - 在 AgentOrchestrator 中集成计时
   - 记录 TTFT 和 TTCT
   - 实现响应时间分布统计
   - 支持按会话/用户聚合

3. **实现 Token 使用统计与预警**
   - 在 LLM 调用处集成 Token 计数
   - 实现 Token 使用趋势分析
   - 设置配额和预警阈值
   - 支持按用户/租户统计

4. **添加工具调用成功率监控**
   - 在工具执行管道集成成功/失败计数
   - 实现工具成功率统计
   - 分析失败原因分布
   - 支持按工具类型聚合

5. **创建性能监控仪表板**
   - 设计仪表板布局
   - 实现实时指标展示
   - 实现历史趋势图表
   - 实现告警信息展示

## 验收标准

- [ ] RuntimeMetrics 支持所有定义的指标类型
- [ ] Agent 响应时间监控正常工作
- [ ] Token 使用统计正常工作
- [ ] 工具调用成功率监控正常工作
- [ ] 性能监控仪表板正常工作
- [ ] 告警规则和通知正常工作
- [ ] 性能影响在可接受范围内
