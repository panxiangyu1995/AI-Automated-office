## ADDED Requirements

### Requirement: CLI 认证与配置

As a Agent 运维人员，I want 通过 CLI 工具完成认证和系统配置，So that 可以通过命令行管理系统。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ao-cli auth login，输入用户名和密码，CLI 通过 OAuth 2.0 认证，保存 Token 到本地

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ao-cli auth logout，清除本地 Token，调用 API 撤销 Token

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ao-cli config set api_url，更新 CLI 配置文件中的 API 地址

