# Tasks: Structured Audit Log Model

## 任务列表

### 任务 1: 设计 audit_logs 数据表
- **描述**: 创建审计日志表的数据库迁移
- **文件**: 
  - `cloud-server/migrations/YYYYMMDD_create_audit_logs.sql`
- **验收**: 数据表创建成功，包含必要的字段和索引

### 任务 2: 定义审计日志实体
- **描述**: 定义 AuditLog 实体和相关枚举类型
- **文件**: 
  - `cloud-server/internal/module/audit/domain/entity/audit_log.go`
- **验收**: 
  - 包含所有必要字段
  - 定义事件类型枚举
  - 定义结果类型枚举

### 任务 3: 定义审计仓储接口
- **描述**: 定义审计日志的仓储接口
- **文件**: 
  - `cloud-server/internal/module/audit/domain/repository/audit_log_repository.go`
- **验收**: 
  - 接口方法完整
  - 支持批量写入

### 任务 4: 实现审计仓储
- **描述**: 实现审计日志的数据库操作
- **文件**: 
  - `cloud-server/internal/module/audit/infrastructure/persistence/audit_log_repo.go`
- **验收**: 
  - 实现所有仓储方法
  - 支持批量写入优化

### 任务 5: 实现审计服务
- **描述**: 实现审计业务逻辑层
- **文件**: 
  - `cloud-server/internal/module/audit/application/service/audit_service.go`
- **验收**: 
  - 日志记录功能
  - 查询功能

### 任务 6: 实现审计写入器
- **描述**: 实现异步批量写入的审计写入器
- **文件**: 
  - `cloud-server/internal/module/audit/application/service/audit_logger.go`
- **验收**: 
  - 支持异步写入
  - 支持批量刷新
  - 队列满时降级

### 任务 7: 实现审计日志构建器
- **描述**: 实现链式构建审计日志的构建器
- **文件**: 
  - `cloud-server/internal/module/audit/application/service/audit_log_builder.go`
- **验收**: 
  - 支持链式调用
  - 包含所有必要字段设置

### 任务 8: 实现审计中间件
- **描述**: 实现自动记录 HTTP 请求的审计中间件
- **文件**: 
  - `cloud-server/internal/module/audit/interface/middleware/audit_middleware.go`
- **验收**: 
  - 自动生成 TraceID
  - 记录写操作请求

### 任务 9: 编写单元测试
- **描述**: 为核心服务编写单元测试
- **文件**: 
  - `cloud-server/internal/module/audit/application/service/audit_service_test.go`
- **验收**: 
  - 测试覆盖率 > 80%

### 任务 10: 集成测试
- **描述**: 测试审计日志完整流程
- **验收**: 
  - 日志正确写入
  - 查询结果正确

## 执行顺序

```
1. 设计 audit_logs 数据表
      ↓
2. 定义审计日志实体
      ↓
3. 定义审计仓储接口
      ↓
4. 实现审计仓储
      ↓
5. 实现审计服务
      ↓
6. 实现审计写入器
      ↓
7. 实现审计日志构建器
      ↓
8. 实现审计中间件
      ↓
9. 编写单元测试
      ↓
10. 集成测试
```

## 测试要点

- [ ] 单元测试：实体、仓储、服务
- [ ] 集成测试：完整流程
- [ ] 性能测试：批量写入性能
- [ ] 压力测试：队列满时降级

## 交付物

1. audit_logs 数据表
2. 审计日志实体定义
3. 审计仓储实现
4. 审计服务
5. 审计写入器
6. 审计日志构建器
7. 审计中间件
8. 单元测试文件