## ADDED Requirements

### Requirement: 私有化部署配置与升级

As a 运维人员，I want 配置私有化部署参数和执行版本升级，So that 可以定制部署和保持系统更新。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 更新 docker-compose.yml 中的环境变量，重启服务后配置生效

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 新版本发布时，拉取新镜像并执行升级脚本，自动执行数据库迁移，保留现有数据

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/system/info 返回系统版本、部署模式、运行时间

