## ADDED Requirements

### Requirement: 维修工单与签字确认

As a 售后人员，I want 生成维修工单并完成客户签字确认，So that 维修过程和结果有据可查。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/service-orders/{order_id}/repair-order 携带故障点、维修内容，生成维修工单

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/service-orders/{order_id}/sign-off 上传客户签字确认件，工单状态变为'待签字'

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/service-orders/{order_id}/complete 工单状态变为'已完成'

