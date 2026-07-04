## ADDED Requirements

### Requirement: CLI 消息轮询与 Skill 执行

As a Agent，I want 通过 CLI 轮询消息和执行 Skill，So that Agent 可以自动化业务操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ao-cli poll start，CLI 后台启动消息轮询（每60秒），收到新消息时输出到终端

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ao-cli poll stop 停止消息轮询

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ao-cli skill execute hrm_employee_create --name='张三'，CLI 调用对应 Skill API 并返回执行结果

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 ao-cli skill list，列出当前企业所有可用 Skill

