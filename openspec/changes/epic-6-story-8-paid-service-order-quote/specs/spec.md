## ADDED Requirements

### Requirement: 收费工单报价流程

As a 售后人员，I want 为收费工单上传报价单并等待客户确认，So that 收费售后需要客户确认后才进入维修。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/service-orders/{order_id}/quote 上传报价单附件，工单状态变为'报价中'

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/service-orders/{order_id}/confirm-quote 客户确认报价后，工单状态变为'确认'，可进入维修

