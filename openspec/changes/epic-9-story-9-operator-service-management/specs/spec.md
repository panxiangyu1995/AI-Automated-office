## ADDED Requirements

### Requirement: 运营服务管理

As a 运营商，I want 管理平台级服务配置和运维操作，So that 可以维护平台稳定运行。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/services 返回平台服务列表（API 服务、数据库、Redis、Qdrant 状态）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/maintenance 设置维护窗口，维护期间 API 返回 503

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/system-health 返回系统健康状态（CPU、内存、磁盘、数据库连接池）

