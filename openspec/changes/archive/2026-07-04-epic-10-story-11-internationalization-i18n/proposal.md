## Why

As a 系统管理员，我需要 配置系统语言和翻译资源，以便 不同地区用户可以使用母语操作系统。这是 Epic 10 的关键功能点。

## What Changes

- PATCH /api/v1/settings/language 更新企业默认语言
- API 返回错误信息时按用户偏好语言返回错误码和错误消息
- GET /api/v1/i18n/translations?locale=en 返回指定语言的翻译资源
- POST /api/v1/i18n/translations 自定义翻译覆盖默认翻译

## Capabilities

### New Capabilities
- `internationalization-i18n`: 国际化与多语言的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
