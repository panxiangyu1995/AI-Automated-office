## Context

消息系统当前使用Tauri IPC进行前后端通信。`src/lib/websocket/client.ts`存在但仅为占位符，未与RuntimeEventBridge集成。Tauri IPC适合请求-响应模式，但不适合后端主动推送场景。

**当前架构问题：**
- 后端无法主动推送消息到前端
- 轮询机制延迟高、资源消耗大
- 事件系统与WebSocket割裂

## Goals / Non-Goals

**Goals:**
- 实现前端与后端的WebSocket双向实时通信
- WebSocket与现有RuntimeEventEmitter无缝集成
- 提供可靠的重连和心跳机制
- 不影响现有Tauri IPC模式的兼容性

**Non-Goals:**
- 不替代Tauri IPC用于命令调用（invoke）
- 不实现WebSocket服务器（仅客户端）
- 不处理WebSocket安全性（TLS/WSS由Tauri层处理）

## Decisions

### Decision 1: WebSocket客户端实现位置

**选择：** 在Tauri Rust端实现WebSocket客户端，通过Tauri事件转发到前端

**理由：**
- Tauri 2.0提供原生的WebSocket支持（`tauri-plugin-websocket`）
- Rust端的连接管理更稳定，不受前端React重载影响
- 减少前端复杂度和依赖

**替代方案：**
- 前端原生WebSocket：复杂度高，需处理重连和生命周期
- `ws`库：需额外依赖，桌面端已有Tauri插件

### Decision 2: 事件桥接设计

**选择：** 扩展RuntimeEventBridge，新增WebSocket事件监听通道

```
Frontend                      Rust Backend
   │                              │
   │◄──── Tauri IPC (emit) ──────│  (事件推送)
   │                              │
   │◄──── WebSocket ──────────────│  (实时消息)
   │                              │
   ├──── WebSocket ───────────────►│  (客户端消息)
   │                              │
```

**实现：**
1. Rust端：WebSocket收到消息 → 转换为Tauri事件 → emit到前端
2. 前端：RuntimeEventBridge监听`websocket_message`事件 → 路由到EventEmitter

### Decision 3: 重连策略

**选择：** 指数退避重连，最大5次重试

**参数：**
- 初始间隔：1000ms
- 最大间隔：30000ms
- 退避系数：2
- 最大重试：5次

### Decision 4: 心跳机制

**选择：** 客户端每30秒发送ping，服务端响应pong

**实现：**
- Rust端管理心跳定时器
- 超过60秒无响应认为连接断开
- 心跳失败触发重连

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| WebSocket连接不稳定 | 消息丢失 | 本地消息队列 + 重连后恢复 |
| 重连期间消息丢失 | 用户体验 | 短暂轮询降级 + 状态提示 |
| 复杂网络下延迟高 | 实时性降低 | Tauri IPC降级 + WebSocket优先级 |

## Migration Plan

**Phase 1: 基础WebSocket集成**
1. 添加`tauri-plugin-websocket`依赖
2. 在Rust端实现WebSocket客户端
3. 测试基本的消息收发

**Phase 2: 事件桥接**
1. 定义WebSocket事件格式
2. 实现Rust端事件转发
3. 前端RuntimeEventBridge添加WebSocket通道

**Phase 3: 重连与心跳**
1. 实现重连逻辑
2. 添加心跳机制
3. 添加连接状态UI指示

**Rollback:** 通过配置开关切换回纯Tauri IPC模式

## Open Questions

1. WebSocket URL配置：是否通过`tauri.conf.json`配置？
2. 多Tab场景：同一用户多个Tab是否共享WebSocket连接？
3. WebSocket与云端API的关系：是否复用同一个云端连接？
