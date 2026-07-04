## ADDED Requirements

### Requirement: 客户服务工单

As a 运营商客服，I want 创建和管理客户服务工单，So that 可以处理企业客户的服务请求。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/operator/service-tickets 创建客服工单

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/operator/service-tickets/{id}/status 状态流转：待处理→处理中→已解决→已关闭

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/operator/service-tickets?status=open&priority=high 按状态和优先级筛选工单列表

