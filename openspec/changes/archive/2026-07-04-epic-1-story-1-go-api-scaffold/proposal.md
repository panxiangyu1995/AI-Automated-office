## Why

As a 开发者，我需要 创建一个可运行的 Go API 项目脚手架（Go + Gin + GORM + PostgreSQL），以便 后续所有业务模块可以在标准化的项目结构上开发。这是 Epic 1 的关键功能点。

## What Changes

- 执行 go run cmd/server/main.go，API 服务启动并监听配置端口（默认 8080）
- 项目结构遵循 api/cmd/server、api/internal/handler/service/repository/model、api/pkg 分层
- go mod init github.com/ai-office/api 已完成
- Gin 框架和 GORM 已引入

## Capabilities

### New Capabilities
- `go-api-scaffold`: Go API 项目初始化的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
