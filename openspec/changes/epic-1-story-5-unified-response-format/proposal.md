## Why

As a Agent 开发者，我需要 所有 API 返回统一格式的响应和结构化错误码，以便 Agent 可以理解错误并自动恢复。这是 Epic 1 的关键功能点。

## What Changes

- 请求成功返回 { data: ..., meta: { page, page_size, total } } 格式
- 请求失败返回 { error: { code, message, details } } 格式
- 错误码格式为 {模块}_{错误类型}_{序号}（如 AUTH_TOKEN_EXPIRED）
- Agent 可根据 error.code 程序化处理错误

## Capabilities

### New Capabilities
- `unified-response-format`: 统一响应格式与结构化错误码体系的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
