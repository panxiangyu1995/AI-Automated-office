## ADDED Requirements

### Requirement: 商机 CRUD

As a 销售人员，I want 创建和管理商机，So that 可以跟踪潜在的销售机会。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/opportunities 创建商机，必须归属某个客户

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/opportunities/{opportunity_id} 更新商机信息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/opportunities/{opportunity_id}/status 更新商机状态（跟进中→报价中→成交/失败）

