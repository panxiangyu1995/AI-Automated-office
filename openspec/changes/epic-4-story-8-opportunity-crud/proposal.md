## Why

As a 销售人员，我需要 创建和管理商机，以便 可以跟踪潜在的销售机会。这是 Epic 4 的关键功能点。

## What Changes

- POST /api/v1/opportunities 创建商机，必须归属某个客户
- PUT /api/v1/opportunities/{opportunity_id} 更新商机信息
- PATCH /api/v1/opportunities/{opportunity_id}/status 更新商机状态（跟进中→报价中→成交/失败）

## Capabilities

### New Capabilities
- `opportunity-crud`: 商机 CRUD的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
