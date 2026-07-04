## ADDED Requirements

### Requirement: 时区与格式本地化

As a 企业用户，I want 系统支持时区和本地化格式，So that 时间和数据显示符合本地习惯。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** API 返回时间字段时按企业时区格式化返回

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/settings/locale 更新企业本地化格式配置

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 用户个人偏好语言与企业不同时，个人语言优先级高于企业默认

