## Why

As a 集团老板或运营商，我需要 创建和管理企业，以便 可以在企业内搭建组织架构。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/enterprises 创建企业记录，同时自动创建企业专属 PostgreSQL Schema，返回企业 ID 和初始管理员账号
- GET /api/v1/enterprises 返回所有企业列表及使用情况
- PUT /api/v1/enterprises/{enterprise_id} 更新企业基本信息

## Capabilities

### New Capabilities
- `enterprise-management`: 企业管理（创建/编辑/查看）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
