## Why

当前流式消息渲染存在两个问题：1) `part_delta`事件存在但UI未正确响应，导致流式文本更新不流畅；2) 工具调用卡片状态更新不完整，用户无法实时看到工具执行进度。这影响AI交互的实时反馈体验。

## What Changes

- 修复`part_delta`事件的处理逻辑，确保流式文本实时更新
- 优化MessageList渲染性能，使用虚拟列表避免大数据量卡顿
- 实现工具调用卡片的实时状态展示（pending/running/success/error）
- 添加流式内容的闪烁/打字机效果
- 优化流式输出的内存占用

## Capabilities

### New Capabilities
- `streaming-text-render`: 流式文本的平滑渲染优化
- `virtualized-message-list`: 虚拟化消息列表，支持大量消息高效渲染
- `tool-call-status-display`: 工具调用实时状态展示

### Modified Capabilities
- (无 - 纯优化，不改变功能需求)

## Impact

**前端：**
- `src/features/agent/components/MessageList.tsx` - 虚拟化改造
- `src/features/agent/components/ChatMessage.tsx` - 流式渲染优化
- `src/features/agent/hooks/useChatStore.ts` - 流式状态管理修复
- `src/features/streaming/runtime/syncEngine.ts` - 事件处理优化

**性能目标：**
- 消息列表滚动流畅度：60fps
- 流式文本延迟：<50ms
- 内存占用降低：30%

**依赖：**
- 前端需添加`@tanstack/react-virtual`或类似虚拟列表库
