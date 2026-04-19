# 技术设计 - 语义路由实现

## 1. 架构设计

### 1.1 组件关系

```
SubAgentRoutingService
    │
    ├── SemanticRouter (新增)
    │       │
    │       ├── EmbeddingService (依赖)
    │       │
    │       └── CosineSimilarity
    │
    └── MatchStrategy::Semantic
            │
            └── SemanticRouter::match()
```

### 1.2 新增组件

#### SemanticRouter
```rust
pub struct SemanticRouter {
    embedding_service: Arc<dyn EmbeddingService>,
    cache: Arc<RwLock<HashMap<String, Vec<f32>>>>,
    threshold: f32,
}
```

## 2. 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/src/agent/routing.rs` | 修改 | 集成 SemanticRouter |
| `src-tauri/src/agent/routing_types.rs` | 修改 | 添加语义路由配置 |
| `src-tauri/src/vector/embedding.rs` | 新增 | EmbeddingService trait |
| `src-tauri/src/agent/router/semantic.rs` | 新增 | SemanticRouter 实现 |

## 3. 修改方案

### 3.1 routing_types.rs 新增配置

```rust
/// 语义路由配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticRoutingConfig {
    /// 启用语义路由
    pub enabled: bool,
    /// 相似度阈值 (0.0-1.0)
    pub threshold: f32,
    /// Top-K 返回数量
    pub top_k: usize,
    /// 嵌入模型 ID
    pub embedding_model: Option<String>,
}

impl Default for SemanticRoutingConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            threshold: 0.7,
            top_k: 3,
            embedding_model: None,
        }
    }
}
```

### 3.2 routing.rs 修改

```rust
// 新增 SemanticRouter 集成
impl SubAgentRoutingService {
    pub fn with_semantic_router(
        mut self,
        embedding_service: Arc<dyn EmbeddingService>,
    ) -> Self {
        self.semantic_router = Some(SemanticRouter::new(
            embedding_service,
            SemanticRoutingConfig::default(),
        ));
        self
    }
    
    /// 语义路由匹配
    async fn semantic_match(
        &self,
        context: &RoutingContext,
        rules: &[RoutingRule],
    ) -> Vec<(RoutingRule, f64)> {
        if let Some(ref router) = self.semantic_router {
            router.match_rules(context, rules).await
        } else {
            Vec::new()
        }
    }
}
```

### 3.3 新增 semantic.rs

```rust
pub struct SemanticRouter {
    embedding_service: Arc<dyn EmbeddingService>,
    cache: Arc<RwLock<LruCache<String, Vec<f32>>>>,
    config: SemanticRoutingConfig,
}

impl SemanticRouter {
    pub async fn match_rules(
        &self,
        context: &RoutingContext,
        rules: &[RoutingRule],
    ) -> Vec<(RoutingRule, f64)> {
        // 1. 获取用户消息嵌入
        let query_embedding = self.get_or_compute_embedding(&context.user_message).await?;
        
        // 2. 计算每个规则的相似度
        let mut results = Vec::new();
        for rule in rules {
            let rule_embedding = self.get_or_compute_embedding(&rule.keywords.join(" ")).await?;
            let similarity = cosine_similarity(&query_embedding, &rule_embedding);
            
            if similarity >= self.config.threshold {
                results.push((rule.clone(), similarity));
            }
        }
        
        // 3. 按相似度排序
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        
        // 4. 返回 Top-K
        results.truncate(self.config.top_k);
        results
    }
    
    async fn get_or_compute_embedding(&self, text: &str) -> Result<Vec<f32>, Error> {
        // 检查缓存
        let cache_key = hash_text(text);
        if let Some(emb) = self.cache.read().await.get(&cache_key) {
            return Ok(emb.clone());
        }
        
        // 计算嵌入
        let emb = self.embedding_service.embed(text).await?;
        
        // 缓存
        self.cache.write().await.put(cache_key, emb.clone());
        
        Ok(emb)
    }
}

/// 余弦相似度计算
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}

fn hash_text(text: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    text.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}
```

## 4. 数据流变化

```
用户消息
    │
    ▼
RoutingContext::new()
    │
    ▼
SubAgentRoutingService::match_rules()
    │
    ├─ MatchStrategy::Keyword → 关键词匹配
    │
    ├─ MatchStrategy::Semantic → SemanticRouter::match_rules()
    │       │
    │       ▼
    │   EmbeddingService::embed()
    │       │
    │       ▼
    │   cosine_similarity()
    │       │
    │       ▼
    │   Top-K 排序
    │
    ▼
返回匹配结果
```

## 5. 向后兼容性

- 新增 `SemanticRoutingConfig` 配置，默认启用
- 现有 Keyword 匹配策略不受影响
- 如果 EmbeddingService 不可用，自动回退到 Keyword 匹配

## 6. 性能考虑

- 使用 LRU 缓存存储嵌入向量
- 缓存 key 使用文本哈希
- 批量预计算规则嵌入
