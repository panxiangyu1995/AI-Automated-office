# 详细规格 - 语义路由实现

## 1. 类型定义

### 1.1 SemanticRoutingConfig

```rust
/// 语义路由配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SemanticRoutingConfig {
    /// 启用语义路由
    pub enabled: bool,
    /// 相似度阈值 (0.0-1.0)，低于此值的匹配被过滤
    pub threshold: f32,
    /// Top-K 返回数量
    pub top_k: usize,
    /// 嵌入模型 ID (留空使用默认模型)
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

impl SemanticRoutingConfig {
    /// 验证配置有效性
    pub fn validate(&self) -> Result<(), SemanticRoutingError> {
        if self.threshold < 0.0 || self.threshold > 1.0 {
            return Err(SemanticRoutingError::InvalidThreshold(self.threshold));
        }
        if self.top_k == 0 {
            return Err(SemanticRoutingError::InvalidTopK(self.top_k));
        }
        Ok(())
    }
}

/// 语义路由错误类型
#[derive(Debug, thiserror::Error)]
pub enum SemanticRoutingError {
    #[error("Invalid threshold: {0}, must be between 0.0 and 1.0")]
    InvalidThreshold(f32),
    
    #[error("Invalid top_k: {0}, must be > 0")]
    InvalidTopK(usize),
    
    #[error("Embedding service error: {0}")]
    EmbeddingError(String),
}
```

### 1.2 SemanticRouter

```rust
/// 语义路由器
pub struct SemanticRouter {
    /// 嵌入服务
    embedding_service: Arc<dyn EmbeddingService>,
    /// 嵌入向量缓存 (LRU)
    cache: Arc<RwLock<LruCache<String, Vec<f32>>>>,
    /// 配置
    config: SemanticRoutingConfig,
}

impl SemanticRouter {
    /// 创建新的语义路由器
    pub fn new(
        embedding_service: Arc<dyn EmbeddingService>,
        config: SemanticRoutingConfig,
    ) -> Self {
        Self {
            embedding_service,
            cache: Arc::new(RwLock::new(LruCache::new(1024))), // 缓存 1024 个向量
            config,
        }
    }
    
    /// 匹配规则
    pub async fn match_rules(
        &self,
        context: &RoutingContext,
        rules: &[RoutingRule],
    ) -> Result<Vec<(RoutingRule, f64)>, SemanticRoutingError> {
        // 1. 验证配置
        self.config.validate()?;
        
        // 2. 获取查询嵌入
        let query_embedding = self
            .get_or_compute_embedding(&context.user_message)
            .await
            .map_err(|e| SemanticRoutingError::EmbeddingError(e.to_string()))?;
        
        // 3. 计算每个规则的相似度
        let mut results = Vec::new();
        for rule in rules {
            if let Some(rule_text) = self.build_rule_text(rule) {
                let rule_embedding = self
                    .get_or_compute_embedding(&rule_text)
                    .await
                    .map_err(|e| SemanticRoutingError::EmbeddingError(e.to_string()))?;
                
                let similarity = cosine_similarity(&query_embedding, &rule_embedding);
                
                if similarity >= self.config.threshold {
                    results.push((rule.clone(), similarity));
                }
            }
        }
        
        // 4. 排序并返回 Top-K
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        results.truncate(self.config.top_k);
        
        Ok(results)
    }
    
    /// 构建规则文本
    fn build_rule_text(&self, rule: &RoutingRule) -> Option<String> {
        let mut parts = Vec::new();
        
        // 关键词
        parts.extend(rule.keywords.clone());
        
        // 描述
        if let Some(desc) = &rule.description {
            parts.push(desc.clone());
        }
        
        // 子代理名称
        if let Some(name) = &rule.sub_agent_name {
            parts.push(name.clone());
        }
        
        if parts.is_empty() {
            None
        } else {
            Some(parts.join(" "))
        }
    }
    
    /// 获取或计算嵌入向量
    async fn get_or_compute_embedding(
        &self,
        text: &str,
    ) -> Result<Vec<f32>, Box<dyn std::error::Error + Send + Sync>> {
        let cache_key = Self::hash_text(text);
        
        // 检查缓存
        {
            let cache = self.cache.read().await;
            if let Some(embedding) = cache.get(&cache_key) {
                return Ok(embedding.clone());
            }
        }
        
        // 计算嵌入
        let embedding = self.embedding_service.embed(text).await?;
        
        // 更新缓存
        {
            let mut cache = self.cache.write().await;
            cache.put(cache_key, embedding.clone());
        }
        
        Ok(embedding)
    }
    
    /// 文本哈希
    fn hash_text(text: &str) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};
        let mut hasher = DefaultHasher::new();
        text.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }
}

/// 余弦相似度计算
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() {
        return 0.0;
    }
    
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
    let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();
    
    if norm_a == 0.0 || norm_b == 0.0 {
        0.0
    } else {
        dot / (norm_a * norm_b)
    }
}
```

## 2. 接口规格

### 2.1 EmbeddingService Trait

```rust
/// 嵌入服务接口
pub trait EmbeddingService: Send + Sync {
    /// 生成文本嵌入
    async fn embed(&self, text: &str) -> Result<Vec<f32>, Error>;
    
    /// 批量生成嵌入
    async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>, Error>;
    
    /// 获取嵌入维度
    fn dimension(&self) -> usize;
}
```

### 2.2 SubAgentRoutingService 修改

```rust
/// 子代理路由服务
#[derive(Clone)]
pub struct SubAgentRoutingService {
    rules: Arc<RwLock<Vec<RoutingRule>>>,
    outcomes: Arc<RwLock<Vec<RoutingOutcome>>>,
    routing_mode: RoutingMode,
    approval_queue: Arc<RwLock<Vec<ApprovalItem>>>,
    confirmation_state: Arc<RwLock<ConfirmationState>>,
    semantic_router: Option<Arc<SemanticRouter>>, // 新增
}

impl SubAgentRoutingService {
    /// 使用语义路由器创建
    pub fn with_semantic_router(
        self,
        embedding_service: Arc<dyn EmbeddingService>,
    ) -> Self {
        let router = SemanticRouter::new(
            embedding_service,
            SemanticRoutingConfig::default(),
        );
        Self {
            semantic_router: Some(Arc::new(router)),
            ..self
        }
    }
    
    /// 计算匹配分数
    fn calculate_match_score(rule: &RoutingRule, context: &RoutingContext) -> f64 {
        match rule.match_strategy {
            MatchStrategy::Keyword => Self::keyword_match(rule, context),
            MatchStrategy::Semantic => {
                // 如果有语义路由器，使用它
                // 否则回退到关键词匹配
                Self::keyword_match(rule, context) * 0.5
            }
            MatchStrategy::Combined => {
                let keyword_score = Self::keyword_match(rule, context);
                let semantic_score = Self::keyword_match(rule, context) * 0.8;
                (keyword_score + semantic_score) / 2.0
            }
            MatchStrategy::LlmGuided => {
                Self::keyword_match(rule, context) * 0.6
            }
        }
    }
}
```

## 3. 验收标准

### 3.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1 | 语义路由匹配返回相似度分数 | 单元测试 |
| AC2 | 低于阈值的匹配被过滤 | 单元测试 |
| AC3 | 返回最多 top_k 个结果 | 单元测试 |
| AC4 | 结果按相似度降序排列 | 单元测试 |
| AC5 | 相同文本返回缓存的嵌入 | 单元测试 |
| AC6 | cos(0°) = 1, cos(90°) = 0, cos(180°) = -1 | 单元测试 |

### 3.2 性能验收

| ID | 验收标准 | 目标 |
|----|----------|------|
| PC1 | 缓存命中时，语义匹配延迟 < 10ms | 通过 |
| PC2 | 缓存未命中时，语义匹配延迟 < 200ms | 通过 |

### 3.3 准确性验收

| ID | 验收标准 | 目标 |
|----|----------|------|
| AC7 | 语义路由匹配准确率 > 80% | 集成测试 |

## 4. 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| EmbeddingService 不可用 | 回退到关键词匹配 |
| 嵌入向量维度不匹配 | 返回错误 |
| 缓存满 | LRU 自动淘汰 |
| 配置无效 | 返回验证错误 |
