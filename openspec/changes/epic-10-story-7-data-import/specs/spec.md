## ADDED Requirements

### Requirement: 数据导入

As a 企业管理员，I want 批量导入业务数据，So that 可以快速初始化系统或批量更新数据。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/data-import/upload 上传 CSV/Excel 文件，解析并返回预览

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/data-import/execute 执行导入，返回导入结果（成功数、失败数、错误明细）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 导入数据校验失败时返回错误明细（行号、字段、错误原因），允许部分导入或全部回滚

