# 设计：Redis 支持

## Redis 配置

```go
type RedisConfig struct {
    Host     string
    Port     int
    Password string
    DB       int
    PoolSize int
}
```

## 缓存接口

```go
type CacheBackend interface {
    Get(ctx context.Context, key string) (interface{}, bool)
    Set(ctx context.Context, key string, value interface{}, ttl time.Duration)
    Delete(ctx context.Context, key string)
    Clear(ctx context.Context)
}
```
