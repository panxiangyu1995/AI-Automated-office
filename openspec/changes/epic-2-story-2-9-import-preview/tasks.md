# Tasks: Import Preview and Conflict Detection

## 任务列表

### 任务 1: 创建导入批次数据表 ✅
- **描述**: 创建 user_import_batches 表存储导入批次信息
- **文件**: 
  - `cloud-server/migrations/011_user_import_batches.up.sql`
  - `cloud-server/migrations/011_user_import_batches.down.sql`
- **验收**: ✅ 数据表创建成功，包含必要的字段和索引

### 任务 2: 定义导入数据结构 ✅
- **描述**: 定义导入用户行、冲突项、错误项等数据结构
- **文件**: 
  - `cloud-server/internal/module/admin/domain/entity/import_batch.go`
  - `cloud-server/internal/module/admin/application/dto/import_preview.go`
- **验收**: ✅ 数据结构完整，包含所有必要字段

### 任务 3: 实现 Excel 解析器 ✅
- **描述**: 实现 Excel 文件解析和字段映射功能
- **文件**: 
  - `cloud-server/internal/module/admin/infrastructure/parser/excel_parser.go`
  - `cloud-server/internal/module/admin/infrastructure/parser/field_mapper.go`
- **验收**: ✅ 
  - 支持 .xlsx 格式解析
  - 支持自定义字段映射
  - 支持必填字段验证

### 任务 4: 实现冲突检测服务 ✅
- **描述**: 实现重复账号、工号、组织架构冲突检测
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/conflict_checker.go`
- **验收**: ✅ 
  - 检测用户名重复
  - 检测工号重复
  - 检测部门不存在
  - 检测岗位不存在
  - 检测上级不存在

### 任务 5: 实现导入预览服务 ✅
- **描述**: 实现导入预览的主要业务逻辑
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/import_service.go`
- **验收**: ✅ 
  - 协调解析器和冲突检测
  - 生成预览报告
  - 创建导入批次记录

### 任务 6: 创建导入模板下载 API ✅
- **描述**: 提供标准导入模板下载接口
- **文件**: 
  - `cloud-server/internal/module/admin/interface/handler/import_handler.go`
- **验收**: ✅ 
  - 返回标准模板字段定义
  - 包含必填字段说明

### 任务 7: 创建导入预览 API ✅
- **描述**: 创建文件上传和预览接口
- **文件**: 
  - `cloud-server/internal/module/admin/interface/handler/import_handler.go`
- **验收**: ✅ 
  - 接收 Excel 文件上传
  - 返回预览数据
  - 返回冲突和错误列表

### 任务 8: 实现批次查询 API ✅
- **描述**: 创建导入批次查询接口
- **文件**: 
  - `cloud-server/internal/module/admin/interface/handler/import_handler.go`
- **验收**: ✅ 
  - 查询批次列表
  - 查询批次详情

### 任务 9: 编写单元测试
- **描述**: 为核心服务编写单元测试
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/import_service_test.go`
  - `cloud-server/internal/module/admin/infrastructure/parser/excel_parser_test.go`
- **验收**: 
  - 测试覆盖率 > 80%
  - 边界场景已覆盖
- **状态**: 待后续补充

### 任务 10: 集成测试
- **描述**: 测试完整的导入预览流程
- **验收**: 
  - 文件上传成功
  - 预览数据正确
  - 冲突检测准确
- **状态**: 待后续补充

## 执行顺序

```
1. 创建导入批次数据表 ✅
      ↓
2. 定义导入数据结构 ✅
      ↓
3. 实现 Excel 解析器 ✅
      ↓
4. 实现冲突检测服务 ✅
      ↓
5. 实现导入预览服务 ✅
      ↓
6. 创建导入模板下载 API ✅
      ↓
7. 创建导入预览 API ✅
      ↓
8. 实现批次查询 API ✅
      ↓
9. 编写单元测试 (待后续)
      ↓
10. 集成测试 (待后续)
```

## 实现说明

本次实现完成了后端核心功能：

1. **数据库迁移**: 创建了 `user_import_batches` 和 `user_import_rows` 表
2. **实体定义**: 定义了 `ImportBatch`、`ImportRow`、`ImportRowData`、`ConflictResult` 等实体
3. **DTO 定义**: 定义了预览、确认、批次列表等 API 数据传输对象
4. **Excel 解析器**: 使用 excelize 库实现 Excel 文件解析，支持中英文字段映射
5. **冲突检测**: 实现了用户名重复、工号重复、部门不存在、岗位不存在、上级不存在等检测
6. **导入服务**: 实现了预览导入、获取模板等核心逻辑
7. **HTTP 处理器**: 实现了模板下载、上传预览、确认导入、批次查询等 API

## 交付物

1. ✅ 导入批次数据表
2. ✅ Excel 解析器
3. ✅ 冲突检测服务
4. ✅ 导入预览 API
5. ✅ 导入模板下载 API
6. ⏳ 单元测试文件（待后续补充）
