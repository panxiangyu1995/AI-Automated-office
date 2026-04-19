# 技术设计 - LLM引导路由实现

## 1. 架构设计

### 1.1 组件关系

```
IntentRouter
    │
    ├── LlmGuidedRouter (新增)
    │       │
    │       ├── RoutePromptTemplate
    │       │
    │       └── LlmProvider
    │
    └── RuleBasedRouter
            │
            └── KeywordMatcher
```

### 1.2 新增组件

#### LlmGuidedRouter
```rust
pub struct LlmGuidedRouter {
    llm_provider: Arc<dyn LlmProvider>,
    prompt_template: RoutePromptTemplate,
    confidence_threshold: f32,
}
```

#### RoutePromptTemplate
```rust
pub struct RoutePromptTemplate {
    system_prompt: String,
    user_template: String,
    available_agents: Vec<AgentInfo>,
}
```

## 2. 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src-tauri/src/agent/router/router.rs` | 修改 | 集成 LlmGuidedRouter |
| `src-tauri/src/agent/router/llm_router.rs` | 新增 | LlmGuidedRouter 实现 |
| `src-tauri/src/agent/router/prompt.rs` | 新增 | RoutePromptTemplate |

## 3. 修改方案

### 3.1 新增 llm_router.rs

```rust
pub struct LlmGuidedRouter {
    llm_provider: Arc<dyn LlmProvider>,
    prompt_template: RoutePromptTemplate,
    confidence_threshold: f32,
    fallback_enabled: bool,
}

impl LlmGuidedRouter {
    pub async fn route(
        &self,
        context: &RoutingContext,
    ) -> Result<RouteDecision, RoutingError> {
        let prompt = self.prompt_template.build_prompt(context);
        
        let response = self.llm_provider.complete(prompt).await?;
        let decision = self.parse_response(&response)?;
        
        // 检查置信度
        if decision.confidence < self.confidence_threshold {
            // 回退到规则匹配
            return self.fallback_route(context).await;
        }
        
        Ok(decision)
    }
    
    fn parse_response(&self, response: &str) -> Result<RouteDecision, RoutingError> {
        // 解析 JSON 响应
        let parsed = serde_json::from_str::<LlmRouteResponse>(response)?;
        Ok(parsed.into())
    }
}
```

### 3.2 新增 prompt.rs

```rust
pub struct RoutePromptTemplate {
    system_prompt: String,
    available_agents: Vec<AgentInfo>,
}

impl RoutePromptTemplate {
    pub fn new(available_agents: Vec<AgentInfo>) -> Self {
        Self {
            system_prompt: Self::default_system_prompt(),
            available_agents,
        }
    }
    
    fn default_system_prompt() -> String {
        r#"你是一个意图路由专家。根据用户消息，选择最合适的Agent。
        
可用的Agents:
{agents_list}

请返回JSON格式的路由决策：
{
    "agent_id": "选择的Agent ID",
    "reason": "选择理由",
    "confidence": 0.0-1.0的置信度
}

规则:
1. 如果消息涉及多个领域，选择主要意图
2. 如果不确定，选择置信度较低的选项
3. 只返回JSON，不要其他内容"#.to_string()
    }
    
    pub fn build_prompt(&self, context: &RoutingContext) -> LlmRequest {
        let agents_list = self.available_agents
            .iter()
            .map(|a| format!("- {}: {}", a.id, a.description))
            .collect::<Vec<_>>()
            .join("\n");
        
        let user_message = format!(
            "用户消息: {}\n\n请选择最合适的Agent并返回JSON。",
            context.user_message
        );
        
        LlmRequest {
            messages: vec![
                Message::system(&self.system_prompt.replace("{agents_list}", &agents_list)),
                Message::user(&user_message),
            ],
            ..Default::default()
        }
    }
}
```

## 4. 数据流变化

```
用户消息
    │
    ▼
RoutingContext
    │
    ▼
LlmGuidedRouter::route()
    │
    ▼
RoutePromptTemplate::build_prompt()
    │
    ▼
LlmProvider::complete()
    │
    ▼
parse_response()
    │
    ├─ confidence >= threshold → RouteDecision
    │
    └─ confidence < threshold → fallback_route()
            │
            ▼
        RuleBasedRouter::route()
```

## 5. 向后兼容性

- 新增 LlmGuidedRouter，默认禁用
- 置信度低于阈值时自动回退
- 不影响现有路由逻辑
