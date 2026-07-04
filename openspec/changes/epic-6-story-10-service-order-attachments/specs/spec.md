## ADDED Requirements

### Requirement: 售后工单附件管理

As a 售后人员，I want 上传工单相关附件（问题图片、处理凭证等），So that 售后过程有完整的证据链。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/service-orders/{order_id}/attachments 上传文件，附件存储到 /storage/{enterprise_id}/service-orders/{order_id}/

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 支持图片、PDF 等文件类型

