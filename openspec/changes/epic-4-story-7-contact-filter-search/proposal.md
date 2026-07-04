## Why

As a 销售人员，我需要 按客户和角色标记筛选联系人，以便 可以快速找到关键决策人。这是 Epic 4 的关键功能点。

## What Changes

- GET /api/v1/customers/{customer_id}/contacts?role=decision_maker 返回该客户下角色为'决策人'的联系人列表

## Capabilities

### New Capabilities
- `contact-filter-search`: 联系人按角色筛选查询的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
