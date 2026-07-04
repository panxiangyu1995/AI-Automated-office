## Why

As a 运维人员，我需要 通过 Docker Compose 一键部署私有化环境，以便 企业可以在局域网内运行完整平台。这是 Epic 10 的关键功能点。

## What Changes

- 执行 docker-compose up -d，启动 API 服务、PostgreSQL、Redis、Qdrant 全部组件
- 修改 .env 文件中的数据库密码、JWT 密钥等，首次启动自动初始化数据库 Schema
- GET /api/v1/health 返回服务健康状态（所有组件就绪）

## Capabilities

### New Capabilities
- `docker-private-deployment`: Docker 私有化部署的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
