## ADDED Requirements

### Requirement: 订阅套餐定义

As a 运营商，I want 定义和管理订阅套餐，So that 企业可以选择不同的服务等级。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/plans 创建订阅套餐（名称、价格、功能列表、用户数限制、存储配额）

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/operator/plans/{id} 更新套餐定义（已订阅的套餐不可删除，只能创建新版本）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/plans 返回所有套餐列表

