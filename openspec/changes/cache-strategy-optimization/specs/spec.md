# Spec: 缓存策略优化

## 功能规格

### 1. 多租户缓存隔离

**描述**：在缓存键中加入tenant_id前缀，实现租户间数据隔离

**API**：
```rust
// 带租户隔离的缓存操作
async fn get_with_tenant(&self, tenant_id: &str, key: &str) -> Option<Vec<f32>>;
async fn set_with_tenant(&self, tenant_id: &str, key: &str, value: &[f32], model: &str) -> SqliteResult<()>;
```

**约束**：
- 缓存键格式：`{tenant_id}:{original_hash}`
- 默认租户ID为"default"

### 2. LRU缓存淘汰

**描述**：使用LRU策略自动淘汰最少使用的缓存条目

**配置**：
```rust
pub struct LruConfig {
    pub max_entries: usize,  // 最大条目数，默认10000
    pub eviction_threshold: f64,  // 淘汰阈值，0.9
}
```

**行为**：
- 当缓存条目达到max_entries时，淘汰最少使用的条目
- eviction计数统计被淘汰的条目数量

### 3. 缓存预热

**描述**：应用启动时加载常用数据到缓存

**接口**：
```rust
pub trait CacheWarmer {
    async fn warm(&self) -> Result<WarmupStats, CacheError>;
}

pub struct WarmupStats {
    pub entries_loaded: usize,
    pub duration_ms: u64,
}
```

**预热数据源**：
- 最近使用的embeddings
- 热门配置项

### 4. 缓存统计

**描述**：统一收集和暴露缓存指标

**指标**：
```rust
pub struct CacheMetrics {
    pub total_entries: usize,
    pub hits: u64,
    pub misses: u64,
    pub hit_rate: f64,
    pub evictions: u64,
    pub last_warmup: Option<i64>,
}
```

## 验收标准

1. **多租户隔离**：
   - 不同tenant_id的缓存数据完全隔离
   - 未指定tenant_id时使用默认租户

2. **LRU淘汰**：
   - 缓存达到上限时自动淘汰最少使用的条目
   - eviction计数正确

3. **缓存预热**：
   - 启动时能加载预定义数据
   - 预热过程可监控

4. **缓存统计**：
   - hits/misses统计准确
   - hit_rate计算正确
   - 可通过Tauri命令获取统计信息
