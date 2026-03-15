# Spec: Go云端后端项目初始化

## 需求来源

| 来源 | 编号 | 描述 |
|------|------|------|
| PRD | FR27 | 用户登录基础 - 需要后端认证服务 |
| 架构 | ADR-005 | 多租户架构 - Cloud Layer 实现 |
| NFR | NFR9 | TLS 1.3 加密通信 |
| NFR | NFR10 | AES-256 数据加密 |

## 验收场景

### 场景 1: 项目初始化

**Given** 开发环境已配置 Go 1.21+
**When** 执行 `go mod init` 和目录创建
**Then** 生成标准项目结构：
```
cloud-server/
├── cmd/server/main.go
├── internal/
│   ├── config/
│   ├── handler/
│   ├── middleware/
│   ├── model/
│   ├── repository/
│   ├── service/
│   └── router/
├── pkg/
│   ├── logger/
│   └── response/
├── api/swagger/
├── migrations/
├── configs/
└── scripts/
```

### 场景 2: Web服务启动

**Given** 项目已初始化
**When** 执行 `go run cmd/server/main.go`
**Then** 服务在端口 8080 启动
**And** GET `/api/v1/health` 返回：
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2026-03-15T10:00:00Z"
}
```

### 场景 2.1: 存活与就绪检查

**Given** 服务启动完成
**When** 请求 `/api/v1/health/liveness`
**Then** 返回存活状态
**And** 请求 `/api/v1/health/readiness`
**Then** 返回就绪状态（包含依赖检查结果）

### 场景 3: 配置管理

**Given** 配置文件 `configs/config.yaml` 存在
**When** 设置环境变量 `SERVER_PORT=9090`
**Then** 服务在端口 9090 启动（环境变量覆盖配置文件）

**And** 配置加载顺序为：默认配置 → 配置文件 → 环境变量 → 启动参数

### 场景 4: 日志输出

**Given** 服务正在运行
**When** 发送 HTTP 请求
**Then** 输出结构化 JSON 日志：
```json
{
  "level": "info",
  "ts": "2026-03-15T10:00:00.000Z",
  "msg": "request received",
  "method": "GET",
  "path": "/api/v1/health",
  "status": 200,
  "latency": "1.23ms"
}
```

### 场景 5: Swagger 文档

**Given** 服务正在运行
**When** 访问 `GET /swagger/index.html`
**Then** 显示 Swagger UI 界面
**And** 显示健康检查 API 文档

### 场景 6: Docker 部署

**Given** Docker 和 Docker Compose 已安装
**When** 执行 `docker-compose up`
**Then** 服务容器正常启动
**And** 健康检查端点可访问

### 场景 7: 热重载

**Given** 使用 Air 或 CompileDaemon
**When** 修改 Go 源码文件
**Then** 服务自动重新编译和重启

## 数据规格

### 配置文件格式

```yaml
# configs/config.yaml
server:
  port: 8080
  mode: debug    # debug, release, test
  read_timeout: 30s
  write_timeout: 30s

database:
  driver: postgres
  host: localhost
  port: 5432
  name: ai_office
  user: postgres
  password: ${DB_PASSWORD}
  sslmode: disable
  max_open_conns: 100
  max_idle_conns: 10
  conn_max_lifetime: 1h

log:
  level: info     # debug, info, warn, error
  format: json    # json, console
  output: stdout  # stdout, file
  file_path: logs/app.log

jwt:
  secret: ${JWT_SECRET}
  expire: 24h
  issuer: ai-office

cors:
  allowed_origins:
    - "http://localhost:1420"
    - "tauri://localhost"
  allowed_methods:
    - GET
    - POST
    - PUT
    - DELETE
  allowed_headers:
    - Authorization
    - Content-Type
```

### 传输安全

- 线上环境必须启用 TLS 1.3
- 日志不得输出密钥、Token、密码等敏感字段

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

### 健康检查响应

```typescript
interface HealthResponse {
  status: "ok" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  checks?: {
    database?: { status: string; latency: string };
    redis?: { status: string; latency: string };
  };
}
```

## 错误处理

| 错误码 | HTTP状态 | 描述 |
|--------|----------|------|
| `ERR_INVALID_REQUEST` | 400 | 请求参数无效 |
| `ERR_UNAUTHORIZED` | 401 | 未授权访问 |
| `ERR_FORBIDDEN` | 403 | 权限不足 |
| `ERR_NOT_FOUND` | 404 | 资源不存在 |
| `ERR_INTERNAL` | 500 | 服务器内部错误 |
| `ERR_SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

## 安全考虑

1. **敏感配置**: 密码、密钥等使用环境变量
2. **CORS**: 严格限制允许的源
3. **日志脱敏**: 不记录敏感信息
4. **错误信息**: 生产环境不暴露内部细节
