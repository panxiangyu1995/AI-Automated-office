## Why

As a 运营商，我需要 管理平台级服务配置和运维操作，以便 可以维护平台稳定运行。这是 Epic 9 的关键功能点。

## What Changes

- GET /api/v1/operator/services 返回平台服务列表（API 服务、数据库、Redis、Qdrant 状态）
- POST /api/v1/operator/maintenance 设置维护窗口，维护期间 API 返回 503
- GET /api/v1/operator/system-health 返回系统健康状态（CPU、内存、磁盘、数据库连接池）

## Capabilities

### New Capabilities
- `operator-service-management`: 运营服务管理的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
