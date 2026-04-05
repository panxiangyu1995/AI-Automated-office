# Design: 模型分层与自动路由

## 1. 模型路由器

```rust
/// 模型路由器
pub struct ModelRouter {
    config: ModelRouterConfig,
}

impl ModelRouter {
    /// 根据任务选择模型
    pub fn select_model(&self, task: &TaskContext) -> ModelProvider {
        // 复杂度评估
        let complexity = self.evaluate_complexity(task);
        
        match complexity {
            TaskComplexity::Simple => self.get_light_model(),
            TaskComplexity::Medium => self.get_primary_model(),
            TaskComplexity::Complex => self.get_primary_model(),
            TaskComplexity::NoTool => self.get_small_model(),
        }
    }
    
    /// 评估任务复杂度
    fn evaluate_complexity(&self, task: &TaskContext) -> TaskComplexity {
        // 简单任务：OCR、简单查询、意图分类
        if task.tool_name == "finance_ocr" 
            || task.tool_name == "title"
            || task.intent == "simple_query" {
            return TaskComplexity::Simple;
        }
        
        // 无工具任务：标题生成、摘要、上下文压缩
        if task.tools.is_empty() {
            return TaskComplexity::NoTool;
        }
        
        // 复杂任务：报表生成、多步骤推理、跨部门协调
        if task.intent == "report"
            || task.intent == "analysis"
            || task.intent == "cross_department" {
            return TaskComplexity::Complex;
        }
        
        TaskComplexity::Medium
    }
}

/// 任务复杂度
pub enum TaskComplexity {
    /// 简单任务：OCR、简单查询
    Simple,
    /// 中等任务：一般查询
    Medium,
    /// 复杂任务：报表、分析
    Complex,
    /// 无工具任务：标题、摘要
    NoTool,
}

/// 任务上下文
pub struct TaskContext {
    pub tool_name: Option<String>,
    pub tools: Vec<String>,
    pub intent: String,
    pub subagent: Option<String>,
    pub message_length: usize,
}
```

## 2. 模型配置

```rust
/// 模型配置
#[derive(Debug, Clone)]
pub struct ModelRouterConfig {
    /// 主模型
    pub primary: ModelProvider,
    /// 轻量模型
    pub light: ModelProvider,
    /// 小模型
    pub small: ModelProvider,
}

/// 获取轻量模型（用于 OCR、简单查询）
fn get_light_model(&self) -> ModelProvider {
    ModelProvider {
        provider: "anthropic".to_string(),
        model_id: "claude-haiku-4-5".to_string(),
        temperature: 0.3,
        max_tokens: 4096,
    }
}

/// 获取小模型（用于标题、摘要）
fn get_small_model(&self) -> ModelProvider {
    ModelProvider {
        provider: "anthropic".to_string(),
        model_id: "claude-haiku-4-5".to_string(),
        temperature: 0.5,
        max_tokens: 1024,
    }
}
```

## 3. 动态切换

```rust
/// 模型切换策略
pub struct ModelSwitchStrategy {
    router: Arc<ModelRouter>,
    cache: Arc<ModelCache>,
}

impl ModelSwitchStrategy {
    /// 在执行过程中判断是否需要切换模型
    pub async fn should_switch(
        &self,
        current: &ModelProvider,
        context: &ExecutionContext,
    ) -> Option<ModelProvider> {
        // 1. 检查上下文长度
        let token_count = context.message_token_count;
        if token_count > self.get_model(current).max_context_tokens * 0.8 {
            // 切换到更小的模型或触发压缩
            return Some(self.get_small_model());
        }
        
        // 2. 检查工具调用复杂度
        let complexity = self.evaluate_complexity_from_context(context);
        if complexity == TaskComplexity::Simple && !self.is_light_model(current) {
            return Some(self.get_light_model());
        }
        
        None
    }
    
    fn is_light_model(&self, model: &ModelProvider) -> bool {
        model.model_id.contains("haiku")
    }
}
```

## 4. 模型选择规则

```yaml
# 模型选择规则
model_selection:
  # 简单任务 -> 轻量模型
  simple:
    conditions:
      - tool: ["finance_ocr", "title", "summary"]
      - intent: ["simple_query", "classification"]
      - no_tool: true
    model: light
    temperature: 0.3
  
  # 复杂任务 -> 主模型
  complex:
    conditions:
      - intent: ["report", "analysis", "cross_department"]
      - subagent: ["orchestrator"]
      - multi_step: true
    model: primary
    temperature: 0.7
  
  # 无工具任务 -> 小模型
  no_tool:
    conditions:
      - tools: []  # 空工具列表
    model: small
    temperature: 0.5
```
