## ADDED Requirements

### Requirement: 跨企业经营汇总

As a 集团老板，I want 查看跨企业的经营汇总数据，So that 可以一览集团下所有企业的经营状况。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/groups/{group_id}/summary 返回集团下所有企业的核心经营指标

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 支持按企业对比

