# Design: Session Model and Timeout Engine

## 技术方案

### 会话状态模型

```
┌─────────────────────────────────────────────────────────────┐
│                    Session State Machine                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐                                               │
│  │  active  │ ──空闲超时──► ┌──────────┐                    │
│  │  (活跃)  │               │  expired │                    │
│  └──────────┘               │  (过期)  │                    │
│       │                     └──────────┘                    │
│       │                                                    │
│       │ 撤销                   ┌──────────┐                │
│       └──────────────────────►│  revoked │                │
│                               │  (撤销)  │                │
│                               └──────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数据库设计

```sql
-- 会话表
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    access_token_jti VARCHAR(36) NOT NULL,   -- Access Token JTI
    refresh_token_jti VARCHAR(36),           -- Refresh Token JTI
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSON,                        -- 设备信息
    issued_at TIMESTAMP NOT NULL,
    last_active_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoke_reason VARCHAR(50),               -- logout, force_logout, expired, security
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_user (tenant_id, user_id),
    INDEX idx_access_jti (access_token_jti),
    INDEX idx_expires (expires_at),
    INDEX idx_last_active (last_active_at)
);
```

### 核心接口设计

#### 1. 会话实体

```go
// Session 会话实体
type Session struct {
    ID              string     `gorm:"primaryKey"`
    TenantID        string     `gorm:"index:idx_tenant_user"`
    UserID          string     `gorm:"index:idx_tenant_user"`
    AccessTokenJTI  string     `gorm:"uniqueIndex"`
    RefreshTokenJTI string
    IPAddress       string
    UserAgent       string
    DeviceInfo      *DeviceInfo
    IssuedAt        time.Time
    LastActiveAt    time.Time
    ExpiresAt       time.Time
    RevokedAt       *time.Time
    RevokeReason    string
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

// DeviceInfo 设备信息
type DeviceInfo struct {
    DeviceType string `json:"device_type"` // desktop, mobile, tablet
    OS         string `json:"os"`
    Browser    string `json:"browser"`
}

// IsExpired 是否过期
func (s *Session) IsExpired() bool {
    return time.Now().After(s.ExpiresAt)
}

// IsIdleExpired 是否空闲超时
func (s *Session) IsIdleExpired(idleTimeout time.Duration) bool {
    return time.Since(s.LastActiveAt) > idleTimeout
}

// IsRevoked 是否已撤销
func (s *Session) IsRevoked() bool {
    return s.RevokedAt != nil
}

// IsValid 是否有效
func (s *Session) IsValid() bool {
    return !s.IsExpired() && !s.IsIdleExpired(30*time.Minute) && !s.IsRevoked()
}
```

#### 2. 会话仓储接口

```go
// SessionRepository 会话仓储接口
type SessionRepository interface {
    // Create 创建会话
    Create(ctx context.Context, session *Session) error
    
    // GetByID 根据 ID 获取会话
    GetByID(ctx context.Context, id string) (*Session, error)
    
    // GetByAccessTokenJTI 根据 Access Token JTI 获取会话
    GetByAccessTokenJTI(ctx context.Context, jti string) (*Session, error)
    
    // GetByUserID 获取用户的所有会话
    GetByUserID(ctx context.Context, tenantID, userID string) ([]*Session, error)
    
    // GetActiveByUserID 获取用户的所有活跃会话
    GetActiveByUserID(ctx context.Context, tenantID, userID string) ([]*Session, error)
    
    // UpdateLastActive 更新最后活跃时间
    UpdateLastActive(ctx context.Context, id string) error
    
    // Revoke 撤销会话
    Revoke(ctx context.Context, id string, reason string) error
    
    // RevokeAllByUserID 撤销用户所有会话
    RevokeAllByUserID(ctx context.Context, tenantID, userID string, reason string) error
    
    // DeleteExpired 删除过期会话
    DeleteExpired(ctx context.Context) (int64, error)
}
```

#### 3. 会话服务

```go
// SessionService 会话服务
type SessionService struct {
    repo           SessionRepository
    idleTimeout    time.Duration // 30分钟
    sessionTimeout time.Duration // 24小时
}

// CreateSession 创建会话
func (s *SessionService) CreateSession(ctx context.Context, req *CreateSessionRequest) (*Session, error) {
    session := &Session{
        ID:              uuid.New().String(),
        TenantID:        req.TenantID,
        UserID:          req.UserID,
        AccessTokenJTI:  req.AccessTokenJTI,
        RefreshTokenJTI: req.RefreshTokenJTI,
        IPAddress:       req.IPAddress,
        UserAgent:       req.UserAgent,
        DeviceInfo:      req.DeviceInfo,
        IssuedAt:        time.Now(),
        LastActiveAt:    time.Now(),
        ExpiresAt:       time.Now().Add(s.sessionTimeout),
    }
    
    if err := s.repo.Create(ctx, session); err != nil {
        return nil, err
    }
    
    return session, nil
}

// ValidateSession 验证会话有效性
func (s *SessionService) ValidateSession(ctx context.Context, accessTokenJTI string) (*Session, error) {
    session, err := s.repo.GetByAccessTokenJTI(ctx, accessTokenJTI)
    if err != nil {
        return nil, ErrSessionNotFound
    }
    
    // 检查是否已撤销
    if session.IsRevoked() {
        return nil, ErrSessionRevoked
    }
    
    // 检查是否已过期
    if session.IsExpired() {
        return nil, ErrSessionExpired
    }
    
    // 检查是否空闲超时
    if session.IsIdleExpired(s.idleTimeout) {
        // 标记为过期
        s.repo.Revoke(ctx, session.ID, "idle_timeout")
        return nil, ErrSessionIdleExpired
    }
    
    // 更新最后活跃时间
    s.repo.UpdateLastActive(ctx, session.ID)
    
    return session, nil
}

// GetUserSessions 获取用户会话列表
func (s *SessionService) GetUserSessions(ctx context.Context, tenantID, userID string) ([]*Session, error) {
    return s.repo.GetByUserID(ctx, tenantID, userID)
}

// RevokeSession 撤销会话
func (s *SessionService) RevokeSession(ctx context.Context, sessionID, reason string) error {
    return s.repo.Revoke(ctx, sessionID, reason)
}
```

#### 4. 空闲超时引擎

```go
// IdleTimeoutEngine 空闲超时引擎
type IdleTimeoutEngine struct {
    repo        SessionRepository
    idleTimeout time.Duration
    interval    time.Duration // 检查间隔
}

// Start 启动定时检查
func (e *IdleTimeoutEngine) Start(ctx context.Context) {
    ticker := time.NewTicker(e.interval)
    defer ticker.Stop()
    
    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            e.checkIdleSessions(ctx)
        }
    }
}

// checkIdleSessions 检查空闲会话
func (e *IdleTimeoutEngine) checkIdleSessions(ctx context.Context) {
    // 查找空闲超时的会话
    threshold := time.Now().Add(-e.idleTimeout)
    
    var sessions []*Session
    db.Where("revoked_at IS NULL AND last_active_at < ?", threshold).
        Find(&sessions)
    
    for _, session := range sessions {
        // 撤销会话
        e.repo.Revoke(ctx, session.ID, "idle_timeout")
        
        // 记录审计日志
        log.Printf("Session %s idle timeout for user %s", session.ID, session.UserID)
    }
}
```

#### 5. 定时清理任务

```go
// SessionCleanupTask 会话清理任务
type SessionCleanupTask struct {
    repo SessionRepository
}

// Run 执行清理
func (t *SessionCleanupTask) Run(ctx context.Context) {
    // 删除 7 天前的过期会话
    deleted, err := t.repo.DeleteExpired(ctx)
    if err != nil {
        log.Printf("Failed to cleanup expired sessions: %v", err)
        return
    }
    
    log.Printf("Cleaned up %d expired sessions", deleted)
}

// Schedule 定时调度
func (t *SessionCleanupTask) Schedule() {
    // 每天凌晨 3 点执行
    scheduler.Every(1).Day().At("03:00").Run(func() {
        t.Run(context.Background())
    })
}
```

### 中间件集成

```go
// SessionMiddleware 会话验证中间件
func SessionMiddleware(sessionService *SessionService) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 获取 Access Token
        accessToken := ExtractToken(c)
        if accessToken == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "missing token"})
            return
        }
        
        // 解析 Token 获取 JTI
        claims, err := ParseToken(accessToken)
        if err != nil {
            c.AbortWithStatusJSON(401, gin.H{"error": "invalid token"})
            return
        }
        
        // 验证会话
        session, err := sessionService.ValidateSession(c.Request.Context(), claims.ID)
        if err != nil {
            switch err {
            case ErrSessionNotFound, ErrSessionRevoked:
                c.AbortWithStatusJSON(401, gin.H{"error": "session not found", "code": "SESSION_INVALID"})
            case ErrSessionExpired:
                c.AbortWithStatusJSON(401, gin.H{"error": "session expired", "code": "SESSION_EXPIRED"})
            case ErrSessionIdleExpired:
                c.AbortWithStatusJSON(401, gin.H{"error": "session idle timeout", "code": "SESSION_IDLE_TIMEOUT"})
            default:
                c.AbortWithStatusJSON(500, gin.H{"error": "internal error"})
            }
            return
        }
        
        // 设置会话上下文
        c.Set("session", session)
        c.Set("user_id", session.UserID)
        c.Set("tenant_id", session.TenantID)
        
        c.Next()
    }
}
```

## 性能考虑

1. **索引优化**: 在 tenant_id, user_id, access_token_jti 上建立索引
2. **缓存**: 使用 Redis 缓存活跃会话状态
3. **批量清理**: 定时批量清理过期会话

## 与其他模块的关系

```
┌───────────────┐     ┌───────────────┐
│Session Service│────→│  User Repo    │
│   (本模块)    │     │  (用户查询)   │
└───────────────┘     └───────────────┘
        │
        │
        ▼
┌───────────────┐
│ Audit Logger  │
│  (审计日志)   │
└───────────────┘
```