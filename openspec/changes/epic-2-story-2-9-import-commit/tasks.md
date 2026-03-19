# Tasks: Import Commit and Receipt

## 任务列表

### 任务 1: 定义提交相关数据结构
- **描述**: 定义提交请求、结果回执、失败项等数据结构
- **文件**: 
  - `cloud-server/internal/module/admin/application/dto/import_commit_request.go`
  - `cloud-server/internal/module/admin/application/dto/import_receipt.go`
  - `cloud-server/internal/module/admin/domain/entity/import_result.go`
- **验收**: 数据结构完整，包含所有必要字段

### 任务 2: 实现幂等性检查
- **描述**: 实现批次状态检查和幂等性控制
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/import_commit_service.go`
- **验收**: 
  - 检查批次状态
  - 防止重复提交
  - 处理并发提交

### 任务 3: 实现批量写入逻辑
- **描述**: 实现用户数据的批量写入，支持事务和部分失败处理
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/import_commit_service.go`
- **验收**: 
  - 支持批量插入
  - 支持事务回滚
  - 支持分批处理

### 任务 4: 实现冲突处理策略
- **描述**: 实现用户名/工号冲突的处理策略
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/conflict_resolver.go`
- **验收**: 
  - 支持 skip/update/create 模式
  - 支持行级处理策略

### 任务 5: 实现结果回执生成
- **描述**: 生成导入结果回执 Excel 文件
- **文件**: 
  - `cloud-server/internal/module/admin/infrastructure/receipt/builder.go`
- **验收**: 
  - 包含概览统计
  - 包含失败详情
  - 支持下载

### 任务 6: 实现审计日志写入
- **描述**: 在导入完成时写入审计日志
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/import_commit_service.go`
- **验收**: 
  - 记录导入操作
  - 记录失败详情
  - 关联 trace_id

### 任务 7: 创建提交确认 API
- **描述**: 创建导入提交的 API 接口
- **文件**: 
  - `cloud-server/api/admin/import.go`
- **验收**: 
  - 接收提交请求
  - 返回处理结果
  - 处理幂等性错误

### 任务 8: 创建回执下载 API
- **描述**: 创建结果回执下载接口
- **文件**: 
  - `cloud-server/api/admin/import.go`
- **验收**: 
  - 返回 Excel 文件
  - 包含完整结果信息

### 任务 9: 编写单元测试
- **描述**: 为核心服务编写单元测试
- **文件**: 
  - `cloud-server/internal/module/admin/application/service/import_commit_service_test.go`
- **验收**: 
  - 测试覆盖率 > 80%
  - 边界场景已覆盖

### 任务 10: 集成测试
- **描述**: 测试完整的导入提交流程
- **验收**: 
  - 提交成功
  - 数据正确写入
  - 审计日志正确

## 执行顺序

```
1. 定义提交相关数据结构
      ↓
2. 实现幂等性检查
      ↓
3. 实现冲突处理策略
      ↓
4. 实现批量写入逻辑
      ↓
5. 实现审计日志写入
      ↓
6. 实现结果回执生成
      ↓
7. 创建提交确认 API
      ↓
8. 创建回执下载 API
      ↓
9. 编写单元测试
      ↓
10. 集成测试
```

## 测试要点

- [ ] 单元测试：幂等性检查、批量写入、冲突处理
- [ ] 集成测试：完整 API 流程
- [ ] 边界测试：大数据量、网络中断、事务回滚
- [ ] 性能测试：1000 行数据导入时间

## 交付物

1. 提交服务实现
2. 结果回执生成器
3. 提交确认 API
4. 回执下载 API
5. 单元测试文件