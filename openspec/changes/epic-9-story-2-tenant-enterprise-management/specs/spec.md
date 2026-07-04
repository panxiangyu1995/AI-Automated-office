## ADDED Requirements

### Requirement: 租户企业管理

As a 运营商，I want 管理平台上的集团和企业租户，So that 可以控制租户的开通、暂停和注销。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/enterprises 创建企业租户，自动创建独立 Schema

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/operator/enterprises/{id}/suspend 暂停企业（冻结所有 API 访问），保留数据

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/operator/enterprises/{id}/activate 恢复企业访问

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** DELETE /api/v1/operator/enterprises/{id} 注销企业（30天保留期后彻底删除 Schema 和数据）

