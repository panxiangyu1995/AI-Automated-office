## ADDED Requirements

### Requirement: Go API 项目初始化

As a 开发者，I want 创建一个可运行的 Go API 项目脚手架（Go + Gin + GORM + PostgreSQL），So that 后续所有业务模块可以在标准化的项目结构上开发。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 go run cmd/server/main.go，API 服务启动并监听配置端口（默认 8080）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 项目结构遵循 api/cmd/server、api/internal/handler/service/repository/model、api/pkg 分层

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** go mod init github.com/ai-office/api 已完成

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Gin 框架和 GORM 已引入

