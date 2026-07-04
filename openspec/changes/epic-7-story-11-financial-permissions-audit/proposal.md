## Why

As a 企业管理员，我需要 财务数据受权限控制且操作可审计，以便 财务数据安全合规。这是 Epic 7 的关键功能点。

## What Changes

- 非财务角色用户访问财务相关 API 时返回 403 权限不足
- 财务人员执行收付款操作后，操作记录写入审计日志（操作人、时间、金额、关联单据）
- GET /api/v1/financial-audit-log 返回财务审计日志，支持按操作人、时间、类型筛选

## Capabilities

### New Capabilities
- `financial-permissions-audit`: 财务数据权限与审计的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
