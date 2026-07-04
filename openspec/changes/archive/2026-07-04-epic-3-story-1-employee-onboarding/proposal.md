## Why

As a 企业管理员，我需要 创建员工档案并记录入职信息，以便 新员工可以在系统中拥有账号和完整信息。这是 Epic 3 的关键功能点。

## What Changes

- POST /api/v1/employees 创建员工档案，自动生成登录凭证，记录入职日期，员工状态为'在职'

## Capabilities

### New Capabilities
- `employee-onboarding`: 员工入职（创建档案）的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
