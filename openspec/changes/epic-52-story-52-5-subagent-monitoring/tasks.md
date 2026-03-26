# Tasks: Sub-Agent执行监控与诊断

## 任务列表

### Task 119: Sub-Agent执行监控与诊断

- **描述**: 实现Sub-Agent执行的实时监控、性能指标收集、调用链路追踪，集成到现有的SubAgentExecutionMonitor。
- **实现类型**: refactor（重构扩展）
- **优先级**: medium
- **阶段**: Phase 2 - Sub-Agent运行时实现

#### 验收标准

| 验收项 | 标准描述 | 验证方式 |
|--------|----------|----------|
| AC-1 | 扩展SubAgentExecutionMonitor支持实时运行时事件发布/订阅 | 单元测试 |
| AC-2 | 实现MetricsCollector，支持响应时间、Token使用量等指标收集 | 单元测试 |
| AC-3 | 实现SubAgentTracer，支持调用链路追踪数据生成 | 单元测试 |
| AC-4 | 实现ExecutionLogger，支持结构化日志记录和查询 | 单元测试 |
| AC-5 | 实现`subscribe_runtime_events` Tauri命令 | API集成测试 |
| AC-6 | 实现`query_monitoring_data` Tauri命令 | API集成测试 |
| AC-7 | 集成监控埋点到上下文和嵌套调用模块 | 集成测试 |

#### 任务分解

1. **前端类型定义**
   - 创建`src/features/agent/types/subagent-monitor.types.ts`
   - 定义`RuntimeEvent`、`PerformanceMetrics`、`TracingData`等类型
   - 导出类型供其他模块使用

2. **监控核心扩展**
   - 修改`src-tauri/src/agent/subagent/monitor.rs`
   - 扩展`SubAgentExecutionMonitor`接口
   - 实现事件发布/订阅机制

3. **性能指标收集**
   - 创建`src-tauri/src/agent/subagent/metrics.rs`
   - 实现`MetricsCollector`指标收集器
   - 实现响应时间和Token使用量统计

4. **调用链路追踪**
   - 创建`src-tauri/src/agent/subagent/tracing.rs`
   - 实现`SubAgentTracer`追踪器
   - 实现TraceGuard自动管理

5. **事件系统**
   - 创建`src-tauri/src/agent/subagent/events.rs`
   - 实现`EventPublisher`事件发布者
   - 实现事件订阅机制

6. **日志记录**
   - 创建`src-tauri/src/agent/subagent/logging.rs`
   - 实现`ExecutionLogger`日志记录器
   - 实现日志查询功能

7. **Tauri命令接口**
   - 在`src-tauri/src/agent/subagent/commands.rs`中添加新命令
   - 实现`subscribe_runtime_events`命令
   - 实现`query_monitoring_data`命令

8. **监控埋点集成**
   - 在`src-tauri/src/agent/subagent/context.rs`中添加监控埋点
   - 在`src-tauri/src/agent/subagent/nested.rs`中添加监控埋点
   - 在`src-tauri/src/agent/subagent/result.rs`中添加监控埋点

9. **测试与完善**
   - 编写单元测试覆盖核心逻辑
   - 编写集成测试验证前后端对接
   - 更新模块导出

## 执行顺序

1. **Phase 1: 前端类型定义**（0.5天）
   - 定义完整的TypeScript类型接口
   - 与后端确认接口设计

2. **Phase 2: 核心模块实现**（3天）
   - 监控核心扩展
   - 性能指标收集
   - 调用链路追踪

3. **Phase 3: 辅助模块实现**（1.5天）
   - 事件系统
   - 日志记录

4. **Phase 4: Tauri命令接口**（1天）
   - 实现Tauri命令
   - 前后端联调

5. **Phase 5: 监控埋点集成**（1.5天）
   - 上下文模块埋点
   - 嵌套调用模块埋点
   - 结果处理模块埋点

6. **Phase 6: 测试与完善**（1.5天）
   - 单元测试
   - 集成测试
   - 文档完善

## 测试要点

### 单元测试

- [ ] `SubAgentExecutionMonitor`事件发布/订阅测试
- [ ] `MetricsCollector`指标收集和聚合测试
- [ ] `SubAgentTracer`跨度创建和结束测试
- [ ] `ExecutionLogger`日志记录和查询测试
- [ ] 追踪树构建测试

### 集成测试

- [ ] `subscribe_runtime_events`命令测试
- [ ] `query_monitoring_data`命令测试
- [ ] 监控数据在执行流程中的正确收集

### E2E测试

- [ ] 完整执行流程的监控数据收集测试（根据优先级）

### 浏览器测试

- [ ] 前端类型定义正确性验证

## 关键代码路径

```
前端：
src/features/agent/types/subagent-monitor.types.ts

后端：
src-tauri/src/agent/subagent/
├── monitor.rs     # 监控核心（扩展）
├── metrics.rs     # 性能指标收集
├── tracing.rs     # 调用链路追踪
├── events.rs      # 事件系统
└── logging.rs     # 日志记录
```

## 里程碑检查点

1. **M1**: 前端类型定义完成并评审通过
2. **M2**: `MetricsCollector`和`SubAgentTracer`通过单元测试
3. **M3**: Tauri命令接口完成，前后端联调通过
4. **M4**: 监控埋点集成完成，覆盖主要执行流程
5. **M5**: 所有测试用例通过，文档完善
