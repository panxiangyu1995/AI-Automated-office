## ADDED Requirements

### Requirement: 批量导入员工

As a 企业管理员，I want 通过 Excel/CSV 批量导入员工，So that 新企业初始化或大批量入职时不需要逐个创建。

#### Scenario 1: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** POST /api/v1/employees/import 上传符合模板的文件，逐行解析并创建员工档案

#### Scenario 2: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 返回导入结果（成功数、失败数、失败行明细）

#### Scenario 3: 验收场景
- **GIVEN** 用户已认证
- **WHEN** 执行相关操作
- **THEN** 格式正确的行正常导入，错误的行跳过并返回错误原因

