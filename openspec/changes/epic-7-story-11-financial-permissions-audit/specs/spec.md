## ADDED Requirements

### Requirement: 财务数据权限与审计

As a 企业管理员，I want 财务数据受权限控制且操作可审计，So that 财务数据安全合规。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 非财务角色用户访问财务相关 API 时返回 403 权限不足

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 财务人员执行收付款操作后，操作记录写入审计日志（操作人、时间、金额、关联单据）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/financial-audit-log 返回财务审计日志，支持按操作人、时间、类型筛选

