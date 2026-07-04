## ADDED Requirements

### Requirement: 发票管理

As a 财务人员，I want 开具和管理发票，So that 可以管理开票和收票。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/invoices 创建发票记录

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/invoices/{id}/status 状态流转：待开票→已开票→已寄出→已签收

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/invoices/receipt 上传收到的供应商发票，创建收票记录

