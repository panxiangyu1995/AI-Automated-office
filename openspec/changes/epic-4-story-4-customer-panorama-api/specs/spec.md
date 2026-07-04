## ADDED Requirements

### Requirement: 客户全景视图 API

As a Agent，I want 通过一个 API 获取客户的全景数据，So that 可以为用户生成完整的客户画像。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customers/{customer_id}/panorama 一次性返回该客户的所有关联数据：联系人列表、商机列表、关联合同列表、关联售后工单列表、往来款汇总

