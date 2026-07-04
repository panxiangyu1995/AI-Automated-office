## ADDED Requirements

### Requirement: 审计日志（基础操作记录）

As a 管理员，I want 系统自动记录所有业务操作的审计日志，So that 我可以追溯谁在什么时间做了什么操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 用户执行任何业务操作时，系统自动记录操作者 ID、时间、类型、目标实体、变更内容

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 可按时间范围、用户、操作类型筛选查询审计日志，支持分页

