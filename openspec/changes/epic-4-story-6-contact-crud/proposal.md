## Why

As a 销售人员，我需要 管理客户下的联系人，以便 可以记录和维护客户对接人信息。这是 Epic 4 的关键功能点。

## What Changes

- POST /api/v1/customers/{customer_id}/contacts 创建联系人，必须归属某个客户
- PUT /api/v1/contacts/{contact_id} 更新联系人信息
- DELETE /api/v1/contacts/{contact_id} 软删除联系人

## Capabilities

### New Capabilities
- `contact-crud`: 联系人 CRUD的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
