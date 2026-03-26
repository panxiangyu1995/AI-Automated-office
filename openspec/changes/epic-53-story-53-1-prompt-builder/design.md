# Design: 提示词构建器 - 分层提示词整合

## 技术方案

### 实现类型
- **类型**: new
- **优先级**: high
- **阶段**: Phase 3 - 记忆层与提示词集成

### 模块结构

```
src-tauri/src/agent/prompt/
├── mod.rs              # 模块入口，导出 PromptBuilder
├── builder.rs          # PromptBuilder 核心实现
├── layer.rs            # 分层提示词定义
└── tests.rs            # 单元测试
```

### 核心 API 设计

#### Rust API

```rust
// layer.rs - 分层提示词定义

/// 提示词层级枚举
#[derive(Debug, Clone)]
pub enum PromptLayer {
    /// 系统级提示词（不可覆盖）
    System(SystemPrompt),
    /// 角色提示词（可叠加）
    Role(RolePrompt),
    /// 个人记忆层 L1
    MemoryL1(MemoryContext),
    /// 企业知识库层 L2
    KnowledgeL2(KnowledgeResult),
    /// 错题集规则
    CorrectionRule(CorrectionRule),
}

/// 系统提示词结构
#[derive(Debug, Clone)]
pub struct SystemPrompt {
    pub base_instructions: String,      // 基础指令
    pub safety_rules: String,          // 安全规则
    pub format_requirements: String,    // 格式要求
}

/// 角色提示词结构
#[derive(Debug, Clone)]
pub struct RolePrompt {
    pub role_name: String,
    pub role_description: String,
    pub capabilities: Vec<String>,
    pub constraints: Vec<String>,
}

/// 记忆上下文
#[derive(Debug, Clone)]
pub struct MemoryContext {
    pub memories: Vec<MemoryItem>,
    pub relevance_scores: Vec<f32>,
}

/// 知识库检索结果
#[derive(Debug, Clone)]
pub struct KnowledgeResult {
    pub documents: Vec<KnowledgeDocument>,
    pub relevance_scores: Vec<f32>,
}

/// 错题集规则
#[derive(Debug, Clone)]
pub struct CorrectionRule {
    pub rule_id: String,
    pub scenario: String,
    pub instruction: String,
    pub priority: i32,
}
```

```rust
// builder.rs - PromptBuilder 核心实现

use super::layer::*;

pub struct PromptBuilder {
    layers: Vec<PromptLayer>,
    max_token_limit: usize,
}

impl PromptBuilder {
    /// 创建新的 PromptBuilder
    pub fn new(max_token_limit: usize) -> Self;

    /// 添加系统提示词
    pub fn with_system_prompt(mut self, prompt: SystemPrompt) -> Self;

    /// 添加角色提示词
    pub fn with_role_prompt(mut self, prompt: RolePrompt) -> Self;

    /// 添加个人记忆层
    pub fn with_memory_context(mut self, context: MemoryContext) -> Self;

    /// 添加知识库检索结果
    pub fn with_knowledge(mut self, knowledge: KnowledgeResult) -> Self;

    /// 添加错题集规则
    pub fn with_correction_rules(mut self, rules: Vec<CorrectionRule>) -> Self;

    /// 构建最终提示词
    pub fn build(&self) -> BuildResult;

    /// 计算当前提示词的 Token 数量
    pub fn estimate_token_count(&self) -> usize;
}

/// 构建结果
pub struct BuildResult {
    pub prompt: String,
    pub token_count: usize,
    pub layer_breakdown: HashMap<String, usize>,
}
```

#### Tauri 命令接口

```rust
// commands.rs - Tauri 命令定义

#[tauri::command]
pub async fn invoke_build_prompt(
    session_id: String,
    user_input: String,
) -> Result<PromptResponse, PromptError>;
```

### 技术实现细节

#### 1. 分层加载策略

```
┌─────────────────────────────────────────┐
│           最终提示词上下文               │
├─────────────────────────────────────────┤
│ Layer 5: 错题集规则 (CorrectionRule)     │  ← 优先级最高，自动注入
├─────────────────────────────────────────┤
│ Layer 4: 企业知识库 L2 (KnowledgeL2)     │  ← 基于场景检索注入
├─────────────────────────────────────────┤
│ Layer 3: 个人记忆 L1 (MemoryL1)          │  ← 相关记忆动态注入
├─────────────────────────────────────────┤
│ Layer 2: 角色提示词 (RolePrompt)        │  ← 多角色叠加
├─────────────────────────────────────────┤
│ Layer 1: 系统提示词 (SystemPrompt)      │  ← 基础指令、安全规则
└─────────────────────────────────────────┘
```

#### 2. Token 预算分配

| 层级 | 默认 Token 预算 | 可配置 | 说明 |
|------|----------------|--------|------|
| 系统提示词 | 500 | 是 | 基础指令和安全规则 |
| 角色提示词 | 800 | 是 | 多角色叠加 |
| 个人记忆 L1 | 2000 | 是 | 动态调整 |
| 知识库 L2 | 3000 | 是 | 基于检索结果 |
| 错题集规则 | 500 | 是 | 自动注入 |
| **总计** | **6800** | - | 默认 8000 上限 |

#### 3. 提示词合并算法

```rust
impl PromptBuilder {
    fn merge_prompts(&self) -> String {
        let mut result = String::new();

        // 按优先级顺序合并
        for layer in &self.layers {
            match layer {
                PromptLayer::System(p) => {
                    result.push_str(&p.base_instructions);
                    result.push_str("\n\n");
                    result.push_str(&p.safety_rules);
                    result.push_str("\n\n");
                }
                PromptLayer::Role(p) => {
                    result.push_str(&format!("【角色: {}】\n", p.role_name));
                    result.push_str(&p.role_description);
                    result.push_str("\n\n");
                }
                PromptLayer::MemoryL1(p) => {
                    result.push_str("【相关记忆】\n");
                    for (i, memory) in p.memories.iter().enumerate() {
                        result.push_str(&format!("- {}\n", memory.content));
                    }
                    result.push_str("\n\n");
                }
                PromptLayer::KnowledgeL2(p) => {
                    result.push_str("【企业知识库】\n");
                    for doc in &p.documents {
                        result.push_str(&format!("## {}\n{}\n\n", doc.title, doc.content));
                    }
                }
                PromptLayer::CorrectionRule(p) => {
                    result.push_str(&format!("【执行规则: {}】\n{}\n\n",
                        p.scenario, p.instruction));
                }
            }
        }

        result
    }
}
```

### 状态管理

前端使用 Zustand 管理提示词构建状态：

```typescript
// stores/promptStore.ts
interface PromptBuildState {
  currentPrompt: string | null;
  tokenCount: number;
  layerBreakdown: Record<string, number>;
  isBuilding: boolean;

  buildPrompt: (sessionId: string, userInput: string) => Promise<void>;
  estimateTokenCount: () => Promise<number>;
}
```

### 安全考虑

1. **提示词注入防护**: 对用户输入进行脱敏处理，防止提示词注入攻击
2. **Token 限制**: 严格遵守 Token 预算，防止上下文溢出
3. **敏感信息过滤**: 自动过滤记忆和知识库中的敏感信息

### 性能考虑

1. **异步加载**: 记忆和知识库检索使用异步加载，不阻塞提示词构建
2. **缓存机制**: 对系统提示词和角色提示词进行缓存
3. **增量更新**: 支持增量更新特定层，而非全量重构建
