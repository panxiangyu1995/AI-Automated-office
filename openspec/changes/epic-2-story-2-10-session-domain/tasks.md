# Tasks: Session Model and Timeout Engine

## 任务列表

### 任务 1: 设计 sessions 数据表
- **描述**: 创建 sessions 表的数据库迁移
- **文件**: 
  - `cloud-server/migrations/YYYYMMDD_create_sessions.sql`
- **验收**: 数据表创建成功，包含必要的字段和索引

### 任务 2: 定义会话实体
- **描述**: 定义 Session 实体和相关值对象
- **文件**: 
  - `cloud-server/internal/module/auth/domain/entity/session.go`
- **验收**: 
  - 包含所有必要字段
  - 包含状态判断方法

### 任务 3: 实现会话仓储
- **描述**: 实现会话的 CRUD 操作
- **文件**: 
  - `cloud-server/internal/module/auth/domain/repository/session_repository.go`（接口）
  - `cloud-server/internal/module/auth/infrastructure/persistence/session_repo.go`（实现）
- **验收**: 
  - 接口方法完整
  - 实现所有数据库操作

### 任务 4: 实现会话服务
- **描述**: 实现会话的业务逻辑
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/session_service.go`
- **验收**: 
  - 创建会话
  - 验证会话
  - 更新活跃时间
  - 撤销会话

### 任务 5: 实现空闲超时引擎
- **描述**: 实现定时检查空闲超时的引擎
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/idle_timeout_engine.go`
- **验收**: 
  - 定时检查空闲会话
  - 自动撤销超时会话

### 任务 6: 实现会话清理任务
- **描述**: 实现过期会话的定时清理
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/session_cleanup.go`
- **验收**: 
  - 定时清理过期会话
  - 记录清理日志

### 任务 7: 实现会话中间件
- **描述**: 实现会话验证的 HTTP 中间件
- **文件**: 
  - `cloud-server/internal/module/auth/interface/middleware/session_middleware.go`
- **验收**: 
  - 验证会话有效性
  - 更新活跃时间
  - 返回适当的错误码

### 任务 8: 创建会话查询 API
- **描述**: 创建会话列表查询接口
- **文件**: 
  - `cloud-server/api/auth/session.go`
- **验收**: 
  - 查询用户会话列表
  - 返回会话详情

### 任务 9: 编写单元测试
- **描述**: 为核心服务编写单元测试
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/session_service_test.go`
- **验收**: 
  - 测试覆盖率 > 80%
  - 边界场景已覆盖

### 任务 10: 集成测试
- **描述**: 测试会话生命周期
- **验收**: 
  - 会话创建正常
  - 空闲超时生效
  - 撤销功能正常

## 执行顺序

```
1. 设计 sessions 数据表
      ↓
2. 定义会话实体
      ↓
3. 实现会话仓储
      ↓
4. 实现会话服务
      ↓
5. 实现空闲超时引擎
      ↓
6. 实现会话清理任务
      ↓
7. 实现会话中间件
      ↓
8. 创建会话查询 API
      ↓
9. 编写单元测试
      ↓
10. 集成测试
```

## 测试要点

- [ ] 单元测试：会话实体、服务、仓储
- [ ] 集成测试：会话生命周期
- [ ] 性能测试：大量会话查询
- [ ] 边界测试：空闲超时边界

## 交付物

1. sessions 数据表
2. 会话实体定义
3. 会话仓储实现
4. 会话服务
5. 空闲超时引擎
6. 会话清理任务
7. 会话中间件
8. 会话查询 API
9. 单元测试文件