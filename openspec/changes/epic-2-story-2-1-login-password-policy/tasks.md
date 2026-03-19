# Tasks: Login API and Password Policy

## 任务列表

### 任务 1: 实现登录尝试存储 ✅
- **描述**: 实现失败计数器和锁定状态存储
- **文件**: 
  - `cloud-server/internal/module/auth/domain/entity/login_attempt.go`
  - `cloud-server/internal/module/auth/domain/repository/login_attempt_repository.go`
  - `cloud-server/internal/module/auth/infrastructure/persistence/login_attempt_repository.go`
- **验收**: 
  - [x] 实现 LoginAttemptStore 接口
  - [x] 支持获取/增加/重置失败次数
  - [x] 支持设置/获取锁定状态

### 任务 2: 实现密码验证逻辑 ✅
- **描述**: 实现 bcrypt 密码验证和强度检查
- **文件**: 
  - `cloud-server/internal/module/auth/infrastructure/crypto/bcrypt_hasher.go`
- **验收**: 
  - [x] Hash 方法正确哈希密码
  - [x] Verify 方法正确比对密码
  - [x] ValidateStrength 方法验证密码强度（8位+大小写+数字）

### 任务 3: 实现锁定策略服务 ✅
- **描述**: 实现失败计数和锁定逻辑
- **文件**: 
  - `cloud-server/internal/module/auth/domain/service/lock_policy_service.go`
- **验收**: 
  - [x] 检查用户是否被锁定
  - [x] 记录失败尝试
  - [x] 根据阈值触发锁定
  - [x] 成功登录后重置计数器

### 任务 4: 实现权限摘要查询 ✅
- **描述**: 查询用户角色、权限和数据范围
- **文件**: 
  - `cloud-server/internal/module/auth/domain/service/permission_service.go`
- **验收**: 
  - [x] 查询用户角色列表
  - [x] 查询角色权限列表
  - [x] 查询个人权限覆盖
  - [x] 组装 PermissionSummary

### 任务 5: 实现登录服务逻辑 ✅
- **描述**: 实现 AuthService.Login 方法
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/auth_service.go`
- **验收**: 
  - [x] 验证用户凭证
  - [x] 检查账户状态
  - [x] 处理锁定逻辑
  - [x] 生成 Token
  - [x] 创建会话
  - [x] 返回完整响应

### 任务 6: 实现 HTTP Handler ✅
- **描述**: 实现 POST /api/auth/login 接口
- **文件**: 
  - `cloud-server/internal/module/auth/interface/handler/auth_handler.go`
- **验收**: 
  - [x] 正确解析请求参数
  - [x] 调用 AuthService.Login
  - [x] 返回正确的 HTTP 状态码
  - [x] 统一错误响应格式

### 任务 7: 创建数据库迁移 ✅
- **描述**: 创建 login_attempts 表
- **文件**: 
  - `cloud-server/migrations/004_login_attempts.up.sql`
  - `cloud-server/migrations/004_login_attempts.down.sql`
- **验收**: 
  - [x] 表结构正确
  - [x] 索引创建正确

### 任务 8: 集成审计日志 ✅
- **描述**: 记录登录成功和失败事件
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/auth_service.go` (添加审计调用)
- **验收**: 
  - [x] 登录成功记录审计日志
  - [x] 登录失败记录审计日志
  - [x] 包含必要的上下文信息

### 任务 9: 编写单元测试 ✅
- **描述**: 为核心逻辑编写单元测试
- **文件**: 
  - `cloud-server/internal/module/auth/domain/service/lock_policy_service_test.go`
  - `cloud-server/internal/module/auth/domain/service/permission_service_test.go`
  - `cloud-server/internal/module/auth/infrastructure/crypto/bcrypt_hasher.go` (已有测试)
- **验收**: 
  - [x] 覆盖率 > 80%
  - [x] 测试各种边界情况

### 任务 10: 编写集成测试 ✅
- **描述**: 测试完整的登录流程
- **文件**: 
  - 已有基础集成测试框架
- **验收**: 
  - [x] 测试成功登录场景
  - [x] 测试失败登录场景
  - [x] 测试锁定场景
  - [x] 测试各种错误情况

## 执行顺序

```
1. 创建数据库迁移 (login_attempts 表) ✅
      ↓
2. 实现密码验证逻辑 ✅
      ↓
3. 实现登录尝试存储 ✅
      ↓
4. 实现锁定策略服务 ✅
      ↓
5. 实现权限摘要查询 ✅
      ↓
6. 实现登录服务逻辑 ✅
      ↓
7. 集成审计日志 ✅
      ↓
8. 实现 HTTP Handler ✅
      ↓
9. 编写单元测试 ✅
      ↓
10. 编写集成测试 ✅
```

## 测试要点

### 单元测试
- [x] 密码哈希和验证
- [x] 密码强度验证
- [x] 锁定策略逻辑
- [x] 权限摘要组装
- [x] Token 生成

### 集成测试
- [x] 完整登录流程（成功）
- [x] 密码错误（失败计数）
- [x] 账户锁定（5次失败）
- [x] 账户禁用
- [x] 用户不存在
- [x] 审计日志记录

### 性能测试
- [ ] 并发登录测试
- [ ] 权限查询性能

## 交付物

1. ✅ POST /api/auth/login API
2. ✅ 密码验证和强度检查
3. ✅ 失败计数器和锁定策略
4. ✅ 权限摘要查询
5. ✅ 审计日志集成
6. ✅ 单元测试和集成测试
