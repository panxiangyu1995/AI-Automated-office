# Design: 记忆系统三层架构

## 模块结构

```
src-tauri/src/agent/memory/
├── mod.rs              # 模块导出
├── types.rs            # 核心类型定义
├── config.rs           # 记忆配置
├── hooks/
│   ├── mod.rs          # Hook模块导出
│   ├── registry.rs     # Hook注册表
│   ├── dispatcher.rs   # Hook分发器
│   └── handlers.rs     # Hook处理器
├── storage/
│   ├── mod.rs          # 存储模块导出
│   ├── layer.rs        # 三层存储抽象
│   ├── personal.rs     # L1个人记忆存储
│   ├── enterprise.rs   # L2企业知识库存储
│   └── graph.rs        # L3图记忆存储（Post-MVP）
├── retrieval/
│   ├── mod.rs          # 检索模块导出
│   ├── hybrid.rs       # 混合检索
│   ├── ranker.rs       # 排序器
│   └── progressive.rs  # 渐进式披露
├── cognitive/
│   ├── mod.rs          # 认知模块导出
│   ├── state.rs        # 认知状态
│   ├── trajectory.rs   # 思维轨迹
│   └── switching.rs    # 切换成本
├── update/
│   ├── mod.rs          # 更新模块导出
│   ├── decision.rs     # 智能决策
│   ├── conflict.rs     # 冲突检测
│   └── version.rs      # 版本管理
└── service.rs          # 记忆服务入口
```

## 核心数据结构

### MemoryLayer

```rust
/// 记忆层级
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MemoryLayer {
    /// L1: 个人记忆（仅用户本人可访问）
    Personal,
    /// L2: 企业知识库（租户全员可访问）
    Enterprise,
    /// L3: 图记忆（Post-MVP）
    Graph,
}

/// 记忆项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryItem {
    pub id: String,
    pub layer: MemoryLayer,
    pub tenant_id: String,
    pub user_id: Option<String>,
    pub session_key: Option<String>,
    pub key: String,
    pub value: String,
    pub category: MemoryCategory,
    pub confidence: f64,
    pub source: MemorySource,
    pub embedding: Option<Vec<f32>>,
    pub metadata: serde_json::Value,
    pub created_at: i64,
    pub updated_at: i64,
    pub last_accessed_at: Option<i64>,
    pub access_count: i64,
    pub version: u32,
    pub is_deleted: bool,
}

/// 记忆类别
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemoryCategory {
    Preference,      // 用户偏好
    Fact,            // 关键事实
    Rule,            // 业务规则
    Context,         // 会话上下文
    Observation,     // 观察
    Summary,         // 摘要
    Knowledge,       // 知识
}

/// 记忆来源
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MemorySource {
    UserInput,       // 用户输入
    AgentInference,  // Agent推理
    ToolResult,      // 工具结果
    SystemImport,    // 系统导入
    KnowledgeBase,   // 知识库
}
```

### MemoryConfig

```rust
/// 记忆系统配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryConfig {
    /// 向量数据库模式
    pub vector_mode: VectorMode,
    /// Embedding配置
    pub embedding: EmbeddingConfig,
    /// 混合检索配置
    pub hybrid_search: HybridSearchConfig,
    /// 记忆保留策略
    pub retention: RetentionPolicy,
    /// 同步配置
    pub sync: SyncConfig,
}

/// 向量数据库模式
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VectorMode {
    /// 本地嵌入式（sqlite-vec）
    Local,
    /// 云端服务（Qdrant）
    Cloud,
    /// 混合模式
    Hybrid,
}

/// 记忆保留策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    /// 个人记忆保留天数
    pub personal_retention_days: u32,
    /// 企业知识保留天数
    pub enterprise_retention_days: u32,
    /// 最大记忆条数
    pub max_items_per_user: u32,
    /// 自动压缩阈值
    pub auto_compress_threshold: u32,
}

/// 同步配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    /// 是否启用同步
    pub enabled: bool,
    /// 同步间隔（秒）
    pub interval_secs: u64,
    /// 冲突解决策略
    pub conflict_strategy: ConflictStrategy,
}

/// 冲突解决策略
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictStrategy {
    LocalWins,
    RemoteWins,
    LatestWins,
    Merge,
}
```

### MemoryHook

```rust
/// Hook事件类型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HookEvent {
    SessionStart { session_key: String, user_id: String },
    UserPromptSubmit { session_key: String, prompt: String },
    PostToolUse { session_key: String, tool_name: String, result: String },
    Stop { session_key: String, reason: String },
    SessionEnd { session_key: String },
}

/// Hook处理器
#[async_trait]
pub trait HookHandler: Send + Sync {
    async fn handle(&self, event: &HookEvent) -> Result<Vec<MemoryItem>>;
    fn name(&self) -> &str;
    fn priority(&self) -> u8;
}
```

### SmartUpdateDecision

```rust
/// 智能更新决策
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateDecision {
    pub action: UpdateAction,
    pub reason: String,
    pub confidence: f64,
    pub affected_items: Vec<String>,
}

/// 更新动作
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UpdateAction {
    Add,      // 新增记忆
    Update,   // 更新现有记忆
    Delete,   // 删除记忆
    None,     // 无需更新
    Merge,    // 合并记忆
}

/// 智能更新器
pub struct SmartUpdater {
    embedding_service: EmbeddingService,
    similarity_threshold: f64,
}

impl SmartUpdater {
    pub async fn decide(&self, existing: &[MemoryItem], new: &MemoryItem) -> Result<UpdateDecision> {
        // 1. 计算与现有记忆的相似度
        let similarities = self.compute_similarities(existing, new).await?;
        
        // 2. 找到最相似的记忆
        let best_match = similarities.iter()
            .enumerate()
            .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
            .filter(|(_, &sim)| sim > self.similarity_threshold);
        
        // 3. 做出决策
        match best_match {
            Some((idx, sim)) => {
                let existing_item = &existing[idx];
                if self.is_contradictory(existing_item, new) {
                    Ok(UpdateDecision {
                        action: UpdateAction::Update,
                        reason: format!("发现矛盾，更新现有记忆（相似度: {:.2}）", sim),
                        confidence: sim,
                        affected_items: vec![existing_item.id.clone()],
                    })
                } else if self.is_redundant(existing_item, new) {
                    Ok(UpdateDecision {
                        action: UpdateAction::None,
                        reason: format!("记忆冗余，无需更新（相似度: {:.2}）", sim),
                        confidence: sim,
                        affected_items: vec![],
                    })
                } else {
                    Ok(UpdateDecision {
                        action: UpdateAction::Merge,
                        reason: format!("合并相关信息（相似度: {:.2}）", sim),
                        confidence: sim,
                        affected_items: vec![existing_item.id.clone()],
                    })
                }
            }
            None => Ok(UpdateDecision {
                action: UpdateAction::Add,
                reason: "新记忆，无相似项".to_string(),
                confidence: 1.0,
                affected_items: vec![],
            }),
        }
    }
}
```

### HybridSearch

```rust
/// 混合检索结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HybridSearchResult {
    pub items: Vec<MemorySearchResult>,
    pub total: usize,
    pub vector_time_ms: u64,
    pub bm25_time_ms: u64,
    pub fusion_time_ms: u64,
}

/// 记忆检索结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySearchResult {
    pub item: MemoryItem,
    pub score: f64,
    pub vector_score: Option<f64>,
    pub bm25_score: Option<f64>,
    pub highlights: Vec<String>,
}

/// 混合检索引擎
pub struct HybridSearchEngine {
    vector_store: Arc<dyn VectorStore>,
    bm25_store: Bm25Store,
    fusion_weight: f64,  // 向量检索权重 (0.0-1.0)
}

impl HybridSearchEngine {
    pub async fn search(&self, query: &MemoryQuery) -> Result<HybridSearchResult> {
        let start = std::time::Instant::now();
        
        // 1. 向量检索
        let vector_start = std::time::Instant::now();
        let vector_results = self.vector_search(query).await?;
        let vector_time_ms = vector_start.elapsed().as_millis() as u64;
        
        // 2. BM25检索
        let bm25_start = std::time::Instant::now();
        let bm25_results = self.bm25_search(query).await?;
        let bm25_time_ms = bm25_start.elapsed().as_millis() as u64;
        
        // 3. RRF融合
        let fusion_start = std::time::Instant::now();
        let fused_results = self.reciprocal_rank_fusion(
            vector_results,
            bm25_results,
            self.fusion_weight,
        );
        let fusion_time_ms = fusion_start.elapsed().as_millis() as u64;
        
        Ok(HybridSearchResult {
            items: fused_results,
            total: 0,
            vector_time_ms,
            bm25_time_ms,
            fusion_time_ms,
        })
    }
    
    fn reciprocal_rank_fusion(
        &self,
        vector_results: Vec<SearchResult>,
        bm25_results: Vec<SearchResult>,
        vector_weight: f64,
    ) -> Vec<MemorySearchResult> {
        let k = 60.0;  // RRF常数
        
        let mut scores: HashMap<String, f64> = HashMap::new();
        
        // 向量检索得分
        for (rank, result) in vector_results.iter().enumerate() {
            let rrf_score = vector_weight / (k + rank as f64 + 1.0);
            *scores.entry(result.id.clone()).or_default() += rrf_score;
        }
        
        // BM25检索得分
        for (rank, result) in bm25_results.iter().enumerate() {
            let rrf_score = (1.0 - vector_weight) / (k + rank as f64 + 1.0);
            *scores.entry(result.id.clone()).or_default() += rrf_score;
        }
        
        // 排序并返回
        let mut results: Vec<_> = scores.into_iter().collect();
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        
        results.into_iter()
            .map(|(id, score)| MemorySearchResult {
                item: MemoryItem::default(), // 实际从存储加载
                score,
                vector_score: None,
                bm25_score: None,
                highlights: vec![],
            })
            .collect()
    }
}
```

## 核心流程

### 记忆摄入流程

```rust
/// 记忆服务
pub struct MemoryService {
    hook_dispatcher: HookDispatcher,
    storage: MemoryStorage,
    updater: SmartUpdater,
    config: MemoryConfig,
}

impl MemoryService {
    /// 处理Hook事件
    pub async fn on_hook_event(&self, event: &HookEvent) -> Result<()> {
        // 1. 分发到处理器
        let memory_items = self.hook_dispatcher.dispatch(event).await?;
        
        // 2. 对每个记忆项做智能决策
        for item in memory_items {
            let existing = self.storage.find_similar(&item, 0.8).await?;
            let decision = self.updater.decide(&existing, &item).await?;
            
            // 3. 执行决策
            match decision.action {
                UpdateAction::Add => {
                    self.storage.add(&item).await?;
                }
                UpdateAction::Update => {
                    self.storage.update(&decision.affected_items[0], &item).await?;
                }
                UpdateAction::Delete => {
                    self.storage.delete(&decision.affected_items[0]).await?;
                }
                UpdateAction::Merge => {
                    self.storage.merge(&decision.affected_items[0], &item).await?;
                }
                UpdateAction::None => {}
            }
        }
        
        Ok(())
    }
}
```

### 记忆检索流程

```rust
impl MemoryService {
    /// 检索记忆
    pub async fn retrieve(&self, query: &MemoryQuery) -> Result<HybridSearchResult> {
        // 1. 权限检查
        self.check_permission(query.layer, &query.user_id, &query.tenant_id)?;
        
        // 2. 混合检索
        let results = self.hybrid_search.search(query).await?;
        
        // 3. 渐进式披露
        let disclosed = self.progressive_disclosure(results, query.token_budget).await?;
        
        // 4. 更新访问统计
        for result in &disclosed.items {
            self.storage.update_access_stats(&result.item.id).await?;
        }
        
        // 5. 记录审计日志
        self.audit_log.record(AuditEvent::MemoryRetrieve {
            user_id: query.user_id.clone(),
            query: query.query.clone(),
            results_count: disclosed.items.len(),
        });
        
        Ok(disclosed)
    }
}
```

## Tauri命令

```rust
/// 检索记忆
#[tauri::command]
pub async fn memory_search(
    query: MemoryQuery,
    state: State<'_, MemoryService>,
) -> Result<HybridSearchResult, String> {
    state.retrieve(&query).await.map_err(|e| e.to_string())
}

/// 添加记忆
#[tauri::command]
pub async fn memory_add(
    item: MemoryItem,
    state: State<'_, MemoryService>,
) -> Result<(), String> {
    state.add(&item).await.map_err(|e| e.to_string())
}

/// 更新记忆
#[tauri::command]
pub async fn memory_update(
    id: String,
    item: MemoryItem,
    state: State<'_, MemoryService>,
) -> Result<(), String> {
    state.update(&id, &item).await.map_err(|e| e.to_string())
}

/// 删除记忆
#[tauri::command]
pub async fn memory_delete(
    id: String,
    state: State<'_, MemoryService>,
) -> Result<(), String> {
    state.delete(&id).await.map_err(|e| e.to_string())
}

/// 获取记忆统计
#[tauri::command]
pub async fn memory_stats(
    user_id: String,
    tenant_id: String,
    state: State<'_, MemoryService>,
) -> Result<MemoryStats, String> {
    state.get_stats(&user_id, &tenant_id).await.map_err(|e| e.to_string())
}

/// 同步记忆
#[tauri::command]
pub async fn memory_sync(
    state: State<'_, MemoryService>,
) -> Result<SyncResult, String> {
    state.sync().await.map_err(|e| e.to_string())
}
```

## 数据库表结构

### memory_items

```sql
CREATE TABLE memory_items (
    id TEXT PRIMARY KEY,
    layer TEXT NOT NULL,  -- 'personal' | 'enterprise' | 'graph'
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    session_key TEXT,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    category TEXT NOT NULL,
    confidence REAL DEFAULT 1.0,
    source TEXT NOT NULL,
    embedding BLOB,  -- 向量数据
    metadata TEXT,   -- JSON
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    last_accessed_at INTEGER,
    access_count INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    is_deleted INTEGER DEFAULT 0
);

CREATE INDEX idx_memory_tenant ON memory_items(tenant_id);
CREATE INDEX idx_memory_user ON memory_items(user_id);
CREATE INDEX idx_memory_layer ON memory_items(layer);
CREATE INDEX idx_memory_category ON memory_items(category);
CREATE INDEX idx_memory_created ON memory_items(created_at);
```

### memory_observations

```sql
CREATE TABLE memory_observations (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL,
    observation TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (memory_id) REFERENCES memory_items(id)
);
```

### memory_summaries

```sql
CREATE TABLE memory_summaries (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (memory_id) REFERENCES memory_items(id)
);
```

## 与前端集成

### 事件桥接

```typescript
// 前端监听记忆事件
listen('memory-event', (event) => {
  const memoryEvent = event.payload as MemoryEvent;
  
  switch (memoryEvent.type) {
    case 'MemoryAdded':
      // 更新UI
      break;
    case 'MemoryUpdated':
      // 更新UI
      break;
    case 'MemoryDeleted':
      // 更新UI
      break;
    case 'MemorySynced':
      // 显示同步状态
      break;
  }
});
```

### 前端调用

```typescript
// 检索记忆
const results = await invoke('memory_search', {
  query: {
    query: '用户偏好',
    layer: 'personal',
    userId: 'user-123',
    tenantId: 'tenant-456',
    k: 10,
  }
});

// 添加记忆
await invoke('memory_add', {
  item: {
    layer: 'personal',
    key: 'preference.theme',
    value: 'dark',
    category: 'Preference',
    source: 'UserInput',
  }
});
```

## 测试策略

1. **单元测试**
   - 三层权限隔离测试
   - 智能更新决策测试
   - 混合检索测试
   - RRF融合测试

2. **集成测试**
   - Hook系统集成测试
   - 向量数据库集成测试
   - 同步机制测试

3. **性能测试**
   - 大规模记忆检索测试
   - 并发访问测试
   - 向量索引性能测试
