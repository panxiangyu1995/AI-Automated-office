## ADDED Requirements

### Requirement: 运营审计与日志

As a 运营商，I want 查看平台级审计日志和操作记录，So that 可以追踪平台上的所有管理操作。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/audit-log 返回平台审计日志（租户创建/暂停/恢复/注销、套餐变更等）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/enterprises/{id}/activity 返回指定企业的活动日志（API 调用量、活跃用户数、存储用量）

