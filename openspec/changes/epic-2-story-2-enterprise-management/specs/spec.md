## ADDED Requirements

### Requirement: 企业管理（创建/编辑/查看）

As a 集团老板或运营商，I want 创建和管理企业，So that 可以在企业内搭建组织架构。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/enterprises 创建企业记录，同时自动创建企业专属 PostgreSQL Schema，返回企业 ID 和初始管理员账号

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/enterprises 返回所有企业列表及使用情况

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PUT /api/v1/enterprises/{enterprise_id} 更新企业基本信息

