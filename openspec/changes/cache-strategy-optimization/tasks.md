# Tasks: 缓存策略优化

## Task 205.1 - 创建缓存模块基础结构

- [x] 创建 `src-tauri/src/cache/mod.rs` 模块入口
- [x] 定义统一缓存接口 `CacheMetrics` trait

## Task 205.2 - 实现LRU缓存淘汰

- [x] 创建 `src-tauri/src/cache/lru_cache.rs`
- [x] 实现 `LruCache<K, V>` 包装器
- [x] 添加 `max_size` 配置
- [x] 添加 eviction 计数统计

## Task 205.3 - 扩展EmbeddingCache支持多租户和LRU

- [x] 在 `EmbeddingCache` 添加 `tenant_id` 前缀支持
- [x] 添加 LRU 淘汰逻辑
- [x] 扩展统计接口添加 eviction 计数

## Task 205.4 - 实现缓存预热

- [x] 创建 `src-tauri/src/cache/warmer.rs`
- [x] 实现 `CacheWarmer` trait
- [x] 在应用启动时调用预热逻辑

## Task 205.5 - 创建缓存管理Tauri命令

- [x] 创建 `src-tauri/src/commands/cache_stats.rs`
- [x] 实现获取缓存统计API
- [x] 实现清除缓存API

## Task 205.6 - 更新OpenSpec状态

- [x] 更新 `design.md` 状态
- [x] 更新 `tasks.md` 状态
- [x] 创建 `specs/spec.md`
