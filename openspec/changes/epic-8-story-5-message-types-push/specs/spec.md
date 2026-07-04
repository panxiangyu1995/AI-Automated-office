## ADDED Requirements

### Requirement: 消息类型与推送

As a 系统管理员，I want 配置消息类型和推送规则，So that 不同业务事件触发不同类型的消息通知。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 系统产生业务事件（审批待办、合同到期、库存预警等）时自动生成对应类型的消息并推送给相关用户

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/messages?type=approval&status=unread 按类型和状态筛选消息列表

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/messages/summary 返回各类型未读消息数量汇总

