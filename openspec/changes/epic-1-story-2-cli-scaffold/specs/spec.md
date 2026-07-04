## ADDED Requirements

### Requirement: CLI 项目初始化（Cobra）

As a 开发者，I want 创建一个可运行的 CLI 项目脚手架（Go + Cobra），So that Agent 可以通过 CLI 调用后端 API。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 go run main.go，CLI 工具启动并显示帮助信息

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 项目结构遵循 cli/cmd、cli/internal/skill、cli/internal/poller 分层

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** go mod init github.com/ai-office/cli 已完成

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Cobra 框架已引入

