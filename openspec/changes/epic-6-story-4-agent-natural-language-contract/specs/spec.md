## ADDED Requirements

### Requirement: Agent 自然语言修改合同字段

As a Agent，I want 通过自然语言修改合同字段，So that 用户可以说'把合同金额改成 50 万'来修改合同。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** Agent 解析自然语言为结构化字段修改请求，调用 PATCH /api/v1/contracts/{contract_id} 更新指定字段

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 只允许修改草稿和审批中状态的合同

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 修改记录写入审计日志

