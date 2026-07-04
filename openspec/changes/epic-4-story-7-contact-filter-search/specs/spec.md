## ADDED Requirements

### Requirement: 联系人按角色筛选查询

As a 销售人员，I want 按客户和角色标记筛选联系人，So that 可以快速找到关键决策人。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/customers/{customer_id}/contacts?role=decision_maker 返回该客户下角色为'决策人'的联系人列表

