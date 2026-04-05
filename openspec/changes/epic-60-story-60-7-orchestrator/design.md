# Design: Orchestrator 跨部门编排

## 1. Orchestrator Agent 配置

```rust
/// Orchestrator Agent 配置
pub struct OrchestratorConfig {
    pub name: String,           // "orchestrator"
    pub display_name: String,    // "编排助手"
    pub models: ModelConfig,
}

impl Default for OrchestratorConfig {
    fn default() -> Self {
        Self {
            name: "orchestrator".to_string(),
            display_name: "编排助手".to_string(),
            models: ModelConfig {
                primary: ModelProvider {
                    provider: "anthropic".to_string(),
                    model_id: "claude-sonnet-4-5".to_string(),
                    temperature: 0.7,
                    max_tokens: 8192,
                },
                light: None,
                small: None,
            },
        }
    }
}

/// Orchestrator 权限配置
pub struct OrchestratorPermissions {
    pub allowed_tools: Vec<String>,
    pub denied_tools: Vec<String>,
}

impl Default for OrchestratorPermissions {
    fn default() -> Self {
        Self {
            // 只允许读取和委派
            allowed_tools: vec![
                "read".to_string(),
                "grep".to_string(),
                "glob".to_string(),
                "list".to_string(),
                "web_search".to_string(),
                "web_fetch".to_string(),
                "question".to_string(),
                "task".to_string(),  // 核心：委派给 Subagent
            ],
            // 强制禁止写操作
            denied_tools: vec![
                "write".to_string(),
                "edit".to_string(),
                "bash".to_string(),
                "hr_mutate".to_string(),
                "sales_mutate".to_string(),
                "finance_mutate".to_string(),
                "warehouse_mutate".to_string(),
            ],
        }
    }
}
```

## 2. 编排引擎

```rust
/// 编排引擎
pub struct OrchestrationEngine {
    subagent_manager: Arc<SubagentManager>,
    delegation_executor: Arc<DelegationExecutor>,
    max_parallel: u32,
    max_depth: u32,
}

/// 编排任务
pub struct OrchestrationTask {
    /// 用户请求
    pub request: String,
    /// 需要的部门
    pub departments: Vec<Department>,
    /// 编排模式
    pub mode: OrchestrationMode,
    /// 超时时间
    pub timeout: Duration,
}

/// 编排模式
pub enum OrchestrationMode {
    /// 并行模式：同时调用多个 Subagent
    Parallel,
    /// 顺序模式：按依赖顺序执行
    Sequential,
    /// 自适应模式：根据任务自动选择
    Adaptive,
}

/// 编排结果
pub struct OrchestrationResult {
    /// 各 Subagent 的结果
    pub results: Vec<SubagentResult>,
    /// 聚合后的结果
    pub aggregated: AggregatedResult,
    /// 执行时间
    pub elapsed_ms: u64,
    /// 执行的步骤
    pub steps: Vec<ExecutionStep>,
}

/// 执行步骤
pub struct ExecutionStep {
    pub step_number: u32,
    pub subagent: String,
    pub status: StepStatus,
    pub started_at: DateTime,
    pub completed_at: Option<DateTime>,
    pub result: Option<SubagentResult>,
}

pub enum StepStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Skipped,
}
```

## 3. 并行编排

```rust
impl OrchestrationEngine {
    /// 并行编排
    pub async fn execute_parallel(
        &self,
        task: &OrchestrationTask,
    ) -> Result<OrchestrationResult, OrchestrationError> {
        let start_time = Instant::now();
        
        // 1. 分析任务，分解为子任务
        let sub_tasks = self.decompose_task(task).await?;
        
        // 2. 创建委派任务
        let delegations = self.create_delegations(&sub_tasks).await?;
        
        // 3. 并行执行
        let results = self.execute_all(delegations).await?;
        
        // 4. 聚合结果
        let aggregated = self.aggregate_results(results).await?;
        
        Ok(OrchestrationResult {
            results: results.clone(),
            aggregated,
            elapsed_ms: start_time.elapsed().as_millis() as u64,
            steps: vec![],
        })
    }
    
    /// 执行所有委派
    async fn execute_all(
        &self,
        delegations: Vec<Delegation>,
    ) -> Result<Vec<SubagentResult>, OrchestrationError> {
        // 使用信号量控制并发数
        let semaphore = Arc::new(Semaphore::new(self.max_parallel as usize));
        
        let futures = delegations.into_iter().map(|delegation| {
            let sem = semaphore.clone();
            async move {
                let _permit = sem.acquire().await.unwrap();
                self.delegation_executor.execute(delegation).await
            }
        });
        
        let results = futures::future::join_all(futures).await;
        
        // 处理结果
        results.into_iter().collect()
    }
}
```

## 4. 顺序编排

```rust
impl OrchestrationEngine {
    /// 顺序编排
    pub async fn execute_sequential(
        &self,
        task: &OrchestrationTask,
    ) -> Result<OrchestrationResult, OrchestrationError> {
        let start_time = Instant::now();
        let mut all_results = Vec::new();
        let mut steps = Vec::new();
        
        // 1. 分析任务，确定执行顺序
        let execution_plan = self.create_execution_plan(task).await?;
        
        // 2. 按顺序执行
        for (step_num, step) in execution_plan.steps.iter().enumerate() {
            let step_result = self.execute_step(step_num, step, &all_results).await?;
            
            all_results.push(step_result.clone());
            steps.push(ExecutionStep {
                step_number: step_num as u32,
                subagent: step.target.clone(),
                status: StepStatus::Completed,
                started_at: step.started_at,
                completed_at: Some(now()),
                result: Some(step_result),
            });
        }
        
        // 3. 聚合结果
        let aggregated = self.aggregate_results(all_results).await?;
        
        Ok(OrchestrationResult {
            results: all_results,
            aggregated,
            elapsed_ms: start_time.elapsed().as_millis() as u64,
            steps,
        })
    }
}
```

## 5. 结果聚合

```rust
/// 结果聚合器
pub struct ResultAggregator {
    aggregation_strategies: HashMap<String, AggregationStrategy>,
}

impl ResultAggregator {
    /// 聚合结果
    pub async fn aggregate(
        &self,
        results: Vec<SubagentResult>,
    ) -> Result<AggregatedResult, AggregationError> {
        // 1. 分类结果
        let by_type = self.categorize_results(&results)?;
        
        // 2. 合并文本结果
        let text = self.merge_text_results(&results);
        
        // 3. 合并结构化数据
        let structured = self.merge_structured_data(&results)?;
        
        // 4. 生成摘要
        let summary = self.generate_summary(&results).await?;
        
        Ok(AggregatedResult {
            text,
            structured,
            summary,
            metadata: AggregationMetadata {
                total_results: results.len(),
                successful: results.iter().filter(|r| r.status == ResultStatus::Success).count(),
                failed: results.iter().filter(|r| r.status == ResultStatus::Failure).count(),
            },
        })
    }
}

/// 聚合后的结果
pub struct AggregatedResult {
    /// 文本结果
    pub text: String,
    /// 结构化数据
    pub structured: Option<serde_json::Value>,
    /// 摘要
    pub summary: String,
    /// 元数据
    pub metadata: AggregationMetadata,
}

pub struct AggregationMetadata {
    pub total_results: usize,
    pub successful: usize,
    pub failed: usize,
}
```

## 6. 协作流程示例

```
用户请求："帮我分析一下上个月各部门的费用支出情况"

     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Orchestrator                                                        │
│  意图分类：cross.department.query                                   │
│  编排决策：parallel                                                │
│  权限检查：用户 = 财务经理 → 可访问所有部门费用数据                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ 并行委派
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ finance_agent │  │  sales_agent │  │    hr_agent   │
│ ─────────────│  │ ─────────────│  │ ─────────────│
│ 工具: aggregate│  │ 工具: aggregate│  │ 工具: aggregate│
│ 部门: finance │  │ 部门: sales  │  │ 部门: hr     │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ 费用: ¥45.6万 │  │ 差旅: ¥12.3万 │  │ 人力: ¥89.5万 │
│ 同比增长 8%   │  │ 同比下降 5%   │  │ 同比增长 3%   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                  │                  │
        └──────────────────┴──────────────────┘
                                    │
                                    ▼
                         ┌───────────────────┐
                         │   结果聚合器        │
                         │ ──────────────────│
                         │ • 文本合并          │
                         │ • 结构化数据合并    │
                         │ • 生成摘要          │
                         └─────────┬───────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ## 上月各部门费用分析                                             │
│                                                                       │
│  | 部门  | 费用    | 占比  | 同比   |                             │
│  |------|---------|-------|---------|                              │
│  | HR   | ¥89.5万 | 60%   | +3%    |                              │
│  | 财务  | ¥45.6万 | 31%   | +8%    |                              │
│  | 销售  | ¥12.3万 |  8%   | -5%    |                              │
│  | **总计** | **¥147.4万** | 100% | +2%  |                          │
│                                                                       │
│  建议：销售差旅费用控制良好，可关注财务部门的增长趋势                │
└─────────────────────────────────────────────────────────────────────┘
```
