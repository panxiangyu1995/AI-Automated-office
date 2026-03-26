# Tasks: 主Agent协调器 - 流式事件总线集成

## 实现类型
- **类型**: refactor
- **优先级**: high
- **阶段**: Phase 1 - Agent Runtime端到端集成
- **依赖**: Story 51.1 (前置)

## 任务列表

### Task 1: 扩展后端事件类型
- **描述**: 在 events.rs 中添加细粒度事件类型定义
- **文件**:
  - `src-tauri/src/agent/events.rs`
- **验收**: 所有事件类型可正常序列化

### Task 2: 实现流式推送模块
- **描述**: 创建 stream.rs 实现 EventStream trait
- **文件**:
  - `src-tauri/src/agent/stream.rs`
- **验收**: 支持事件订阅和推送

### Task 3: 扩展前端事件类型
- **描述**: 在 runtimeEvents.ts 中添加细粒度事件类型
- **文件**:
  - `src/features/streaming/runtime/runtimeEvents.ts`
- **验收**: 前端事件类型与后端一致

### Task 4: 扩展 StreamingHostContext
- **描述**: 扩展订阅接口支持新事件类型
- **文件**:
  - `src/features/streaming/runtime/streamingHostContext.tsx`
- **验收**: 可订阅所有事件类型

### Task 5: 创建思考展示组件
- **描述**: 创建 ThinkingDisplay 组件展示思考过程
- **文件**:
  - `src/features/agent/components/ThinkingDisplay.tsx`
- **验收**: 带打字机效果，显示思考内容

### Task 6: 创建工具调用展示组件
- **描述**: 创建 ToolCallDisplay 组件展示工具调用
- **文件**:
  - `src/features/agent/components/ToolCallDisplay.tsx`
- **验收**: 显示工具名称、参数、结果、耗时

### Task 7: 创建确认对话框组件
- **描述**: 创建 ConfirmationDialog 处理用户确认
- **文件**:
  - `src/features/agent/components/ConfirmationDialog.tsx`
- **验收**: 支持确认/取消操作

### Task 8: 集成测试
- **描述**: 端到端测试事件流
- **验收**: 事件实时推送到前端并正确展示

## 测试要点

- [ ] 单元测试: 事件序列化/反序列化
- [ ] 集成测试: 事件订阅和推送
- [ ] E2E测试: 完整事件流
- [ ] 浏览器测试: UI组件渲染和动画效果

## 执行顺序

1. Task 1: 后端事件类型
2. Task 2: 流式推送模块
3. Task 3: 前端事件类型
4. Task 4: StreamingHostContext
5. Task 5: ThinkingDisplay
6. Task 6: ToolCallDisplay
7. Task 7: ConfirmationDialog
8. Task 8: 集成测试
