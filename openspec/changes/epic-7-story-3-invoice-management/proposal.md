## Why

As a 财务人员，我需要 开具和管理发票，以便 可以管理开票和收票。这是 Epic 7 的关键功能点。

## What Changes

- POST /api/v1/invoices 创建发票记录
- PATCH /api/v1/invoices/{id}/status 状态流转：待开票→已开票→已寄出→已签收
- POST /api/v1/invoices/receipt 上传收到的供应商发票，创建收票记录

## Capabilities

### New Capabilities
- `invoice-management`: 发票管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
