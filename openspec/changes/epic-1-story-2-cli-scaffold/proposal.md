## Why

As a 开发者，我需要 创建一个可运行的 CLI 项目脚手架（Go + Cobra），以便 Agent 可以通过 CLI 调用后端 API。这是 Epic 1 的关键功能点。

## What Changes

- 执行 go run main.go，CLI 工具启动并显示帮助信息
- 项目结构遵循 cli/cmd、cli/internal/skill、cli/internal/poller 分层
- go mod init github.com/ai-office/cli 已完成
- Cobra 框架已引入

## Capabilities

### New Capabilities
- `cli-scaffold`: CLI 项目初始化（Cobra）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
