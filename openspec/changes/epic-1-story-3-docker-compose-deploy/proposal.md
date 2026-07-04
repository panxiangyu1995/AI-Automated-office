## Why

As a 运维人员，我需要 通过 Docker Compose 一键启动 PostgreSQL + Redis + API 服务，以便 开发和部署环境可以快速搭建。这是 Epic 1 的关键功能点。

## What Changes

- 执行 docker-compose up -d，PostgreSQL 15+、Redis 7、API 服务容器全部启动
- API 服务可以连接 PostgreSQL 和 Redis
- .env.example 包含所有必要环境变量模板

## Capabilities

### New Capabilities
- `docker-compose-deploy`: Docker Compose 部署配置的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
