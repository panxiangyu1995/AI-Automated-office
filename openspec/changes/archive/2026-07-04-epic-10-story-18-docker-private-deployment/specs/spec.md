## ADDED Requirements

### Requirement: Docker 私有化部署

As a 运维人员，I want 通过 Docker Compose 一键部署私有化环境，So that 企业可以在局域网内运行完整平台。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 执行 docker-compose up -d，启动 API 服务、PostgreSQL、Redis、Qdrant 全部组件

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 修改 .env 文件中的数据库密码、JWT 密钥等，首次启动自动初始化数据库 Schema

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/health 返回服务健康状态（所有组件就绪）

