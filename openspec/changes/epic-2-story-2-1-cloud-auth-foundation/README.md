# Epic 2, Story 2.1: Cloud Auth Module Foundation

## 概述

构建 Go 云端认证模块基础架构，为登录、登出、Token 刷新和会话验证提供底层支撑。这是 Epic 2 认证与会话底座的第一步，为后续登录 API 和前端登录流程奠定基础。

## 铁律映射

### PRD 需求
- **FRs**: FR27 - 用户可以使用账号密码登录系统
- **NFRs**: 
  - NFR9 - 数据传输加密，所有网络传输使用 TLS 1.3
  - NFR11 - 密码安全，密码 bcrypt 加密存储，强度因子≥12
  - NFR12 - 会话管理，会话超时 30 分钟，支持强制登出

### 架构需求
- **ADR-005**: 多租户采用数据库级隔离
- **ADR-001**: 分层微内核架构，认证逻辑在云端层

### UX 需求
- 本子任务为后端基础设施，无直接 UX 需求

## 验收标准

- [ ] 创建 auth service、handler 和 repository 骨架结构
- [ ] 定义 login request 和 response DTO
- [ ] 定义 token、session 和 password policy 接口
- [ ] 连接日志和标准错误处理

## 技术方案

### 目录结构

```
cloud-server/
├── internal/
│   ├── module/auth/
│   │   ├── domain/
│   │   │   ├── entity/         # 实体定义
│   │   │   │   ├── user.go
│   │   │   │   ├── session.go
│   │   │   │   └── token.go
│   │   │   └── valueobject/    # 值对象
│   │   │       ├── password.go
│   │   │       └── permission_summary.go
│   │   ├── application/
│   │   │   ├── service/        # 应用服务
│   │   │   │   └── auth_service.go
│   │   │   └── dto/            # 数据传输对象
│   │   │       ├── login_request.go
│   │   │       ├── login_response.go
│   │   │       └── refresh_request.go
│   │   ├── infrastructure/
│   │   │   ├── repository/     # 数据仓储
│   │   │   │   ├── user_repository.go
│   │   │   │   └── session_repository.go
│   │   │   └── crypto/         # 加密工具
│   │   │       ├── bcrypt_hasher.go
│   │   │       └── jwt_manager.go
│   │   └── interface/
│   │       └── handler/        # HTTP 处理器
│   │           └── auth_handler.go
```

### 核心接口定义

```go
// 密码策略接口
type PasswordPolicy interface {
    Hash(password string) (string, error)
    Verify(hashedPassword, password string) bool
    ValidateStrength(password string) error
}

// Token 管理接口
type TokenManager interface {
    GenerateAccessToken(userID, tenantID string) (string, error)
    GenerateRefreshToken(userID, tenantID string) (string, error)
    ValidateToken(token string) (*TokenClaims, error)
    RefreshToken(refreshToken string) (*TokenPair, error)
}

// 会话接口
type SessionManager interface {
    Create(userID, tenantID string) (*Session, error)
    Get(sessionID string) (*Session, error)
    UpdateLastActive(sessionID string) error
    Revoke(sessionID string, reason string) error
}
```

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- Epic 2 增强: `_bmad-output/epic2-architecture-enhancement/epic2-architecture-enhancement.md`