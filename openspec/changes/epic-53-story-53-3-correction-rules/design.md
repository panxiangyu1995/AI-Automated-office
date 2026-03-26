# Design: 错题集规则自动应用

## 技术方案

### 实现类型
- **类型**: new
- **优先级**: medium
- **阶段**: Phase 3 - 记忆层与提示词集成

### 模块结构

```
src-tauri/src/agent/correction/
├── mod.rs              # 模块入口
├── matcher.rs          # 规则匹配器
├── audit.rs            # 审计日志
└── tests.rs            # 单元测试
```

### 核心 API 设计

#### Rust API

```rust
// matcher.rs - 规则匹配器

/// 错题集规则
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrectionRule {
    pub rule_id: String,              // 规则唯一标识
    pub scenario: String,             // 场景类型
    pub keywords: Vec<String>,        // 关键词列表
    pub instruction: String,          // 规则指令
    pub examples: Vec<RuleExample>,   // 示例（正确/错误对比）
    pub priority: i32,                 // 优先级 (1-10)
    pub enabled: bool,                 // 是否启用
    pub version: String,               // 规则版本
}

/// 规则示例
#[derive(Debug, Clone)]
pub struct RuleExample {
    pub wrong: String,    // 错误示例
    pub correct: String,  // 正确示例
}

/// 匹配结果
#[derive(Debug, Clone)]
pub struct RuleMatchResult {
    pub rule: CorrectionRule,
    pub match_score: f32,           // 匹配分数 (0-1)
    pub match_type: MatchType,      // 匹配类型
    pub matched_keywords: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum MatchType {
    ExactKeyword,    // 精确关键词匹配
    SemanticSimilar, // 语义相似匹配
    Category,        // 类别匹配
}

/// 规则匹配器
pub struct CorrectionRuleMatcher {
    similarity_threshold: f32,       // 相似度阈值
    max_rules_per_scene: usize,     // 每场景最大规则数
}

impl CorrectionRuleMatcher {
    /// 创建规则匹配器
    pub fn new(similarity_threshold: f32, max_rules_per_scene: usize) -> Self;

    /// 匹配规则
    pub fn match_rules(
        &self,
        context: &RuleMatchContext,
        rules: &[CorrectionRule],
    ) -> Vec<RuleMatchResult>;

    /// 基于关键词匹配
    fn match_by_keywords(&self, context: &RuleMatchContext, rule: &CorrectionRule) -> Option<RuleMatchResult>;

    /// 基于语义匹配
    fn match_by_semantic(&self, context: &RuleMatchContext, rule: &CorrectionRule) -> Option<RuleMatchResult>;

    /// 计算最终排序分数
    fn calculate_final_score(&self, match_result: &RuleMatchResult, rule: &CorrectionRule) -> f32;
}

/// 匹配上下文
#[derive(Debug, Clone)]
pub struct RuleMatchContext {
    pub current_task: String,        // 当前任务描述
    pub scene_type: String,          // 场景类型
    pub user_input: String,          // 用户输入
    pub relevant_memories: Vec<String>, // 相关记忆
}
```

```rust
// audit.rs - 审计日志

/// 规则应用审计事件
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleApplicationEvent {
    pub event_id: String,
    pub session_id: String,
    pub timestamp: i64,
    pub applied_rules: Vec<AppliedRule>,
    pub task_context: String,
    pub outcome: ApplicationOutcome,
}

/// 已应用的规则
#[derive(Debug, Clone)]
pub struct AppliedRule {
    pub rule_id: String,
    pub rule_version: String,
    pub match_score: f32,
    pub injection_position: i32,      // 注入位置
}

/// 应用结果
#[derive(Debug, Clone, PartialEq)]
pub enum ApplicationOutcome {
    Success,
    PartialSuccess,
    Failed,
    NotApplicable,
}

/// 效果反馈
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleEffectivenessFeedback {
    pub feedback_id: String,
    pub rule_id: String,
    pub session_id: String,
    pub task_result: TaskResult,      // 任务结果
    pub was_helpful: bool,            // 规则是否有帮助
    pub user_rating: i32,             // 用户评分 (1-5)
    pub comments: Option<String>,
    pub timestamp: i64,
}

/// 规则审计器
pub struct RuleAuditor {
    event_sender: EventSender,
}

impl RuleAuditor {
    /// 创建审计器
    pub fn new(event_sender: EventSender) -> Self;

    /// 记录规则应用
    pub async fn log_rule_application(&self, event: RuleApplicationEvent) -> Result<(), AuditError>;

    /// 记录效果反馈
    pub async fn log_effectiveness_feedback(&self, feedback: RuleEffectivenessFeedback) -> Result<(), AuditError>;

    /// 获取规则使用统计
    pub async fn get_rule_statistics(&self, rule_id: &str) -> Result<RuleStatistics, AuditError>;
}

/// 规则统计
#[derive(Debug, Clone)]
pub struct RuleStatistics {
    pub rule_id: String,
    pub total_applications: i64,
    pub success_count: i64,
    pub failure_count: i64,
    pub average_helpfulness_score: f32,
    pub last_used: i64,
}
```

```rust
// mod.rs - 规则到提示词转换

/// 规则提示词生成器
pub struct RulePromptGenerator {
    max_rules_per_injection: usize,   // 每次注入的最大规则数
    include_examples: bool,            // 是否包含示例
}

impl RulePromptGenerator {
    /// 创建生成器
    pub fn new(max_rules_per_injection: usize) -> Self;

    /// 生成规则提示词片段
    pub fn generate_rule_prompt(
        &self,
        matched_rules: &[RuleMatchResult],
    ) -> String;

    /// 生成单条规则的提示词
    fn format_single_rule(&self, rule: &CorrectionRule) -> String;

    /// 生成示例片段
    fn format_examples(&self, examples: &[RuleExample]) -> String;
}
```

#### Tauri 命令接口

```rust
// commands.rs - Tauri 命令定义

/// 匹配错题集规则
#[tauri::command]
pub async fn invoke_match_correction_rules(
    session_id: String,
    context: RuleMatchContext,
) -> Result<Vec<RuleMatchResult>, CorrectionError>;

/// 提交规则效果反馈
#[tauri::command]
pub async fn invoke_feedback_rule_effectiveness(
    feedback: RuleEffectivenessFeedback,
) -> Result<(), CorrectionError>;

/// 获取规则统计
#[tauri::command]
pub async fn invoke_get_rule_statistics(
    rule_id: String,
) -> Result<RuleStatistics, CorrectionError>;
```

### 规则匹配流程

```
┌─────────────────────────────────────────────────────────────┐
│                    规则匹配流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 上下文构建                                              │
│     ├── current_task: 当前任务                             │
│     ├── scene_type: 场景类型                                │
│     ├── user_input: 用户输入                               │
│     └── relevant_memories: 相关记忆                         │
│                                                             │
│  2. 规则检索（从 Epic 6 错题集存储）                         │
│     └── 获取所有 enabled=true 的规则                       │
│                                                             │
│  3. 关键词匹配                                              │
│     ├── 精确匹配: 任务/输入中包含规则关键词                   │
│     └── 计算匹配分数                                        │
│                                                             │
│  4. 语义匹配                                                │
│     ├── 计算任务描述与规则的语义相似度                       │
│     └── 超过阈值则加入候选                                   │
│                                                             │
│  5. 分数计算                                                │
│     ├── match_score * priority_weight = final_score        │
│                                                             │
│  6. 排序输出                                                │
│     └── 按 final_score 降序，保留 top N                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 规则提示词格式

生成的提示词片段格式：

```
【执行规则 - {场景类型}】

{规则1_instruction}
示例：
- 错误：{规则1.examples[0].wrong}
- 正确：{规则1.examples[0].correct}

{规则2_instruction}
示例：
- 错误：{规则2.examples[0].wrong}
- 正确：{规则2.examples[0].correct}

...（最多 {max_rules_per_injection} 条）
```

### 与 PromptBuilder 集成

```rust
// 在 PromptBuilder 中集成

impl PromptBuilder {
    /// 添加错题集规则
    pub fn with_correction_rules(mut self, rules: Vec<CorrectionRule>) -> Self {
        let matcher = CorrectionRuleMatcher::new(0.7, 5);
        let context = RuleMatchContext { ... };
        let matched = matcher.match_rules(&context, &rules);

        let generator = RulePromptGenerator::new(5);
        let rule_prompt = generator.generate_rule_prompt(&matched);

        self.layers.push(PromptLayer::CorrectionRule(
            CorrectionRule { instruction: rule_prompt, .. }
        ));
        self
    }
}
```

### 审计日志设计

规则应用事件结构：

```json
{
  "event_id": "evt_xxx",
  "session_id": "sess_xxx",
  "timestamp": 1711548000,
  "applied_rules": [
    {
      "rule_id": "rule_001",
      "rule_version": "1.0",
      "match_score": 0.85,
      "injection_position": 5
    }
  ],
  "task_context": "创建销售合同",
  "outcome": "Success"
}
```

效果反馈结构：

```json
{
  "feedback_id": "fb_xxx",
  "rule_id": "rule_001",
  "session_id": "sess_xxx",
  "task_result": "合同创建成功",
  "was_helpful": true,
  "user_rating": 4,
  "comments": "金额大写检查有效",
  "timestamp": 1711548500
}
```

### 性能考虑

1. **规则缓存**: 规则列表缓存，定期刷新
2. **增量匹配**: 仅对新增规则执行匹配
3. **异步审计**: 审计日志异步写入，不阻塞主流程
