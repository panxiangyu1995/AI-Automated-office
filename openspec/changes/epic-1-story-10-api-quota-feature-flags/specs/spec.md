## ADDED Requirements

### Requirement: API 配额管理与功能开关

As a 运营商，I want 管理企业的 API 调用配额和功能模块开关，So that 可以防止滥用并控制企业可用功能。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 企业 API 调用量达到配额限制时返回 429 Too Many Requests，错误码 AUTH_QUOTA_EXCEEDED

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 配额按周期自动重置

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 运营商关闭某企业的功能模块后，该企业用户访问该模块 API 返回 403，错误码 AUTH_FEATURE_DISABLED

