## Why

As a Agent 运维人员，我需要 通过 CLI 工具完成认证和系统配置，以便 可以通过命令行管理系统。这是 Epic 10 的关键功能点。

## What Changes

- 执行 ao-cli auth login，输入用户名和密码，CLI 通过 OAuth 2.0 认证，保存 Token 到本地
- 执行 ao-cli auth logout，清除本地 Token，调用 API 撤销 Token
- 执行 ao-cli config set api_url，更新 CLI 配置文件中的 API 地址

## Capabilities

### New Capabilities
- `cli-auth-configuration`: CLI 认证与配置的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
