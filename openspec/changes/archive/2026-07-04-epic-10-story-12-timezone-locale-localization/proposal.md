## Why

As a 企业用户，我需要 系统支持时区和本地化格式，以便 时间和数据显示符合本地习惯。这是 Epic 10 的关键功能点。

## What Changes

- API 返回时间字段时按企业时区格式化返回
- PATCH /api/v1/settings/locale 更新企业本地化格式配置
- 用户个人偏好语言与企业不同时，个人语言优先级高于企业默认

## Capabilities

### New Capabilities
- `timezone-locale-localization`: 时区与格式本地化的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
