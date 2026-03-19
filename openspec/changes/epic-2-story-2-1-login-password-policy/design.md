# Design: Login API and Password Policy

## 技术方案

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Handler Layer                        │
│  AuthHandler.Login()                                        │
│  - 解析请求参数                                              │
│  - 调用 Service                                             │
│  - 返回响应                                                  │
├─────────────────────────────────────────────────────────────┤
│                    Application Service Layer                 │
│  AuthService.Login()                                        │
│  ├── 1. 检查锁定状态                                         │
│  ├── 2. 验证用户名密码                                       │
│  ├── 3. 检查用户状态                                         │
│  ├── 4. 生成 Token                                          │
│  ├── 5. 创建会话                                            │
│  ├── 6. 查询权限摘要                                         │
│  ├── 7. 记录审计日志                                         │
│  └── 8. 返回响应                                            │
├─────────────────────────────────────────────────────────────┤
│                    Domain & Infrastructure Layer             │
│  ├── UserRepository (查询用户)                              │
│  ├── SessionRepository (创建会话)                           │
│  ├── LoginAttemptStore (失败计数器)                         │
│  ├── TokenManager (生成Token)                               │
│  ├── PermissionRepository (查询权限)                        │
│  └── AuditLogger (审计日志)                                 │
└─────────────────────────────────────────────────────────────┘
```

### API 详细设计

#### POST /api/auth/login

**请求参数：**

```go
type LoginRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Password string `json:"password" binding:"required,min=8,max=100"`
    TenantID string `json:"tenant_id" binding:"omitempty,uuid"`
}
```

**响应结构：**

```go
type LoginResponse struct {
    AccessToken  string             `json:"access_token"`
    RefreshToken string             `json:"refresh_token"`
    ExpiresIn    int64              `json:"expires_in"` // 3600 秒
    User         *UserProfile       `json:"user"`
    Tenant       *TenantInfo        `json:"tenant"`
    Permissions  *PermissionSummary `json:"permissions"`
}

type UserProfile struct {
    ID           string `json:"id"`
    Username     string `json:"username"`
    Email        string `json:"email"`
    RealName     string `json:"real_name"`
    DepartmentID string `json:"department_id"`
    PositionID   string `json:"position_id"`
    Status       string `json:"status"`
}

type PermissionSummary struct {
    Roles       []string          `json:"roles"`
    Permissions []string          `json:"permissions"`
    DataScopes  map[string]string `json:"data_scopes"` // resource -> scope
}
```

**错误响应：**

```go
type ErrorResponse struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    TraceID string `json:"trace_id"`
}

// 错误码定义
const (
    ErrInvalidCredentials = "AUTH_001" // 用户名或密码错误
    ErrAccountLocked      = "AUTH_002" // 账户已被锁定
    ErrAccountDisabled    = "AUTH_003" // 账户已禁用
    ErrTenantNotFound     = "AUTH_004" // 租户不存在
)
```

### 密码验证流程

```
┌─────────────────────────────────────────────────────────────┐
│                    密码验证流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 获取用户（包含 hashed_password）                        │
│     ↓                                                       │
│  2. 检查账户状态（active/disabled/locked）                  │
│     ↓                                                       │
│  3. 检查锁定状态（是否在锁定期内）                           │
│     ↓                                                       │
│  4. bcrypt 比对密码                                         │
│     ↓                                                       │
│  5. 成功：重置失败计数器                                    │
│     失败：增加失败计数器，检查是否需要锁定                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 失败锁定策略实现

```go
// LoginAttemptStore 登录尝试存储接口
type LoginAttemptStore interface {
    // GetAttempts 获取失败次数
    GetAttempts(ctx context.Context, userID string) (int, error)
    
    // IncrementAttempt 增加失败次数
    IncrementAttempt(ctx context.Context, userID string) error
    
    // ResetAttempts 重置失败次数
    ResetAttempts(ctx context.Context, userID string) error
    
    // GetLockUntil 获取锁定到期时间
    GetLockUntil(ctx context.Context, userID string) (*time.Time, error)
    
    // SetLock 设置锁定
    SetLock(ctx context.Context, userID string, duration time.Duration) error
}

// 锁定规则
const (
    MaxAttempts1     = 5                 // 第一次锁定阈值
    LockDuration1    = 15 * time.Minute  // 第一次锁定时长
    MaxAttempts2     = 10                // 第二次锁定阈值
    LockDuration2    = 1 * time.Hour     // 第二次锁定时长
)
```

### Token 生成

```go
// TokenPair Token 对
type TokenPair struct {
    AccessToken  string
    RefreshToken string
    ExpiresIn    int64
}

// 生成流程
func (s *AuthService) generateTokenPair(user *User, permissions []string) (*TokenPair, error) {
    // 1. 生成 Access Token (有效期 1 小时)
    accessToken, err := s.tokenManager.GenerateAccessToken(
        user.ID,
        user.TenantID,
        permissions,
    )
    
    // 2. 生成 Refresh Token (有效期 7 天)
    refreshToken, err := s.tokenManager.GenerateRefreshToken(
        user.ID,
        user.TenantID,
    )
    
    // 3. 返回 Token 对
    return &TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresIn:    3600,
    }, nil
}
```

### 权限摘要查询

```go
// GetPermissionSummary 获取权限摘要
func (s *AuthService) GetPermissionSummary(ctx context.Context, userID string) (*PermissionSummary, error) {
    // 1. 查询用户角色
    roles, err := s.roleRepo.GetByUserID(ctx, userID)
    
    // 2. 查询角色权限
    var permissions []string
    for _, role := range roles {
        perms, _ := s.permRepo.GetByRoleID(ctx, role.ID)
        permissions = append(permissions, perms...)
    }
    
    // 3. 查询个人权限覆盖
    overrides, _ := s.overrideRepo.GetByUserID(ctx, userID)
    permissions = append(permissions, overrides...)
    
    // 4. 查询数据范围
    dataScopes, _ := s.dataScopeRepo.GetByUserID(ctx, userID)
    
    return &PermissionSummary{
        Roles:       roleNames,
        Permissions: unique(permissions),
        DataScopes:  dataScopes,
    }, nil
}
```

## 数据库设计

### users 表（已存在）

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    real_name VARCHAR(100),
    department_id UUID,
    position_id UUID,
    status VARCHAR(20) DEFAULT 'active', -- active, disabled, locked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, username)
);
```

### login_attempts 表（新增）

```sql
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    attempt_count INT DEFAULT 0,
    locked_until TIMESTAMP,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX idx_login_attempts_locked_until ON login_attempts(locked_until);
```

## 安全考虑

1. **密码安全**
   - bcrypt 加密存储，cost=12
   - 密码传输使用 HTTPS
   - 错误信息不透露用户是否存在

2. **防暴力破解**
   - 失败计数器
   - 递增锁定时长
   - 可配置验证码触发

3. **Token 安全**
   - Access Token 有效期 1 小时
   - Refresh Token 有效期 7 天
   - JWT 签名使用强密钥

4. **审计追踪**
   - 记录所有登录尝试
   - IP 地址哈希存储
   - Trace ID 关联请求

## 性能考虑

1. **失败计数器**
   - 优先使用 Redis 存储
   - 回退到数据库存储

2. **权限查询**
   - 批量查询角色权限
   - 考虑缓存权限摘要

3. **数据库连接**
   - 使用连接池
   - 合理设置超时

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Auth API    │────→│  User Module  │     │ Audit Module  │
│   (本模块)    │     │  (用户数据)   │←────│  (审计日志)   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     
        │                     │                     
        ▼                     ▼                     
┌───────────────┐     ┌───────────────┐             
│ Permission    │     │ Session       │             
│ Module        │     │ Module        │             
│ (权限数据)    │     │ (会话管理)    │             
└───────────────┘     └───────────────┘             
```