# 设计：缓存和性能优化

## 缓存策略

- 用户权限缓存：TTL 5分钟
- 角色权限缓存：TTL 10分钟
- 租户配置缓存：TTL 30分钟

## 实现

```go
// internal/cache/cache.go
type Cache struct {
    data map[string]*cacheItem
    mu   sync.RWMutex
}
```

## 优化点

1. 使用 sync.Map 替代 map + mutex
2. 添加缓存命中率统计
3. 支持 LRU 淘汰策略
