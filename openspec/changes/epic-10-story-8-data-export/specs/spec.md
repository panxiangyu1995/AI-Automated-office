## ADDED Requirements

### Requirement: 数据导出

As a 企业用户，I want 导出业务数据，So that 可以在本地分析或备份。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/data-export 创建异步导出任务

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/data-export/{id}/download 下载导出文件

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** GET /api/v1/data-export/history 返回导出历史列表

