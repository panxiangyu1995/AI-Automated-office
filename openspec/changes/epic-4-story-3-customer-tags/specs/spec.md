## ADDED Requirements

### Requirement: 客户自由标签

As a 销售人员，I want 为客户添加多个自定义标签，So that 可以灵活分类和筛选客户。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/customers/{customer_id}/tags 为客户添加标签

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customers?tags=战略合作 返回包含指定标签的客户列表

