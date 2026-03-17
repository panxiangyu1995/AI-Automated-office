# Spec: 前后端通信架构

## 需求来源

| 来源 | 编号 | 描述 |
|------|------|------|
| PRD | FR9 | AI对话 - 需要通信基础 |
| PRD | FR44 | 消息通知 - 需要实时推送 |
| PRD | FR46 | 任务通知 - 需要状态同步 |
| 架构 | ADR-004 | 通信架构设计 |
| NFR | NFR9 | TLS 1.3 加密 |
| NFR | NFR17 | 服务可用性 |

## 验收场景

### 场景 1: REST API 请求

**Given** 用户已登录
**When** 前端发起 API 请求
**Then** 请求自动携带 Authorization Header
**And** 请求通过 Tauri IPC 转发到 Rust HTTP Client
**And** 成功返回响应数据

### 场景 2: WebSocket 连接

**Given** 用户已登录
**When** 建立 WebSocket 连接
**Then** 使用 Token 进行认证
**And** 连接成功后可收发消息
**And** 支持自动重连（最多5次）

### 场景 2.1: 心跳与断线检测

**Given** WebSocket 已连接
**When** 客户端定期发送心跳
**Then** 服务端返回心跳响应
**And** 超过心跳阈值自动断线并重连

### 场景 3: 请求拦截器

**Given** API 客户端已初始化
**When** 发起请求
**Then** 自动注入以下 Header：
- `Authorization: Bearer {token}`
- `Content-Type: application/json`
- `X-Request-ID: {uuid}`

### 场景 4: 响应拦截器 - 错误处理

**Given** API 返回错误响应
**When** 状态码为 4xx 或 5xx
**Then** 统一错误格式：
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "错误描述"
}
```

### 场景 5: Token 刷新

**Given** API 返回 401 错误
**When** 检测到 Token 过期
**Then** 自动调用刷新 Token 接口
**And** 使用新 Token 重试原请求
**And** 刷新失败时跳转登录页

### 场景 5.1: Token 刷新并发控制

**Given** 同时触发多个 401 响应
**When** 发起刷新流程
**Then** 只允许一次刷新请求进行
**And** 等待中的请求在刷新完成后重试

### 场景 6: 离线请求队列

**Given** 网络不可用
**When** 用户发起写操作请求
**Then** 请求存入 SQLite 同步队列
**And** 状态标记为 `pending`
**And** 网络恢复后自动重试

### 场景 6.1: 离线幂等重放

**Given** 队列存在待重放写请求
**When** 网络恢复并执行重放
**Then** 请求携带幂等键
**And** 服务端根据幂等键去重

### 场景 7: 网络状态监控

**Given** 应用正在运行
**When** 网络状态变化
**Then** 触发 `network-status-changed` 事件
**And** 前端可通过 Hook 监听状态
**And** 状态变化时显示提示

## 数据规格

### API 客户端配置

```typescript
interface ApiClientConfig {
  baseUrl: string;
  timeout: number;         // 默认 30000ms
  retryCount: number;      // 默认 3
  retryDelay: number;      // 默认 1000ms
  retryBackoff: 'exponential' | 'fixed';
}
```

### API 响应格式

```typescript
// 成功响应
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// 错误响应
interface ApiError {
  success: false;
  code: string;
  message: string;
  details?: Record<string, string>;
}
```

### WebSocket 消息格式

```typescript
// 客户端发送
interface WebSocketMessage {
  type: 'ping' | 'pong' | 'subscribe' | 'unsubscribe' | 'action';
  payload: unknown;
  timestamp: number;
}

// 服务端推送
interface WebSocketNotification {
  type: 'notification' | 'task_update' | 'message' | 'sync';
  payload: unknown;
  timestamp: number;
}
```

### 离线队列项

```typescript
interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  body?: string;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'failed' | 'synced';
  lastError?: string;
  idempotencyKey?: string;
}
```

### 网络状态

```typescript
interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'wifi' | 'ethernet' | 'cellular' | 'unknown';
  lastChecked: number;
}
```

## Rust 接口规格

```rust
// HTTP 命令
#[tauri::command]
pub async fn http_request(
    method: String,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
) -> Result<HttpResponse, String>;

#[tauri::command]
pub async fn http_get(url: String, headers: HashMap<String, String>) -> Result<HttpResponse, String>;

#[tauri::command]
pub async fn http_post(url: String, body: String, headers: HashMap<String, String>) -> Result<HttpResponse, String>;

// 网络状态
#[tauri::command]
pub async fn get_network_status() -> Result<NetworkStatus, String>;

// 离线队列
#[tauri::command]
pub async fn enqueue_request(request: QueuedRequest) -> Result<String, String>;

#[tauri::command]
pub async fn get_pending_requests() -> Result<Vec<QueuedRequest>, String>;

#[tauri::command]
pub async fn process_pending_requests() -> Result<Vec<SyncResult>, String>;
```

## TypeScript 接口规格

```typescript
// API 客户端
class ApiClient {
  constructor(config: ApiClientConfig);
  setToken(token: string | null): void;
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
}

// WebSocket 客户端
class WebSocketClient extends EventEmitter {
  constructor(url: string);
  connect(token: string): void;
  disconnect(): void;
  send(type: string, payload: unknown): void;
  // Events: 'connected', 'disconnected', 'message', 'error'
}

// Hooks
function useNetworkStatus(): { isOnline: boolean };
function useApi(): { client: ApiClient; loading: boolean; error: ApiError | null };
```

## 错误处理

| 错误码 | HTTP状态 | 描述 |
|--------|----------|------|
| `ERR_NETWORK` | - | 网络错误 |
| `ERR_TIMEOUT` | - | 请求超时 |
| `ERR_UNAUTHORIZED` | 401 | 未授权 |
| `ERR_FORBIDDEN` | 403 | 权限不足 |
| `ERR_NOT_FOUND` | 404 | 资源不存在 |
| `ERR_VALIDATION` | 422 | 参数验证失败 |
| `ERR_SERVER` | 500 | 服务器错误 |
| `ERR_OFFLINE` | - | 离线状态 |

## 安全考虑

1. **TLS 1.3**: 所有通信使用 HTTPS
2. **Token 存储**: 使用安全存储（Tauri 的 Keychain/Keystore）
3. **请求签名**: 可选的请求签名验证
4. **CORS**: 严格限制允许的源
5. **敏感数据**: 不在日志中记录敏感信息
6. **证书校验**: 默认开启证书与域名校验
