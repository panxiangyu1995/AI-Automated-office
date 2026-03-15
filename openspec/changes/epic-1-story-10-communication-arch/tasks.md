# Tasks: 前后端通信架构 (Story 1.10)

> **依赖**: Story 1.6 (Go后端), Story 1.8 (SQLite)

## 任务列表

### 任务 1: 创建 REST API 客户端封装
- **描述**: 创建 TypeScript API 客户端类
- **文件**: `src/lib/api/client.ts`, `src/lib/api/types.ts`
- **验收**: API 客户端可发起请求

### 任务 2: 实现 WebSocket 实时通信模块
- **描述**: 创建 WebSocket 客户端，支持自动重连
- **文件**: `src/lib/websocket/client.ts`
- **验收**: WebSocket 可连接和收发消息

### 任务 3: 完善 Tauri IPC 通信接口
- **描述**: 创建 Rust HTTP 客户端命令
- **文件**: `src-tauri/src/http/client.rs`, `src-tauri/src/http/commands.rs`
- **验收**: 前端可通过 IPC 调用 HTTP

### 任务 4: 实现请求拦截器（Token 注入）
- **描述**: 创建请求拦截器，自动注入 Token
- **文件**: `src/lib/api/interceptors.ts`
- **验收**: 请求自动携带 Token

### 任务 5: 实现响应拦截器（错误处理、Token 刷新）
- **描述**: 创建响应拦截器，处理错误和 Token 刷新
- **文件**: `src/lib/api/interceptors.ts`
- **验收**: 401 错误自动刷新 Token

### 任务 6: 实现离线请求队列
- **描述**: 创建离线请求存储和管理
- **文件**: `src-tauri/src/sync/offline_queue.rs`
- **验收**: 离线请求可存储和重放

### 任务 7: 创建 API 类型定义
- **描述**: 创建所有 API 请求和响应的类型定义
- **文件**: `src/lib/api/types.ts`
- **验收**: 类型定义完整

### 任务 8: 实现网络状态监控
- **描述**: 创建网络状态检测和事件
- **文件**: `src/hooks/useNetworkStatus.ts`, `src-tauri/src/network/status.rs`
- **验收**: 网络状态变化可监听

## 执行顺序

1. 任务 1 + 任务 7（API 客户端 + 类型）
2. 任务 3（IPC 接口）
3. 任务 4 + 任务 5（拦截器）
4. 任务 2（WebSocket）
5. 任务 6（离线队列）
6. 任务 8（网络监控）

## 测试要点

- [ ] REST API 请求成功
- [ ] WebSocket 连接成功
- [ ] Token 自动注入
- [ ] Token 刷新正常
- [ ] 离线请求存储
- [ ] 网络恢复后同步
- [ ] 网络状态监听正常
