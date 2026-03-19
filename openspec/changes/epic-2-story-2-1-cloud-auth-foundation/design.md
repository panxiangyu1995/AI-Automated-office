# Design: Cloud Auth Module Foundation

## 技术方案

### 整体架构

采用 DDD（领域驱动设计）分层架构：

```
┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                           │
│  HTTP Handlers (Gin)                                        │
│  - AuthHandler                                              │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│  Application Services                                       │
│  - AuthService                                              │
│  - DTOs (LoginRequest, LoginResponse, etc.)                │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer                              │
│  Entities & Value Objects                                   │
│  - User Entity                                              │
│  - Session Entity                                           │
│  - Token Value Object                                       │
│  - Password Value Object                                    │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│  Repositories & External Services                           │
│  - UserRepository                                           │
│  - SessionRepository                                        │
│  - BcryptHasher                                             │
│  - JWTManager                                               │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
cloud-server/internal/module/auth/
├── domain/
│   ├── entity/
│   │   ├── user.go              # 用户聚合根
│   │   ├── session.go           # 会话实体
│   │   └── token.go             # Token 实体
│   ├── valueobject/
│   │   ├── password.go          # 密码值对象
│   │   └── permission_summary.go # 权限摘要值对象
│   └── repository/
│       ├── user_repository.go   # 用户仓储接口
│       └── session_repository.go # 会话仓储接口
├── application/
│   ├── service/
│   │   └── auth_service.go      # 认证应用服务
│   └── dto/
│       ├── login_request.go     # 登录请求 DTO
│       ├── login_response.go    # 登录响应 DTO
│       ├── refresh_request.go   # Token 刷新请求 DTO
│       └── refresh_response.go  # Token 刷新响应 DTO
├── infrastructure/
│   ├── persistence/
│   │   ├── user_repo_impl.go    # 用户仓储实现
│   │   └── session_repo_impl.go # 会话仓储实现
│   └── crypto/
│       ├── bcrypt_hasher.go     # Bcrypt 密码哈希
│       └── jwt_manager.go       # JWT Token 管理
└── interface/
    └── handler/
        └── auth_handler.go      # HTTP Handler
```

### 核心接口设计

#### 密码策略接口

```go
package crypto

// PasswordPolicy 密码策略接口
type PasswordPolicy interface {
    // Hash 对密码进行哈希
    Hash(password string) (string, error)
    
    // Verify 验证密码
    Verify(hashedPassword, password string) bool
    
    // ValidateStrength 验证密码强度
    // 要求：至少8位，包含大小写字母和数字
    ValidateStrength(password string) error
}

// BcryptHasher Bcrypt 实现
type BcryptHasher struct {
    cost int // 默认 12
}
```

#### Token 管理接口

```go
package crypto

// TokenClaims Token 声明
type TokenClaims struct {
    UserID   string `json:"user_id"`
    TenantID string `json:"tenant_id"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

// TokenPair Token 对
type TokenPair struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int64  `json:"expires_in"` // 秒
}

// TokenManager Token 管理接口
type TokenManager interface {
    // GenerateAccessToken 生成访问令牌
    GenerateAccessToken(userID, tenantID string, permissions []string) (string, error)
    
    // GenerateRefreshToken 生成刷新令牌
    GenerateRefreshToken(userID, tenantID string) (string, error)
    
    // GenerateTokenPair 生成 Token 对
    GenerateTokenPair(userID, tenantID string, permissions []string) (*TokenPair, error)
    
    // ValidateToken 验证 Token
    ValidateToken(token string) (*TokenClaims, error)
    
    // RefreshToken 刷新 Token
    RefreshToken(refreshToken string) (*TokenPair, error)
}
```

#### 会话管理接口

```go
package domain

// Session 会话实体
type Session struct {
    ID             string     `gorm:"primaryKey"`
    TenantID       string     `gorm:"index"`
    UserID         string     `gorm:"index"`
    AccessTokenJTI string     // Access Token JTI
    RefreshTokenJTI string    // Refresh Token JTI
    IssuedAt       time.Time
    LastActiveAt   time.Time
    ExpiresAt      time.Time
    RevokedAt      *time.Time
    RevokeReason   string
    CreatedAt      time.Time
    UpdatedAt      time.Time
}

// SessionRepository 会话仓储接口
type SessionRepository interface {
    Create(ctx context.Context, session *Session) error
    GetByID(ctx context.Context, id string) (*Session, error)
    GetByUserID(ctx context.Context, userID string) ([]*Session, error)
    UpdateLastActive(ctx context.Context, id string) error
    Revoke(ctx context.Context, id string, reason string) error
    RevokeAllByUserID(ctx context.Context, userID string, reason string) error
}
```

### DTO 定义

#### 登录请求

```go
package dto

// LoginRequest 登录请求
type LoginRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Password string `json:"password" binding:"required,min=8,max=100"`
    TenantID string `json:"tenant_id" binding:"required"` // 可选，多租户场景
}

// LoginResponse 登录响应
type LoginResponse struct {
    AccessToken  string             `json:"access_token"`
    RefreshToken string             `json:"refresh_token"`
    ExpiresIn    int64              `json:"expires_in"`
    User         *UserProfile       `json:"user"`
    Tenant       *TenantInfo        `json:"tenant"`
    Permissions  *PermissionSummary `json:"permissions"`
}

// UserProfile 用户信息
type UserProfile struct {
    ID           string `json:"id"`
    Username     string `json:"username"`
    Email        string `json:"email"`
    RealName     string `json:"real_name"`
    DepartmentID string `json:"department_id"`
    PositionID   string `json:"position_id"`
    Status       string `json:"status"`
}

// TenantInfo 租户信息
type TenantInfo struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}

// PermissionSummary 权限摘要
type PermissionSummary struct {
    Roles       []string          `json:"roles"`
    Permissions []string          `json:"permissions"`
    DataScopes  map[string]string `json:"data_scopes"` // resource -> scope
}
```

### 错误处理设计

```go
package errors

// AuthError 认证错误
type AuthError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    TraceID string `json:"trace_id"`
}

var (
    ErrInvalidCredentials  = &AuthError{Code: "AUTH_001", Message: "用户名或密码错误"}
    ErrAccountLocked       = &AuthError{Code: "AUTH_002", Message: "账户已被锁定，请稍后重试"}
    ErrAccountDisabled     = &AuthError{Code: "AUTH_003", Message: "账户已禁用"}
    ErrTokenExpired        = &AuthError{Code: "AUTH_004", Message: "令牌已过期"}
    ErrTokenInvalid        = &AuthError{Code: "AUTH_005", Message: "令牌无效"}
    ErrSessionExpired      = &AuthError{Code: "AUTH_006", Message: "会话已过期"}
    ErrPermissionDenied    = &AuthError{Code: "AUTH_007", Message: "权限不足"}
)
```

### 日志设计

使用 zap 结构化日志：

```go
package logging

// AuthLogger 认证日志
type AuthLogger struct {
    logger *zap.Logger
}

func (l *AuthLogger) LogLogin(userID, tenantID, result string) {
    l.logger.Info("auth_login",
        zap.String("user_id", userID),
        zap.String("tenant_id", tenantID),
        zap.String("result", result),
        zap.String("event_type", "auth.login"),
    )
}

func (l *AuthLogger) LogLogout(userID, sessionID string) {
    l.logger.Info("auth_logout",
        zap.String("user_id", userID),
        zap.String("session_id", sessionID),
        zap.String("event_type", "auth.logout"),
    )
}
```

## 安全考虑

1. **密码存储**: 使用 bcrypt，cost 因子 ≥12（NFR11）
2. **Token 安全**: JWT 使用 RS256 或 HS256 签名
3. **传输安全**: 所有 API 强制 HTTPS（NFR9）
4. **会话管理**: 30 分钟空闲超时（NFR12）

## 性能考虑

1. **Token 验证**: 无状态 JWT，无需每次查库
2. **会话检查**: 仅在需要时查询数据库
3. **密码哈希**: bcrypt 计算密集型，考虑异步处理

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Auth Module │────→│  User Module  │     │ Audit Module  │
│   (本模块)    │     │  (用户管理)   │←────│  (审计日志)   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     ▲
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                     认证事件触发审计
```