## Why

As a 企业管理员，我需要 通过 Excel/CSV 批量导入员工，以便 新企业初始化或大批量入职时不需要逐个创建。这是 Epic 3 的关键功能点。

## What Changes

- POST /api/v1/employees/import 上传符合模板的文件，逐行解析并创建员工档案
- 返回导入结果（成功数、失败数、失败行明细）
- 格式正确的行正常导入，错误的行跳过并返回错误原因

## Capabilities

### New Capabilities
- `batch-import-employees`: 批量导入员工的 API 端点和业务逻辑实现

### Modified Capabilities
<!-- None for new capability -->

## Impact

- **API**: 新增 RESTful 端点
- **数据库**: 新增/修改表结构
- **Middleware**: 涉及认证/权限检查（如适用）
- **CLI**: 对应的 CLI 命令/Skill 定义（如适用）
