# Proposal: Sub-Agent执行监控与诊断

## 变更类型
- [x] 重构 (refactor)

## 背景

在Sub-Agent执行过程中，实时监控和诊断能力对于系统的可观测性和问题定位至关重要。当前系统已有的`SubAgentExecutionMonitor`组件需要扩展以支持：

1. **实时运行时数据**：监控Sub-Agent执行过程中的实时状态变化
2. **性能指标收集**：收集响应时间、Token使用等性能数据
3. **调用链路追踪**：记录完整的调用链路用于问题诊断
4. **执行日志记录**：记录详细的执行日志用于审计和分析

通过Story 52.2-52.4的实现，Sub-Agent的执行上下文、嵌套调用和结果返回机制已经就绪。现在需要扩展监控能力，集成到现有的`SubAgentExecutionMonitor`中，提供完整的可观测性支持。

## 目标

实现Sub-Agent执行的实时监控与诊断，具体目标包括：

- 扩展`SubAgentExecutionMonitor`支持实时运行时数据收集
- 实现Sub-Agent调用性能指标收集（响应时间、Token使用量等）
- 实现调用链路追踪数据生成
- 添加Sub-Agent执行日志记录
- 集成到前端监控界面

## 范围

### 包含

- 扩展SubAgentExecutionMonitor支持实时运行时数据
- Sub-Agent调用性能指标收集
- 调用链路追踪数据生成
- Sub-Agent执行日志记录
- Rust后端实现（`src-tauri/src/agent/subagent/monitor.rs`）
- 前端监控接口类型定义

### 不包含

- 前端监控UI界面实现（由其他Story覆盖）
- 历史数据分析功能（由其他Story覆盖）

## 影响范围

### 前端

- **新增文件**：
  - `src/features/agent/types/subagent-monitor.types.ts` - 监控相关类型定义
- **修改文件**：
  - `src/features/agent/types/index.ts` - 添加监控类型导出
- **影响范围**：前端定义监控接口类型

### 后端

- **新增文件**：
  - `src-tauri/src/agent/subagent/monitor.rs` - 监控核心实现（扩展现有实现）
  - `src-tauri/src/agent/subagent/metrics.rs` - 性能指标收集实现
  - `src-tauri/src/agent/subagent/tracing.rs` - 调用链路追踪实现
- **修改文件**：
  - `src-tauri/src/agent/subagent/mod.rs` - 添加新模块导出
  - `src-tauri/src/agent/subagent/context.rs` - 集成监控埋点
  - `src-tauri/src/agent/subagent/nested.rs` - 集成监控埋点
- **影响范围**：后端监控功能的核心逻辑实现

### 数据库

- **变更说明**：本Story不涉及数据库直接变更
- **间接影响**：监控数据可能需要写入现有的日志表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 监控数据量过大导致内存压力 | 中 | 中 | 实现监控数据的采样和聚合，限制存储大小 |
| 监控埋点影响性能 | 低 | 低 | 使用异步非阻塞方式记录监控数据 |
| 监控数据丢失 | 低 | 中 | 实现监控数据的缓冲和批量写入 |
| 与现有Monitor冲突 | 中 | 中 | 采用扩展而非替换的方式，保持向后兼容 |

## 依赖

### 前置依赖

- **Story 52.4** (Sub-Agent结果汇总与回传)：结果处理中包含监控所需的数据
- **Story 21.23** (监控模块接口定义)：提供监控模块的基础接口
- **Task 101** (后端Rust Agent基础架构)：提供基础目录结构

### 后置依赖

- **Epic 55** (治理与可靠性增强)：监控数据用于性能分析和错误诊断

### 同期依赖

- **Story 52.2-52.4**: Sub-Agent运行时组件的监控集成

## 实现步骤

1. **扩展SubAgentExecutionMonitor支持实时运行时数据**
   - 扩展现有Monitor接口
   - 实现实时状态变更通知
   - 实现指标数据收集

2. **实现Sub-Agent调用性能指标收集**
   - 实现`MetricsCollector`收集响应时间
   - 实现Token使用量统计
   - 实现错误率等聚合指标

3. **实现调用链路追踪数据生成**
   - 集成Story 52.3的调用栈数据
   - 生成符合OpenTelemetry标准的追踪数据
   - 实现链路数据的存储和查询

4. **添加Sub-Agent执行日志记录**
   - 定义日志事件类型
   - 实现结构化日志记录
   - 实现日志的过滤和查询

5. **集成到前端监控界面**
   - 提供监控数据的API接口
   - 定义前端展示所需的类型
