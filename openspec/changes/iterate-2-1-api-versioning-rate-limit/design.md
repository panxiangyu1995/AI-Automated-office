# 设计：API 版本管理和限流

## API 版本管理

```go
// internal/router/v1/api.go
type V1API struct {
    auth       *AuthHandler
    permission *PermissionHandler
    admin      *AdminHandler
}

func (v *V1API) RegisterRoutes(rg *gin.RouterGroup)
```

## 限流策略

```go
// internal/middleware/ratelimit.go
type RateLimiter struct {
    ipLimiter     *tokenBucket
    tokenLimiter  *tokenBucket
}
```

- IP 限流：100 req/min
- Token 限流：1000 req/min
- 登录限流：10 req/min
