## ADDED Requirements

### Requirement: 统一响应格式与结构化错误码体系

As a Agent 开发者，I want 所有 API 返回统一格式的响应和结构化错误码，So that Agent 可以理解错误并自动恢复。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 请求成功返回 { data: ..., meta: { page, page_size, total } } 格式

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 请求失败返回 { error: { code, message, details } } 格式

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 错误码格式为 {模块}_{错误类型}_{序号}（如 AUTH_TOKEN_EXPIRED）

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Agent 可根据 error.code 程序化处理错误

