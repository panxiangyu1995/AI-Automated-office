# Design: Go云端后端项目初始化

## 技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| Web框架 | Gin | 高性能、中间件丰富、社区活跃 |
| ORM | GORM | 功能完善、支持迁移、链式操作 |
| 配置 | Viper | 支持多格式、环境变量、热重载 |
| 日志 | Zap | 高性能、结构化、可配置 |
| API文档 | Swagger | 自动生成、交互式文档 |
| 验证 | validator | Gin内置、标签式验证 |

## 项目结构

```
cloud-server/
├── cmd/
│   └── server/
│       └── main.go           # 应用入口
├── internal/
│   ├── config/               # 配置管理
│   │   └── config.go
│   ├── handler/              # HTTP处理器
│   │   └── health.go
│   ├── middleware/           # 中间件
│   │   ├── cors.go
│   │   ├── logger.go
│   │   └── recovery.go
│   ├── model/                # 数据模型
│   │   └── base.go
│   ├── repository/           # 数据访问层
│   ├── service/              # 业务逻辑层
│   └── router/               # 路由定义
│       └── router.go
├── pkg/
│   ├── logger/               # 日志工具
│   │   └── logger.go
│   └── response/             # 响应封装
│       └── response.go
├── api/
│   └── swagger/              # Swagger文档
├── migrations/               # 数据库迁移
├── configs/
│   └── config.yaml           # 配置文件
├── scripts/
│   └── migrate.sh            # 迁移脚本
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── go.mod
└── go.sum
```

## API设计

### 健康检查

```
GET /api/v1/health
Response: { "status": "ok", "version": "1.0.0" }
```

### 存活与就绪

```
GET /api/v1/health/liveness
GET /api/v1/health/readiness
```

### 认证接口（预览）

```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

## 配置设计

```yaml
# configs/config.yaml
server:
  port: 8080
  mode: debug  # debug, release, test

database:
  driver: postgres
  host: localhost
  port: 5432
  name: ai_office
  user: postgres
  password: ${DB_PASSWORD}
  sslmode: disable

log:
  level: info
  format: json
  output: stdout

jwt:
  secret: ${JWT_SECRET}
  expire: 24h
```

### 配置加载顺序

1. 默认配置
2. 配置文件
3. 环境变量
4. 启动参数

环境变量命名规则采用 `SECTION_FIELD`，例如 `SERVER_PORT`、`LOG_LEVEL`。

### 传输与安全

- 线上环境统一通过 HTTPS（TLS 1.3）
- 证书由反向代理或服务进程加载其一进行管理
- 生产环境禁止输出敏感字段到日志

### 统一错误处理

- 在全局中间件完成错误格式化与错误码映射
- 业务层只返回错误码与上下文，不直接写响应

## Docker配置

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - DB_PASSWORD=postgres
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_office
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

## 文件清单

| 文件 | 说明 |
|------|------|
| `go.mod` | Go模块定义 |
| `cmd/server/main.go` | 应用入口 |
| `internal/config/config.go` | 配置结构体 |
| `internal/router/router.go` | 路由定义 |
| `internal/handler/health.go` | 健康检查 |
| `internal/middleware/` | 中间件 |
| `pkg/logger/logger.go` | 日志工具 |
| `pkg/response/response.go` | 响应封装 |
| `configs/config.yaml` | 配置模板 |
| `Dockerfile` | Docker构建 |
| `docker-compose.yml` | 容器编排 |
| `Makefile` | 构建脚本 |
