## Why

当前消息系统使用轮询或Tauri IPC进行通信，延迟较高且资源消耗大。WebSocket提供双向实时通信能力，是消息系统实时性的关键缺失部分。现有`src/lib/websocket/client.ts`仅作为简单占位符存在，未与消息系统集成。

## What Changes

- 将现有WebSocket client与RuntimeEventBridge集成
- 实现前端到后端的WebSocket双向通道
- 添加WebSocket重连机制和心跳检测
- 将Tauri IPC事件转换为WebSocket消息
- 支持后端主动推送事件到前端

## Capabilities

### New Capabilities
- `websocket-event-bridge`: 桥接WebSocket与现有事件系统，实现双向实时通信
- `websocket-reconnection`: WebSocket重连逻辑，支持指数退避和最大重试次数
- `websocket-heartbeat`: 心跳检测机制，保持连接活跃

### Modified Capabilities
- (无 - 现有消息能力仅扩展实现，不改变需求)

## Impact

**前端：**
- `src/features/streaming/runtime/runtimeEventBridge.ts` - 集成WebSocket
- `src/lib/websocket/client.ts` - 扩展为完整的WebSocket客户端
- `src/features/agent/hooks/useAgentRuntime.ts` - 支持WebSocket模式

**后端 (Rust)：**
- `src-tauri/src/agent/events.rs` - 添加WebSocket事件发射
- 新增WebSocket handler处理前端消息

**依赖：**
- 前端需添加`ws`或`native-ws`库（桌面端）
- Tauri 2.0已内置WebSocket支持
