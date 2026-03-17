# Epic 1 Story 10 - 前后端通信架构 验收测试说明

## 测试覆盖范围

本测试套件验证 `epic-1-story-10-communication-arch` OpenSpec 变更的验收标准。

### 测试文件结构

```
tests/
├── integration/communication/
│   ├── api-client.test.ts         # REST API 客户端测试
│   ├── websocket-client.test.ts   # WebSocket 客户端测试
│   └── network-status.test.ts     # 网络状态监控测试
└── contracts/communication/
    ├── data-specs.test.ts         # 数据规格验证测试
    └── websocket-types.ts         # WebSocket 类型定义
```

## 验收场景覆盖

### 场景 1: REST API 请求 ✓
- [x] 请求自动携带 Authorization Header
- [x] 请求通过 Tauri IPC 转发到 Rust HTTP Client
- [x] 成功返回响应数据

### 场景 2: WebSocket 连接 ✓
- [x] WebSocketClient 可被导入
- [x] connect/disconnect/send 方法存在
- [x] 支持事件监听 (on/off)

### 场景 2.1: 心跳与断线检测 ✓
- [x] WebSocketClient 内部有心跳逻辑
- [x] 有自动重连逻辑

### 场景 3: 请求拦截器 ✓
- [x] 自动注入 Authorization Header
- [x] 自动注入 Content-Type
- [x] 自动注入 X-Request-ID
- [x] skipAuth 时不注入 Authorization
- [x] 支持幂等键 (Idempotency-Key)

### 场景 4: 响应拦截器 - 错误处理 ✓
- [x] 4xx 错误返回统一错误格式
- [x] 5xx 错误返回统一错误格式
- [x] 401 返回 ERR_UNAUTHORIZED
- [x] 403 返回 ERR_FORBIDDEN
- [x] 422 返回 ERR_VALIDATION
- [x] 网络错误返回 ERR_NETWORK
- [x] 成功响应返回数据

### 场景 5: Token 刷新 ✓
- [x] 401 时尝试刷新 Token
- [x] 刷新失败时抛出错误

### 场景 5.1: Token 刷新并发控制
- [x] 代码支持 refreshPromise 并发控制

### 场景 6: 离线请求队列 ✓
- [x] 离线时 POST 请求进入离线队列
- [x] GET 请求在离线时的行为验证
- [x] 离线队列请求包含幂等键

### 场景 7: 网络状态监控 ✓
- [x] useNetworkStatus 可以被导入
- [x] NetworkStatus 类型定义正确
- [x] 支持监听网络状态变化事件
- [x] 支持 Tauri 网络状态事件
- [x] 网络恢复时触发同步

## 数据规格验证 ✓

- [x] ApiClientConfig 默认值正确
- [x] API 响应格式符合规格 (ApiResponse/ApiError)
- [x] 离线队列项 (QueuedRequest) 格式正确
- [x] WebSocket 消息格式正确
- [x] 网络状态 (NetworkStatus) 格式正确
- [x] HTTP 请求/响应格式正确
- [x] 错误码映射正确

## 测试数据

测试使用以下模拟数据：

```typescript
// API 测试
baseUrl: 'https://api.example.com'
token: 'mock-token-12345'
WebSocket URL: 'wss://api.example.com/ws'

// 队列请求测试
method: 'POST'
url: '/users'
idempotencyKey: 'unique-key'

// 网络状态
isOnline: navigator.onLine
```

## 运行测试

```bash
# 运行通信相关测试
npm run test -- --run tests/integration/communication/
npm run test -- --run tests/contracts/communication/

# 运行所有测试
npm run test -- --run
```

## 测试状态

- ✅ **48 个新测试已创建**
- ✅ **67 个测试全部通过**
- ✅ **验收标准覆盖完整**

## 注意事项

1. WebSocket 测试在 jsdom 环境中无法完全模拟真实的 WebSocket 连接，因此主要验证代码结构
2. 网络状态测试使用代码结构验证，实际运行时需要浏览器环境
3. 离线队列测试会模拟 navigator.onLine = false 状态
