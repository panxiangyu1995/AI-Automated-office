# Tasks: Cloud Auth Module Foundation

## 任务列表

### 任务 1: 创建模块目录结构
- **描述**: 按照 DDD 分层架构创建认证模块的目录结构
- **文件**: 
  - `cloud-server/internal/module/auth/`
  - `cloud-server/internal/module/auth/domain/`
  - `cloud-server/internal/module/auth/application/`
  - `cloud-server/internal/module/auth/infrastructure/`
  - `cloud-server/internal/module/auth/interface/`
- **验收**: 目录结构符合 DDD 分层规范

### 任务 2: 定义领域实体
- **描述**: 定义 User、Session、Token 等核心领域实体
- **文件**: 
  - `cloud-server/internal/module/auth/domain/entity/user.go`
  - `cloud-server/internal/module/auth/domain/entity/session.go`
  - `cloud-server/internal/module/auth/domain/entity/token.go`
- **验收**: 
  - 实体包含必要的字段和方法
  - 符合 GORM 模型规范

### 任务 3: 定义值对象
- **描述**: 定义 Password、PermissionSummary 等值对象
- **文件**: 
  - `cloud-server/internal/module/auth/domain/valueobject/password.go`
  - `cloud-server/internal/module/auth/domain/valueobject/permission_summary.go`
- **验收**: 值对象包含验证逻辑

### 任务 4: 定义仓储接口
- **描述**: 定义 UserRepository 和 SessionRepository 接口
- **文件**: 
  - `cloud-server/internal/module/auth/domain/repository/user_repository.go`
  - `cloud-server/internal/module/auth/domain/repository/session_repository.go`
- **验收**: 接口方法完整，符合仓储模式

### 任务 5: 定义 DTO
- **描述**: 定义登录请求、响应、Token 刷新等 DTO
- **文件**: 
  - `cloud-server/internal/module/auth/application/dto/login_request.go`
  - `cloud-server/internal/module/auth/application/dto/login_response.go`
  - `cloud-server/internal/module/auth/application/dto/refresh_request.go`
  - `cloud-server/internal/module/auth/application/dto/refresh_response.go`
- **验收**: DTO 包含完整的 JSON 标签和验证规则

### 任务 6: 定义核心接口
- **描述**: 定义 PasswordPolicy、TokenManager、SessionManager 接口
- **文件**: 
  - `cloud-server/internal/module/auth/infrastructure/crypto/bcrypt_hasher.go`
  - `cloud-server/internal/module/auth/infrastructure/crypto/jwt_manager.go`
- **验收**: 接口方法签名正确

### 任务 7: 创建 Service 骨架
- **描述**: 创建 AuthService 应用服务骨架
- **文件**: 
  - `cloud-server/internal/module/auth/application/service/auth_service.go`
- **验收**: 服务包含 Login、Logout、Refresh 等方法骨架

### 任务 8: 创建 Handler 骨架
- **描述**: 创建 AuthHandler HTTP 处理器骨架
- **文件**: 
  - `cloud-server/internal/module/auth/interface/handler/auth_handler.go`
- **验收**: Handler 包含路由注册方法

### 任务 9: 创建 Repository 实现
- **描述**: 创建 UserRepository 和 SessionRepository 的数据库实现
- **文件**: 
  - `cloud-server/internal/module/auth/infrastructure/persistence/user_repo_impl.go`
  - `cloud-server/internal/module/auth/infrastructure/persistence/session_repo_impl.go`
- **验收**: 实现仓储接口的所有方法

### 任务 10: 连接日志和错误处理
- **描述**: 集成 zap 日志和自定义错误类型
- **文件**: 
  - `cloud-server/internal/module/auth/infrastructure/logging/auth_logger.go`
  - `cloud-server/internal/pkg/errors/auth_errors.go`
- **验收**: 日志和错误格式符合项目规范

## 执行顺序

```
1. 创建目录结构
      ↓
2. 定义领域实体
      ↓
3. 定义值对象
      ↓
4. 定义仓储接口
      ↓
5. 定义 DTO
      ↓
6. 定义核心接口
      ↓
7. 创建 Repository 实现
      ↓
8. 创建 Service 骨架
      ↓
9. 创建 Handler 骨架
      ↓
10. 连接日志和错误处理
```

## 测试要点

- [x] 单元测试：每个接口和实体有对应的单元测试
- [x] 集成测试：验证仓储实现的数据库操作
- [x] 接口测试：验证 DTO 的验证规则

## 交付物

1. 完整的认证模块目录结构
2. 领域实体和值对象定义
3. 核心接口定义
4. DTO 定义
5. Service、Handler、Repository 骨架
6. 日志和错误处理集成
