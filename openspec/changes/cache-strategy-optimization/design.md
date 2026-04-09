# Design: 缓存策略优化

## 变更概述

为现有缓存模块添加多租户隔离、LRU淘汰、预热和统计功能。

## 架构设计

### 1. 多租户缓存隔离

在缓存键中加入`tenant_id`前缀实现租户隔离：

```
CacheKey = "{tenant_id}:{original_key}"
```

**实现位置**：
- 在`EmbeddingCache`中添加`tenant_id`参数的get/set方法
- 在`OfficialTokenCache`中添加租户隔离

### 2. LRU缓存淘汰

使用`lru` crate实现LRU淘汰策略：

```rust
use lru::LruCache;

struct LruCacheManager<K, V> {
    cache: LruCache<K, V>,
    max_size: usize,
}
```

**实现位置**：
- 创建`src-tauri/src/cache/lru_cache.rs`作为通用LRU缓存包装器
- 为`EmbeddingCache`添加LRU淘汰

### 3. 缓存预热

在应用启动时加载常用数据：

```rust
pub trait CacheWarmer {
    async fn warm(&self) -> Result<(), CacheError>;
}
```

**实现位置**：
- 创建`src-tauri/src/cache/warmer.rs`
- 在启动时调用预热逻辑

### 4. 缓存统计

统一统计接口：

```rust
pub trait CacheStats {
    fn hits(&self) -> u64;
    fn misses(&self) -> u64;
    fn hit_rate(&self) -> f64;
    fn evictions(&self) -> u64;
}
```

**现有实现**：
- `EmbeddingCache`已有`CacheStats`结构体（hits, misses, hit_rate）
- 扩展统计接口添加evictions计数

## 模块结构

```
src-tauri/src/
├── cache/
│   ├── mod.rs                    # 模块入口
│   ├── lru_cache.rs              # LRU缓存包装器
│   ├── warmer.rs                 # 缓存预热
│   └── stats.rs                  # 统一统计接口
├── agent/
│   └── llm_provider/
│       └── token_cache.rs        # 扩展多租户隔离
└── knowledge/
    └── embedding_cache.rs        # 添加LRU淘汰
```

## 依赖

- `lru = "0.12"` (已有)
