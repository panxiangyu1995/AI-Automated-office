## Why

As a 售后人员，我需要 上传工单相关附件（问题图片、处理凭证等），以便 售后过程有完整的证据链。这是 Epic 6 的关键功能点。

## What Changes

- POST /api/v1/service-orders/{order_id}/attachments 上传文件，附件存储到 /storage/{enterprise_id}/service-orders/{order_id}/
- 支持图片、PDF 等文件类型

## Capabilities

### New Capabilities
- `service-order-attachments`: 售后工单附件管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
