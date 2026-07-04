## ADDED Requirements

### Requirement: 国际化与多语言

As a 系统管理员，I want 配置系统语言和翻译资源，So that 不同地区用户可以使用母语操作系统。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** PATCH /api/v1/settings/language 更新企业默认语言

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** API 返回错误信息时按用户偏好语言返回错误码和错误消息

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/i18n/translations?locale=en 返回指定语言的翻译资源

#### Scenario 4: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/i18n/translations 自定义翻译覆盖默认翻译

