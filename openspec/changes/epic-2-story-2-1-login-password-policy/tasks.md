# Tasks: Login API and Password Policy

## 任务列表

### 任务 1: 实现登录尝试存储
- **描述**: 实现失败计数器和锁定状态存储
- **文件**: 
  - `cloud-server/internal/module/auth/infrastructure/store/login_attempt_store.go`
  - `cloud-server/internal/module/auth/infrastructure/store/redis_login_attempt_store.go` (Redis 实现)
  - `cloud-server/internal/module/auth/infrastructure/store/db_login_attempt_store.go` (数据库实现)
- **验收**: 
  - 实现 LoginAttemptStore 接口
  - 支持获取/增加/重置失败次数
  - 支持设置/获取锁定状态

### 任务 2: 实现密码验证逻辑
- **描述**: 实现 bcrypt 密码验证和强度检查
- **文件**: 
  - `cloud-server/internal/module/auth/infrastructure/crypto/bcrypt_hasher.go`
- **验收**: 
  - Hash 方法正确哈希密码
  - Verify 方法正确比对密码
  - ValidateStrength 方法验证密码强度（8位+大小写+数字）

### 任务 3: 实现锁定策略服务
- **描述**: 实现失败计数和锁定逻辑
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/lock_policy_service.go`
- **验收**: 
  - 检查用户是否被锁定
  - 记录失败尝试
  - 根据阈值触发锁定
  - 成功登录后重置计数器

### 任务 4: 实现权限摘要查询
- **描述**: 查询用户角色、权限和数据范围
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/permission_service.go`
- **验收**: 
  - 查询用户角色列表
  - 查询角色权限列表
  - 查询个人权限覆盖
  - 组装 PermissionSummary

### 任务 5: 实现登录服务逻辑
- **描述**: 实现 AuthService.Login 方法
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/auth_service.go`
- **验收**: 
  - 验证用户凭证
  - 检查账户状态
  - 处理锁定逻辑
  - 生成 Token
  - 创建会话
  - 返回完整响应

### 任务 6: 实现 HTTP Handler
- **描述**: 实现 POST /api/auth/login 接口
- **文件**: 
  - `cloud-server/internal/module/auth/interface/handler/auth_handler.go`
- **验收**: 
  - 正确解析请求参数
  - 调用 AuthService.Login
  - 返回正确的 HTTP 状态码
  - 统一错误响应格式

### 任务 7: 创建数据库迁移
- **描述**: 创建 login_attempts 表
- **文件**: 
  - `cloud-server/migrations/YYYYMMDD_create_login_attempts.sql`
- **验收**: 
  - 表结构正确
  - 索引创建正确

### 任务 8: 集成审计日志
- **描述**: 记录登录成功和失败事件
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/auth_service.go` (添加审计调用)
- **验收**: 
  - 登录成功记录审计日志
  - 登录失败记录审计日志
  - 包含必要的上下文信息

### 任务 9: 编写单元测试
- **描述**: 为核心逻辑编写单元测试
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/auth_service_test.go`
  - `cloud-server/internal/module/auth/infrastructure/crypto/bcrypt_hasher_test.go`
  - `cloud-server/internal/module/auth/application/service/lock_policy_service_test.go`
- **验收**: 
  - 覆盖率 > 80%
  - 测试各种边界情况

### 任务 10: 编写集成测试
- **描述**: 测试完整的登录流程
- **文件**: 
  - `cloud-server/tests/integration/auth_login_test.go`
- **验收**: 
  - 测试成功登录场景
  - 测试失败登录场景
  - 测试锁定场景
  - 测试各种错误情况

## 执行顺序

```
1. 创建数据库迁移 (login_attempts 表)
      ↓
2. 实现密码验证逻辑
      ↓
3. 实现登录尝试存储
      ↓
4. 实现锁定策略服务
      ↓
5. 实现权限摘要查询
      ↓
6. 实现登录服务逻辑
      ↓
7. 集成审计日志
      ↓
8. 实现 HTTP Handler
      ↓
9. 编写单元测试
      ↓
10. 编写集成测试
```

## 测试要点

### 单元测试
- [ ] 密码哈希和验证
- [ ] 密码强度验证
- [ ] 锁定策略逻辑
- [ ] 权限摘要组装
- [ ] Token 生成

### 集成测试
- [ ] 完整登录流程（成功）
- [ ] 密码错误（失败计数）
- [ ] 账户锁定（5次失败）
- [ ] 账户禁用
- [ ] 用户不存在
- [ ] 审计日志记录

### 性能测试
- [ ] 并发登录测试
- [ ] 权限查询性能

## 交付物

1. POST /api/auth/login API
2. 密码验证和强度检查
3. 失败计数器和锁定策略
4. 权限摘要查询
5. 审计日志集成
6. 单元测试和集成测试