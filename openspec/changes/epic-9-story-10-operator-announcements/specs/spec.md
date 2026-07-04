## ADDED Requirements

### Requirement: 运营通知与公告

As a 运营商，I want 发布平台公告和通知，So that 企业用户可以了解平台动态和维护信息。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/announcements 发布平台公告

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/announcements 返回当前生效的公告列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/operator/announcements/{id}/revoke 撤回公告

