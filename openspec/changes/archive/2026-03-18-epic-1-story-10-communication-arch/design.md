# Design: 前后端通信架构

## 通信架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Tauri Desktop App                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐        Tauri IPC        ┌─────────────────┐   │
│  │   React 前端     │ ◄────────────────────► │   Rust 后端      │   │
│  │                 │                         │                 │   │
│  │  ┌───────────┐  │                         │  ┌───────────┐  │   │
│  │  │ API Client│  │                         │  │ HTTP Client│  │   │
│  │  └─────┬─────┘  │                         │  └─────┬─────┘  │   │
│  └────────┼────────┘                         └────────┼────────┘   │
│           │                                           │            │
│           │              ┌─────────────┐              │            │
│           └──────────────┤  离线队列    ├──────────────┘            │
│                          │  (SQLite)   │                           │
│                          └─────────────┘                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                          HTTPS / WebSocket
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Go Cloud Server                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │  REST API   │  │  WebSocket  │  │    Auth     │                  │
│  │  :8080      │  │  :8080/ws   │  │   Service   │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

## REST API 客户端

### TypeScript 实现

```typescript
// src/lib/api/client.ts
import { invoke } from '@tauri-apps/api/core';

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async request<T>(config: RequestConfig): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (!config.skipAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // 通过 Tauri IPC 调用 Rust HTTP 客户端
    const response = await invoke<ApiResponse<T>>('http_request', {
      method: config.method,
      url: `${this.baseUrl}${config.url}`,
      headers,
      body: config.data ? JSON.stringify(config.data) : null,
    });

    if (!response.success) {
      throw new ApiError(response.code, response.message);
    }

    return response.data;
  }

  async get<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T>(url: string, data?: unknown, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}
```

### Token 刷新并发控制

- 刷新请求采用单飞机制，避免并发 401 引发多次刷新
- 刷新完成后重放等待中的请求

### 请求重试与幂等

- 幂等写操作携带幂等键
- 重试遵循指数退避与最大重试次数

### Rust HTTP 客户端

```rust
// src-tauri/src/http/client.rs
use reqwest::{Client, Method, Response};
use serde::{Deserialize, Serialize};

pub struct HttpClient {
    client: Client,
    base_url: String,
}

#[derive(Serialize)]
pub struct HttpRequest {
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

#[tauri::command]
pub async fn http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = Client::new();
    
    let method = Method::from_bytes(request.method.as_bytes())
        .map_err(|e| e.to_string())?;
    
    let mut req = client.request(method, &request.url);
    
    for (key, value) in request.headers {
        req = req.header(key, value);
    }
    
    if let Some(body) = request.body {
        req = req.body(body);
    }
    
    let response = req.send().await.map_err(|e| e.to_string())?;
    
    // 处理响应...
}
```

## WebSocket 实现

```typescript
// src/lib/websocket/client.ts
import { EventEmitter } from 'events';

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string) {
    super();
    this.url = url;
  }

  connect(token: string) {
    const wsUrl = `${this.url}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.emit('message', message);
    };

    this.ws.onclose = () => {
      this.emit('disconnected');
      this.attemptReconnect(token);
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  send(type: string, payload: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(token), this.reconnectDelay * this.reconnectAttempts);
    }
  }
}
```

### 心跳与断线检测

- 客户端定期发送 ping，服务端返回 pong
- 超过心跳阈值自动断线并进入重连流程

## 离线请求队列

```rust
// src-tauri/src/sync/offline_queue.rs
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct QueuedRequest {
    pub id: String,
    pub method: String,
    pub url: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub created_at: i64,
    pub retry_count: i32,
}

impl OfflineQueue {
    pub async fn enqueue(&self, request: QueuedRequest) -> Result<()> {
        // 存入 SQLite sync_queue 表
    }

    pub async fn process_pending(&self) -> Result<Vec<SyncResult>> {
        // 网络恢复后处理队列
    }

    pub async fn clear_synced(&self) -> Result<()> {
        // 清除已同步的请求
    }
}
```

### 离线队列幂等

- 队列项包含幂等键与业务主键
- 服务端根据幂等键去重

## 网络状态监控

```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听 Tauri 网络事件
    const unlisten = listen('network-status-changed', (event) => {
      setIsOnline(event.payload as boolean);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unlisten.then(fn => fn());
    };
  }, []);

  return { isOnline };
}
```

### 传输安全

- 强制启用 HTTPS（TLS 1.3）
- 证书校验与域名校验为默认启用

## 文件清单

| 文件 | 说明 |
|------|------|
| `src/lib/api/client.ts` | REST API 客户端 |
| `src/lib/api/types.ts` | API 类型定义 |
| `src/lib/api/interceptors.ts` | 拦截器 |
| `src/lib/websocket/client.ts` | WebSocket 客户端 |
| `src/hooks/useNetworkStatus.ts` | 网络状态 Hook |
| `src/hooks/useApi.ts` | API 请求 Hook |
| `src-tauri/src/http/client.rs` | HTTP 客户端 |
| `src-tauri/src/http/commands.rs` | HTTP Tauri 命令 |
| `src-tauri/src/sync/offline_queue.rs` | 离线队列 |
| `src-tauri/src/network/status.rs` | 网络状态检测 |
