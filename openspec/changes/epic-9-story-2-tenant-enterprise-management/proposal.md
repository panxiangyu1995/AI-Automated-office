## Why

As a 运营商，我需要 管理平台上的集团和企业租户，以便 可以控制租户的开通、暂停和注销。这是 Epic 9 的关键功能点。

## What Changes

- POST /api/v1/operator/enterprises 创建企业租户，自动创建独立 Schema
- PATCH /api/v1/operator/enterprises/{id}/suspend 暂停企业（冻结所有 API 访问），保留数据
- PATCH /api/v1/operator/enterprises/{id}/activate 恢复企业访问
- DELETE /api/v1/operator/enterprises/{id} 注销企业（30天保留期后彻底删除 Schema 和数据）

## Capabilities

### New Capabilities
- `tenant-enterprise-management`: 租户企业管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
