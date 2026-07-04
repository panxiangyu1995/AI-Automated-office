## Why

As a 运营商，我需要 创建、编辑和删除集团账号，以便 可以为拥有多个企业的老板建立集团管理入口。这是 Epic 2 的关键功能点。

## What Changes

- POST /api/v1/groups 创建集团记录，返回集团 ID 和名称，自动创建集团 Owner 用户账号
- PUT /api/v1/groups/{group_id} 更新集团信息
- DELETE /api/v1/groups/{group_id} 软删除集团（集团下无活跃企业时才允许删除）

## Capabilities

### New Capabilities
- `group-management`: 集团管理（创建/编辑/删除）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
