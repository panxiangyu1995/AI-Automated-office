# Design: 意图路由引擎

## 1. 意图分类器

```rust
/// 意图分类器
pub struct IntentClassifier {
    keyword_rules: Vec<KeywordRule>,
    model_client: Arc<dyn LlmClient>,
}

impl IntentClassifier {
    /// 分类用户意图
    pub async fn classify(
        &self,
        message: &str,
        context: &UserContext,
    ) -> Result<IntentResult, ClassificationError> {
        // 1. 关键词匹配
        if let Some(keyword_result) = self.keyword_match(message) {
            return Ok(keyword_result);
        }
        
        // 2. 语义分类（使用 LLM）
        self.semantic_classify(message, context).await
    }
    
    /// 关键词匹配
    fn keyword_match(&self, message: &str) -> Option<IntentResult> {
        for rule in &self.keyword_rules {
            if rule.matches(message) {
                return Some(IntentResult {
                    intent: rule.intent.clone(),
                    sub_intent: rule.sub_intent.clone(),
                    confidence: 0.9,
                    suggested_tools: rule.tools.clone(),
                    requires_subagent: rule.requires_subagent,
                });
            }
        }
        None
    }
}

/// 关键词规则
pub struct KeywordRule {
    pub keywords: Vec<String>,
    pub intent: String,
    pub sub_intent: Option<String>,
    pub tools: Vec<String>,
    pub requires_subagent: bool,
}

/// 意图分类结果
pub struct IntentResult {
    pub intent: String,
    pub sub_intent: Option<String>,
    pub confidence: f32,
    pub suggested_tools: Vec<String>,
    pub requires_subagent: bool,
}
```

## 2. 路由决策器

```rust
/// 路由决策器
pub struct Router {
    subagent_manager: Arc<SubagentManager>,
    permission_engine: Arc<PermissionEngine>,
}

impl Router {
    /// 路由决策
    pub async fn route(
        &self,
        intent: &IntentResult,
        context: &ExecutionContext,
    ) -> Result<RouteDecision, RoutingError> {
        // 1. 查找目标 Subagent
        let target = self.find_target_subagent(intent).await?;
        
        // 2. 检查权限
        if !self.has_permission(context, &target) {
            return Err(RoutingError::PermissionDenied(target.name.clone()));
        }
        
        // 3. 选择模型
        let model = self.select_model(intent, &target);
        
        // 4. 构建委派约束
        let constraints = self.build_constraints(intent, &target, context);
        
        Ok(RouteDecision {
            target,
            model,
            constraints,
        })
    }
}

/// 路由决策
pub struct RouteDecision {
    pub target: AgentConfig,
    pub model: ModelProvider,
    pub constraints: DelegationConstraints,
}
```

## 3. 委派执行器

```rust
/// 委派执行器
pub struct DelegationExecutor {
    runtime: Arc<AgentRuntime>,
    timeout: Duration,
}

impl DelegationExecutor {
    /// 执行委派
    pub async fn execute(
        &self,
        decision: RouteDecision,
        context: &DelegationContext,
    ) -> Result<SubagentResult, ExecutionError> {
        // 1. 构建委派协议
        let contract = DelegationContract {
            target: DelegationTarget {
                subagent: decision.target.name.clone(),
                intent: context.intent.clone(),
            },
            constraints: decision.constraints,
            context: context.clone(),
            output: OutputContract {
                format: OutputFormat::Text,
                schema: None,
            },
        };
        
        // 2. 创建子会话
        let session = self.create_subagent_session(&decision.target, &contract).await?;
        
        // 3. 执行并等待结果
        let result = self.execute_with_timeout(session, self.timeout).await?;
        
        // 4. 清理会话
        self.cleanup_session(session).await;
        
        Ok(result)
    }
}
```

## 4. 路由规则表

| 用户意图 | 路由目标 | 模型 | 权限要求 |
|----------|---------|------|----------|
| finance.ocr | finance (light) | Haiku | finance_ocr |
| finance.query | finance | Sonnet | finance_query |
| finance.report | finance | Sonnet | finance_aggregate |
| sales.order | sales | Sonnet | sales_query |
| hr.onboard | hr | Sonnet | hr_mutate |
| cross.department | orchestrator | Sonnet | task |
| general.query | primary | Sonnet | read |
