## Why

As a 运维人员，我需要 配置私有化部署参数和执行版本升级，以便 可以定制部署和保持系统更新。这是 Epic 10 的关键功能点。

## What Changes

- 更新 docker-compose.yml 中的环境变量，重启服务后配置生效
- 新版本发布时，拉取新镜像并执行升级脚本，自动执行数据库迁移，保留现有数据
- GET /api/v1/system/info 返回系统版本、部署模式、运行时间

## Capabilities

### New Capabilities
- `private-deployment-config-upgrade`: 私有化部署配置与升级的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
