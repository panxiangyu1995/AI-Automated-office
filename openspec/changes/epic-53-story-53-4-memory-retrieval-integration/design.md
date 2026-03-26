# Design: 记忆检索与注入集成

## 技术方案

### 实现类型
- **类型**: refactor
- **优先级**: medium
- **阶段**: Phase 3 - 记忆层与提示词集成

### 模块结构

```
src-tauri/src/agent/memory/
├── mod.rs              # 模块入口
├── injector.rs         # 记忆注入器
├── prioritizer.rs      # 优先级排序
└── tests.rs            # 单元测试
```

### 核心 API 设计

#### Rust API

```rust
// injector.rs - 记忆注入器

/// 记忆条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryItem {
    pub memory_id: String,           // 记忆唯一标识
    pub content: String,              // 记忆内容
    pub memory_type: MemoryType,      // 记忆类型
    pub created_at: i64,              // 创建时间戳
    pub last_accessed: i64,           // 最后访问时间
    pub access_count: i64,            // 访问次数
    pub relevance_tags: Vec<String>,   // 相关性标签
    pub importance: i32,              // 重要性等级 (1-5)
    pub source: MemorySource,         // 来源信息
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum MemoryType {
    UserPreference,   // 用户偏好
    TaskHistory,      // 任务历史
    ContextSnippet,   // 上下文片段
    KeyDecision,      // 关键决策
    PersonalFact,     // 个人事实
}

#[derive(Debug, Clone)]
pub struct MemorySource {
    pub session_id: String,           // 来源会话
    pub message_id: Option<String>,  // 来源消息
    pub agent_action: Option<String>, // Agent 动作
}

/// 记忆上下文
#[derive(Debug, Clone)]
pub struct MemoryContext {
    pub memories: Vec<MemoryItem>,
    pub total_tokens: usize,
    pub retrieval_method: RetrievalMethod,
    pub source_tracking: Vec<MemorySourceMeta>,
}

/// 来源追踪元数据
#[derive(Debug, Clone)]
pub struct MemorySourceMeta {
    pub memory_id: String,
    pub source: MemorySource,
    pub relevance_score: f32,
    pub injection_position: i32,
}

#[derive(Debug, Clone, PartialEq)]
pub enum RetrievalMethod {
    KeywordMatch,
    SemanticSimilarity,
    Hybrid,
    TimeDecay,
}

/// 记忆注入器
pub struct MemoryInjector {
    max_memories: usize,             // 最大记忆数
    max_tokens: usize,               // 最大 Token 数
    relevance_threshold: f32,        // 相关性阈值
    time_decay_factor: f32,          // 时间衰减因子
}

impl MemoryInjector {
    /// 创建记忆注入器
    pub fn new(max_memories: usize, max_tokens: usize) -> Self;

    /// 检索相关记忆
    pub async fn retrieve_relevant_memories(
        &self,
        query: &MemoryQuery,
    ) -> Result<Vec<MemoryItem>, MemoryError>;

    /// 预加载会话记忆
    pub async fn preload_session_memories(
        &self,
        session_id: &str,
    ) -> Result<MemoryContext, MemoryError>;

    /// 注入记忆到上下文
    pub fn inject_memories(
        &self,
        memories: Vec<MemoryItem>,
        context: &mut CompressionContext,
    ) -> MemoryContext;

    /// 格式化记忆为提示词片段
    pub fn format_memories_for_prompt(
        &self,
        memories: &[MemoryItem],
    ) -> String;

    /// 追踪记忆来源
    pub fn track_memory_sources(
        &self,
        memories: &[MemoryItem],
    ) -> Vec<MemorySourceMeta>;
}

/// 记忆查询
#[derive(Debug, Clone)]
pub struct MemoryQuery {
    pub user_input: String,           // 用户输入
    pub session_id: String,           // 会话 ID
    pub scene_type: Option<String>,   // 场景类型
    pub current_task: Option<String>, // 当前任务
    pub limit: usize,                 // 返回数量限制
}
```

```rust
// prioritizer.rs - 优先级排序

/// 优先级评分器
pub struct MemoryPrioritizer {
    time_decay_enabled: bool,
    frequency_weight: f32,
    relevance_weight: f32,
    importance_weight: f32,
}

impl MemoryPrioritizer {
    /// 创建优先级评分器
    pub fn new() -> Self;

    /// 计算记忆优先级分数
    pub fn calculate_priority_score(
        &self,
        memory: &MemoryItem,
        query: &MemoryQuery,
    ) -> f32;

    /// 应用时间衰减
    fn apply_time_decay(&self, memory: &MemoryItem, base_score: f32) -> f32;

    /// 计算相关性分数
    fn calculate_relevance_score(
        &self,
        memory: &MemoryItem,
        query: &MemoryQuery,
    ) -> f32;

    /// 排序记忆
    pub fn sort_memories(
        &self,
        memories: Vec<MemoryItem>,
        query: &MemoryQuery,
    ) -> Vec<MemoryItem>;

    /// 裁剪记忆列表（满足 Token 限制）
    pub fn prune_by_token_limit(
        &self,
        memories: &mut Vec<MemoryItem>,
        max_tokens: usize,
        token_estimator: &TokenCounter,
    ) -> usize;  // 返回裁剪掉的 Token 数
}

/// 优先级权重配置
#[derive(Debug, Clone)]
pub struct PriorityWeights {
    pub time_decay_weight: f32,      // 时间衰减权重
    pub relevance_weight: f32,       // 相关性权重
    pub frequency_weight: f32,       // 频率权重
    pub importance_weight: f32,      // 重要性权重
}

impl Default for PriorityWeights {
    fn default() -> Self {
        Self {
            time_decay_weight: 0.2,
            relevance_weight: 0.4,
            frequency_weight: 0.2,
            importance_weight: 0.2,
        }
    }
}
```

#### Tauri 命令接口

```rust
// commands.rs - Tauri 命令定义

/// 获取相关记忆
#[tauri::command]
pub async fn invoke_get_relevant_memories(
    session_id: String,
    user_input: String,
    scene_type: Option<String>,
    limit: Option<usize>,
) -> Result<MemoryContext, MemoryError>;

/// 预加载会话记忆
#[tauri::command]
pub async fn invoke_preload_session_memories(
    session_id: String,
) -> Result<MemoryContext, MemoryError>;

/// 获取记忆来源追踪信息
#[tauri::command]
pub async fn invoke_get_memory_source_tracking(
    session_id: String,
) -> Result<Vec<MemorySourceMeta>, MemoryError>;
```

### 记忆检索流程

```
┌─────────────────────────────────────────────────────────────┐
│                    记忆检索与注入流程                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 会话启动 - 记忆预加载                                    │
│     ├── 获取用户偏好记忆 (UserPreference)                    │
│     ├── 获取最近任务历史 (TaskHistory)                      │
│     └── 构建初始 MemoryContext                              │
│                                                             │
│  2. 用户输入 - 相关记忆检索                                  │
│     ├── 关键词匹配: user_input vs relevance_tags            │
│     ├── 语义检索: 调用 Epic 6 知识库检索                     │
│     └── 混合排序: 合并结果                                   │
│                                                             │
│  3. 优先级排序                                              │
│     ├── 时间衰减: 最近访问的记忆优先                         │
│     ├── 相关性: 与当前任务相关的记忆优先                     │
│     ├── 频率: 经常访问的记忆优先                             │
│     └── 重要性: 高重要性的记忆优先                           │
│                                                             │
│  4. Token 限制裁剪                                          │
│     ├── 计算每个记忆的 Token 数                             │
│     ├── 按优先级从低到高裁剪                                │
│     └── 保留 top N 满足 Token 限制                          │
│                                                             │
│  5. 来源追踪                                                │
│     ├── 记录每个记忆的来源信息                              │
│     └── 记录注入位置                                        │
│                                                             │
│  6. 注入到提示词上下文                                      │
│     └── MemoryContext 传递给 PromptBuilder                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 优先级评分算法

```rust
impl MemoryPrioritizer {
    pub fn calculate_priority_score(
        &self,
        memory: &MemoryItem,
        query: &MemoryQuery,
    ) -> f32 {
        // 1. 相关性分数 (0-1)
        let relevance = self.calculate_relevance_score(memory, query);

        // 2. 时间衰减分数 (0-1)
        let time_decay = self.apply_time_decay(memory, 1.0);

        // 3. 频率分数 (0-1，归一化)
        let frequency = (memory.access_count as f32 / 100.0).min(1.0);

        // 4. 重要性分数 (1-5 -> 0-1)
        let importance = memory.importance as f32 / 5.0;

        // 加权求和
        let weights = PriorityWeights::default();
        relevance * weights.relevance_weight
            + time_decay * weights.time_decay_weight
            + frequency * weights.frequency_weight
            + importance * weights.importance_weight
    }

    fn apply_time_decay(&self, memory: &MemoryItem, base_score: f32) -> f32 {
        let days_since_access =
            (Utc::now().timestamp() - memory.last_accessed) / (24 * 60 * 60);
        base_score * (-days_since_access as f32 * self.time_decay_factor).exp()
    }
}
```

### 记忆提示词格式

```
【相关记忆】

1. [用户偏好] 您上次选择使用电子合同签署
   - 来源: sess_xxx (3天前)
   - 相关性: 高

2. [任务历史] 您经常需要创建销售合同
   - 来源: sess_yyy (1周前)
   - 相关性: 中

3. [关键决策] 合同金额超过10万需要总监审批
   - 来源: sess_zzz (2周前)
   - 相关性: 中
```

### 与 PromptBuilder 集成

```rust
// 在 PromptBuilder 中集成

impl PromptBuilder {
    /// 添加记忆上下文
    pub fn with_memory_context(
        mut self,
        context: MemoryContext,
    ) -> Self {
        // 按优先级排序
        let prioritizer = MemoryPrioritizer::new();
        let query = MemoryQuery {
            user_input: String::new(),  // 空查询，保持原顺序
            session_id: String::new(),
            scene_type: None,
            current_task: None,
            limit: 0,
        };
        let sorted_memories = prioritizer.sort_memories(context.memories, &query);

        // 格式化为提示词
        let injector = MemoryInjector::new(10, 2000);
        let memory_prompt = injector.format_memories_for_prompt(&sorted_memories);

        self.layers.push(PromptLayer::MemoryL1(
            MemoryContext {
                memories: sorted_memories,
                total_tokens: injector.estimate_tokens(&memory_prompt),
                ..
            }
        ));
        self
    }
}
```

### 敏感信息过滤

```rust
impl MemoryInjector {
    /// 过滤敏感信息
    fn filter_sensitive_content(&self, memory: &MemoryItem) -> Option<MemoryItem> {
        let sensitive_patterns = [
            "password", "secret", "api_key", "token",
            "credit_card", "ssn",
        ];

        let content_lower = memory.content.to_lowercase();
        for pattern in sensitive_patterns {
            if content_lower.contains(pattern) {
                return None;  // 过滤掉包含敏感词的记忆
            }
        }

        Some(memory.clone())
    }
}
```

### 性能考虑

1. **异步检索**: 记忆检索异步执行，不阻塞 Agent
2. **结果缓存**: 相同查询的记忆结果缓存
3. **增量加载**: 仅加载与当前输入相关的记忆
4. **流式注入**: 支持增量注入，不一次性加载所有记忆
