## Why

As a 财务人员，我需要 查看财务对账和统计报表，以便 可以掌握企业财务状况。这是 Epic 7 的关键功能点。

## What Changes

- GET /api/v1/financial-summary 返回指定期间收支汇总
- GET /api/v1/financial-reconciliation?contract_id={id} 返回合同维度的对账明细
- GET /api/v1/financial-statistics 返回企业财务统计数据（月度收支趋势、费用分类占比）

## Capabilities

### New Capabilities
- `financial-reconciliation-statistics`: 财务对账与统计的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
