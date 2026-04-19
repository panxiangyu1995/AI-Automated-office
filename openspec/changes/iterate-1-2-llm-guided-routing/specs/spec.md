# 详细规格 - LLM引导路由实现

## 1. 类型定义

### 1.1 AgentInfo

```rust
/// Agent 信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    /// Agent ID
    pub id: String,
    /// Agent 名称
    pub name: String,
    /// Agent 描述
    pub description: String,
    /// 适用场景
    pub scenarios: Vec<String>,
    /// 优先级
    pub priority: i32,
}

impl AgentInfo {
    pub fn new(id: &str, name: &str, description: &str) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            description: description.to_string(),
            scenarios: Vec::new(),
            priority: 0,
        }
    }
}
```

### 1.2 RoutePromptTemplate

```rust
/// 路由提示词模板
#[derive(Debug, Clone)]
pub struct RoutePromptTemplate {
    /// 系统提示词
    system_prompt: String,
    /// 可用 Agents
    available_agents: Vec<AgentInfo>,
}

impl RoutePromptTemplate {
    /// 创建新的模板
    pub fn new(available_agents: Vec<AgentInfo>) -> Self {
        Self {
            system_prompt: Self::default_system_prompt(),
            available_agents,
        }
    }
    
    /// 默认系统提示词
    fn default_system_prompt() -> String {
        r#"你是一个智能意图路由专家。根据用户消息，选择最合适的Agent来处理。

可用的Agents:
{agents_list}

请分析用户消息的意图，返回JSON格式的路由决策：
{
    "agent_id": "选择的Agent ID",
    "reason": "选择理由（简短的1-2句话）",
    "confidence": 0.0到1.0的置信度分数
}

分析规则:
1. 匹配Agent的适用场景
2. 考虑关键词匹配度
3. 跨领域请求选择主要意图
4. 置信度反映匹配确定性（高=明确匹配，低=模糊匹配）"#.to_string()
    }
    
    /// 构建提示词
    pub fn build_prompt(&self, context: &RoutingContext) -> ProviderChatRequest {
        let agents_list = self.available_agents
            .iter()
            .map(|a| format!(
                "- {}: {} (适用: {})",
                a.id,
                a.description,
                if a.scenarios.is_empty() {
                    "通用".to_string()
                } else {
                    a.scenarios.join(", ")
                }
            ))
            .collect::<Vec<_>>()
            .join("\n");
        
        let user_message = format!(
            "用户消息: {}\n\n请分析意图并返回JSON路由决策。",
            context.user_message
        );
        
        ProviderChatRequest {
            messages: vec![
                ProviderMessage::system(&self.system_prompt.replace("{agents_list}", &agents_list)),
                ProviderMessage::user(&user_message),
            ],
            tools: None,
            temperature: Some(0.3), // 低温度保证一致性
            max_tokens: Some(512),
            ..Default::default()
        }
    }
}
```

### 1.3 LlmRouteResponse

```rust
/// LLM 路由响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmRouteResponse {
    /// 选择的 Agent ID
    pub agent_id: String,
    /// 选择理由
    pub reason: String,
    /// 置信度 (0.0-1.0)
    pub confidence: f32,
}

impl LlmRouteResponse {
    pub fn validate(&self) -> Result<(), LlmRoutingError> {
        if self.agent_id.is_empty() {
            return Err(LlmRoutingError::InvalidAgentId);
        }
        if !(0.0..=1.0).contains(&self.confidence) {
            return Err(LlmRoutingError::InvalidConfidence(self.confidence));
        }
        Ok(())
    }
}

/// LLM 路由错误
#[derive(Debug, thiserror::Error)]
pub enum LlmRoutingError {
    #[error("Agent ID cannot be empty")]
    InvalidAgentId,
    
    #[error("Invalid confidence: {0}, must be between 0.0 and 1.0")]
    InvalidConfidence(f32),
    
    #[error("LLM provider error: {0}")]
    ProviderError(String),
    
    #[error("Failed to parse LLM response: {0}")]
    ParseError(String),
    
    #[error("No matching agent found: {0}")]
    NoMatchingAgent(String),
}
```

### 1.4 LlmGuidedRouter

```rust
/// LLM 引导路由器
pub struct LlmGuidedRouter {
    /// LLM Provider
    llm_provider: Arc<dyn LlmProvider>,
    /// 提示词模板
    prompt_template: RoutePromptTemplate,
    /// 置信度阈值
    confidence_threshold: f32,
    /// 启用回退
    fallback_enabled: bool,
}

impl LlmGuidedRouter {
    /// 创建新的 LLM 引导路由器
    pub fn new(
        llm_provider: Arc<dyn LlmProvider>,
        available_agents: Vec<AgentInfo>,
        confidence_threshold: f32,
    ) -> Self {
        Self {
            llm_provider,
            prompt_template: RoutePromptTemplate::new(available_agents),
            confidence_threshold,
            fallback_enabled: true,
        }
    }
    
    /// 执行路由决策
    pub async fn route(
        &self,
        context: &RoutingContext,
        fallback: impl Fn(&RoutingContext) -> RoutingResult,
    ) -> Result<RoutingResult, LlmRoutingError> {
        // 构建提示词
        let request = self.prompt_template.build_prompt(context);
        
        // 调用 LLM
        let response = self.llm_provider
            .complete(request)
            .await
            .map_err(|e| LlmRoutingError::ProviderError(e.to_string()))?;
        
        // 解析响应
        let route_response = self.parse_response(&response)?;
        
        // 验证响应
        route_response.validate()?;
        
        // 检查置信度
        if route_response.confidence < self.confidence_threshold && self.fallback_enabled {
            // 回退到规则匹配
            return Ok(fallback(context));
        }
        
        // 构建路由结果
        self.build_result(&route_response, context)
    }
    
    /// 解析 LLM 响应
    fn parse_response(&self, response: &str) -> Result<LlmRouteResponse, LlmRoutingError> {
        // 尝试提取 JSON
        let json_str = Self::extract_json(response)?;
        
        serde_json::from_str(&json_str)
            .map_err(|e| LlmRoutingError::ParseError(e.to_string()))
    }
    
    /// 从响应中提取 JSON
    fn extract_json(response: &str) -> Result<String, LlmRoutingError> {
        // 尝试直接解析
        if let Ok(json) = serde_json::from_str::<serde_json::Value>(response) {
            return Ok(response.to_string());
        }
        
        // 尝试提取 ```json ... ``` 块
        if let Some(start) = response.find("```json") {
            let start = start + 7;
            if let Some(end) = response[start..].find("```") {
                return Ok(response[start..start + end].trim().to_string());
            }
        }
        
        // 尝试提取 { ... } 块
        if let Some(start) = response.find('{') {
            if let Some(end) = response[start..].find('}') {
                return Ok(response[start..=start + end].to_string());
            }
        }
        
        Err(LlmRoutingError::ParseError("No JSON found in response".to_string()))
    }
    
    /// 构建路由结果
    fn build_result(
        &self,
        response: &LlmRouteResponse,
        context: &RoutingContext,
    ) -> Result<RoutingResult, LlmRoutingError> {
        // 查找对应的 Agent
        let agent = self.prompt_template.available_agents
            .iter()
            .find(|a| a.id == response.agent_id)
            .ok_or_else(|| LlmRoutingError::NoMatchingAgent(response.agent_id.clone()))?;
        
        Ok(RoutingResult {
            decision: RoutingDecision {
                id: format!("llm_route_{}", uuid::Uuid::new_v4()),
                timestamp: chrono::Utc::now().timestamp(),
                input_preview: context.user_message.chars().take(50).collect(),
                matched_rule_id: None,
                matched_rule_name: None,
                selected_sub_agent_id: Some(agent.id.clone()),
                selected_sub_agent_name: Some(agent.name.clone()),
                routing_mode: RoutingMode::Auto,
                confidence: Some(ConfidenceLevel::from(response.confidence)),
                confidence_score: Some(response.confidence),
                reasoning: Some(response.reason.clone()),
                accepted: None,
            },
            sub_agent_context: Some(SubAgentExecutionContext {
                sub_agent_id: agent.id.clone(),
                sub_agent_name: agent.name.clone(),
                session_id: context.session_id.clone(),
                trace_id: context.trace_id.clone(),
                original_input: context.user_message.clone(),
                routing_context: HashMap::new(),
                constraints: SubAgentConstraints::default(),
            }),
            outcome_record: RoutingOutcome {
                id: format!("outcome_{}", uuid::Uuid::new_v4()),
                trace_id: context.trace_id.clone(),
                session_id: context.session_id.clone(),
                decision_id: String::new(),
                rule_id: None,
                sub_agent_id: Some(agent.id.clone()),
                routing_mode: RoutingMode::Auto,
                confidence: Some(response.confidence),
                accepted: None,
                created_at: chrono::Utc::now().timestamp(),
            },
        })
    }
}

impl ConfidenceLevel {
    pub fn from(score: f32) -> Self {
        if score >= 0.8 {
            ConfidenceLevel::High
        } else if score >= 0.5 {
            ConfidenceLevel::Medium
        } else {
            ConfidenceLevel::Low
        }
    }
}
```

## 2. 接口规格

### 2.1 RouteStrategy

```rust
/// 路由策略
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RouteStrategy {
    /// 仅规则路由
    RuleBased,
    /// 仅 LLM 路由
    LlmGuided,
    /// 混合：优先 LLM，失败回退规则
    Hybrid,
    /// 自动选择（根据置信度）
    Auto,
}
```

### 2.2 IntentRouter 修改

```rust
impl IntentRouter {
    /// 使用 LLM 引导路由器创建
    pub fn with_llm_router(
        mut self,
        llm_provider: Arc<dyn LlmProvider>,
        confidence_threshold: f32,
    ) -> Self {
        let available_agents = self.collect_available_agents();
        self.llm_router = Some(Arc::new(LlmGuidedRouter::new(
            llm_provider,
            available_agents,
            confidence_threshold,
        )));
        self
    }
    
    /// 执行路由
    pub async fn route(&self, context: &RoutingContext) -> Result<RoutingResult, RoutingError> {
        match self.strategy {
            RouteStrategy::RuleBased => self.rule_based_route(context).await,
            RouteStrategy::LlmGuided => self.llm_guided_route(context).await,
            RouteStrategy::Hybrid => self.hybrid_route(context).await,
            RouteStrategy::Auto => self.auto_route(context).await,
        }
    }
    
    /// LLM 引导路由
    async fn llm_guided_route(&self, context: &RoutingContext) -> Result<RoutingResult, RoutingError> {
        let llm_router = self.llm_router
            .as_ref()
            .ok_or(RoutingError::LlmRouterNotConfigured)?;
        
        llm_router
            .route(context, |ctx| self.rule_based_route_sync(ctx))
            .await
            .map_err(RoutingError::LlmRoutingError)
    }
    
    /// 混合路由：优先 LLM，失败回退规则
    async fn hybrid_route(&self, context: &RoutingContext) -> Result<RoutingResult, RoutingError> {
        // 先尝试 LLM 路由
        if let Some(llm_router) = &self.llm_router {
            match llm_router
                .route(context, |ctx| self.rule_based_route_sync(ctx))
                .await
            {
                Ok(result) => return Ok(result),
                Err(e) => {
                    tracing::warn!("LLM routing failed, falling back to rule-based: {}", e);
                }
            }
        }
        
        // 回退到规则路由
        self.rule_based_route(context).await
    }
}
```

## 3. 验收标准

### 3.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1 | LLM 引导路由返回正确结果 | 单元测试 |
| AC2 | 置信度低于阈值时回退 | 单元测试 |
| AC3 | 正确解析 LLM JSON 响应 | 单元测试 |
| AC4 | Agent ID 有效时返回结果 | 集成测试 |
| AC5 | Agent ID 无效时返回错误 | 错误处理测试 |

### 3.2 性能验收

| ID | 验收标准 | 目标 |
|----|----------|------|
| PC1 | LLM 路由延迟 < 2s | 通过 |

### 3.3 准确性验收

| ID | 验收标准 | 目标 |
|----|----------|------|
| AC6 | LLM 路由决策与规则路由一致率 > 70% | 集成测试 |

## 4. 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| LLM 不可用 | 回退到规则路由 |
| JSON 解析失败 | 回退到规则路由 |
| Agent ID 无效 | 返回错误 |
| 置信度低于阈值 | 回退到规则路由 |
