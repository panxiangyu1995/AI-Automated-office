## Why

As a Agent，我需要 通过 CLI 轮询消息和执行 Skill，以便 Agent 可以自动化业务操作。这是 Epic 10 的关键功能点。

## What Changes

- 执行 ao-cli poll start，CLI 后台启动消息轮询（每60秒），收到新消息时输出到终端
- 执行 ao-cli poll stop 停止消息轮询
- 执行 ao-cli skill execute hrm_employee_create --name='张三'，CLI 调用对应 Skill API 并返回执行结果
- 执行 ao-cli skill list，列出当前企业所有可用 Skill

## Capabilities

### New Capabilities
- `cli-message-polling-skill-execution`: CLI 消息轮询与 Skill 执行的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
