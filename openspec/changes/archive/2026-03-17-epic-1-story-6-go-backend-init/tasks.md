# Tasks: Go云端后端项目初始化 (Story 1.6)

> **依赖**: 无

## 任务列表

### 任务 1: 创建 Go 项目结构
- **描述**: 使用 go mod init 初始化项目，创建标准目录结构
- **文件**: `cloud-server/` 目录下所有子目录
- **验收**: 项目结构符合 Go 标准布局

### 任务 2: 集成 Gin Web 框架
- **描述**: 安装 Gin，创建基础路由和健康检查端点
- **文件**: `go.mod`, `internal/router/router.go`, `internal/handler/health.go`
- **验收**: GET /api/v1/health 返回 200

### 任务 3: 集成 GORM 数据库 ORM
- **描述**: 安装 GORM 和 PostgreSQL 驱动，创建数据库连接模块
- **文件**: `go.mod`, `internal/config/config.go`, `pkg/database/`
- **验收**: 数据库连接池配置完成

### 任务 4: 配置 Viper 环境变量管理
- **描述**: 集成 Viper，支持 YAML 配置文件和环境变量覆盖
- **文件**: `internal/config/config.go`, `configs/config.yaml`
- **验收**: 配置可通过环境变量覆盖

### 任务 5: 集成 Zap 日志系统
- **描述**: 集成 Zap 结构化日志，配置日志级别和输出格式
- **文件**: `pkg/logger/logger.go`, `internal/middleware/logger.go`
- **验收**: 请求日志正常输出 JSON 格式

### 任务 6: 配置 Swagger API 文档
- **描述**: 集成 swaggo/swag，自动生成 API 文档
- **文件**: `go.mod`, `cmd/server/main.go`, `api/swagger/`
- **验收**: GET /swagger/index.html 显示 API 文档

### 任务 7: 实现热重载开发模式
- **描述**: 配置 Air 或 CompileDaemon 实现代码热重载
- **文件**: `.air.toml` 或 Makefile
- **验收**: 修改代码后自动重新编译

### 任务 8: 创建 Docker 配置
- **描述**: 创建 Dockerfile 和 docker-compose.yml
- **文件**: `Dockerfile`, `docker-compose.yml`
- **验收**: docker-compose up 可启动服务

## 执行顺序

1. 任务 1（项目结构）
2. 任务 2（Gin框架）
3. 任务 3 + 任务 4（数据库 + 配置）
4. 任务 5（日志）
5. 任务 6（Swagger）
6. 任务 7（热重载）
7. 任务 8（Docker）

## 测试要点

- [x] `go mod tidy` 无错误
- [x] `go run cmd/server/main.go` 启动成功
- [x] GET /api/v1/health 返回正确响应
- [x] Swagger 文档可访问
- [x] Docker 容器正常启动
- [x] 热重载功能生效
