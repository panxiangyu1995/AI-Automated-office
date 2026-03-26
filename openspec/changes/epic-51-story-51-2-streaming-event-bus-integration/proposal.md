# Proposal: 主Agent协调器 - 流式事件总线集成

## 变更类型
- [ ] 新功能
- [x] 重构
- [ ] 优化
- [ ] 开发

## 背景

Epic 51 售后模块动态工作台的流式事件总线是实现"透明可控"用户体验的关键技术支撑。

**Story 51.2 流式事件总线**负责：
- 将后端 Agent 执行过程实时推送到前端
- 支持细粒度事件类型（thinking、tool_calling、tool_result、confirmation_needed）
- 实现思考过程、工具调用状态、执行进度的可视化
- 作为 Story 51.1 的基础设施扩展

## 目标

实现前后端流式事件总线，支持思考过程、工具调用状态、执行进度的实时推送与前端展示。

## 范围

### 包含
- 扩展 RuntimeEventEmitter 支持细粒度事件类型：
  - `thinking` - 思考过程事件
  - `tool_calling` - 工具调用开始
  - `tool_result` - 工具调用结果
  - `confirmation_needed` - 需要用户确认
- 实现前端 StreamingHostContext 与后端事件流的完整对接
- 添加思考过程的实时展示组件
- 实现工具调用状态的实时更新与可视化
- 添加执行进度的流式反馈

### 不包含
- WebSocket 底层传输实现（由 Task 101 提供）
- 具体的工具执行逻辑（属于 Story 51.3）

## 影响范围

### 前端
- `src/features/streaming/runtime/runtimeEvents.ts` - 扩展事件类型
- `src/features/streaming/runtime/streamingHostContext.tsx` - 对接后端
- `src/features/agent/components/ThinkingDisplay.tsx` - 新增思考展示组件
- `src/features/agent/components/ToolCallDisplay.tsx` - 新增工具调用展示

### 后端
- `src-tauri/src/agent/events.rs` - 扩展事件类型
- `src-tauri/src/agent/stream.rs` - 流式推送实现

### 数据库
- 暂无数据模型变更

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 事件频率过高导致前端性能问题 | 中 | 中 | 实现事件节流（throttle）和防抖（debounce） |
| 后端流式推送不稳定 | 中 | 中 | 实现断线重连机制 |
| 前端组件渲染性能 | 高 | 低 | 使用虚拟列表，仅显示最近N条 |

## 依赖

- **前置依赖**:
  - Story 51.1: 主Agent协调器核心（阻塞项）
  - Story 43.3: 实时推送基础
- **后置依赖**: Story 51.3, Story 51.4

## 实现步骤

1. 扩展 RuntimeEventEmitter 支持细粒度事件类型（thinking、tool_calling、tool_result、confirmation_needed）
2. 实现前端 StreamingHostContext 与后端事件流的完整对接
3. 添加思考过程的实时展示组件
4. 实现工具调用状态的实时更新与可视化
5. 添加执行进度的流式反馈
