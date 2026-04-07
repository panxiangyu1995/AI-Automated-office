# Design: SubAgent完整集成

## 技术架构

### 1. 意图路由中间件

```
User Input → AgentOrchestrator → IntentClassifier → [RouteDecision]
                                                    ↓
                                            SubAgentRoutingService
                                                    ↓
                                      [DelegationContext] → SubAgentExecutor
```

### 2. 核心组件

#### 2.1 IntentClassifier
- 负责分析用户输入，判断是否需要委派
- 支持关键词匹配和语义匹配
- 返回 `IntentClassification` 结果

#### 2.2 SubAgentRoutingService
- 管理路由规则
- 选择最匹配的 SubAgent
- 生成委派上下文

#### 2.3 DelegationExecutor
- 执行 SubAgent 委派
- 管理超时和错误处理
- 收集执行结果

### 3. 权限继承/收缩机制

```
主Agent权限
    ↓
应用收缩规则 → SubAgentConstraints
    ↓
SubAgent执行环境
```

**收缩规则**：
- 工具权限：主 Agent 允许的工具列表 ∩ SubAgent 声明的工具
- 数据权限：仅允许访问 SubAgent 绑定的数据范围
- 时间限制：委派操作设置最大执行时间

## 实现细节

### 1. 路由中间件集成

在 `AgentOrchestrator::execute_with_events` 中添加路由检查：

```rust
async fn execute_with_events(
    &self,
    request: AgentExecutionRequest,
    mut emitter: Option<&mut RuntimeEventEmitter>,
) -> AgentResult<AgentExecutionResponse> {
    // 原有逻辑...
    
    // 新增：检查是否需要路由
    if let Some(route_decision) = self.check_routing(&request.message).await? {
        if route_decision.should_delegate() {
            return self.delegate_to_subagent(route_decision, request, emitter).await;
        }
    }
    
    // 继续主 Agent 执行
    // ...
}
```

### 2. 委派执行流程

```rust
pub async fn delegate_to_subagent(
    &self,
    decision: RouteDecision,
    request: AgentExecutionRequest,
    emitter: Option<&mut RuntimeEventEmitter>,
) -> AgentResult<AgentExecutionResponse> {
    // 1. 获取 SubAgent 配置
    let subagent_config = self.subagent_manager.get(&decision.subagent_id).await?;
    
    // 2. 应用权限收缩
    let constraints = self.apply_permission_shrinkage(
        &self.current_permissions,
        &subagent_config.constraints
    );
    
    // 3. 创建委派上下文
    let context = DelegationContext {
        subagent_id: decision.subagent_id.clone(),
        original_input: request.message.clone(),
        constraints,
        timeout: subagent_config.timeout_seconds,
    };
    
    // 4. 执行委派
    let result = self.delegation_executor.execute(context).await?;
    
    // 5. 记录路由结果
    self.routing_service.record_outcome(&decision, &result).await;
    
    Ok(result)
}
```

### 3. 权限收缩规则

```rust
fn apply_permission_shrinkage(
    agent_perms: &PermissionSet,
    subagent_perms: &PermissionSet,
) -> PermissionSet {
    PermissionSet {
        allowed_tools: agent_perms.allowed_tools.intersection(&subagent_perms.allowed_tools),
        denied_tools: subagent_perms.denied_tools.union(&agent_perms.denied_tools),
        max_execution_time: min(agent_perms.max_execution_time, subagent_perms.max_execution_time),
        data_scope: subagent_perms.data_scope.clone(),
    }
}
```

## 前端组件

### SubAgentConfig.tsx
- SubAgent 列表展示
- 配置编辑对话框
- 启用/禁用开关

### SubAgentDelegatePanel.tsx
- 当前委派状态显示
- 委派历史记录
- 手动委派触发按钮

## API 设计

### Tauri 命令

```rust
// 触发路由决策
#[tauri::command]
pub async fn route_message(message: String) -> Result<RouteDecision, String>;

// 执行委派
#[tauri::command]
pub async fn delegate_to_subagent(
    subagent_id: String,
    message: String,
) -> Result<DelegationResult, String>;

// 获取路由历史
#[tauri::command]
pub async fn get_routing_history(limit: Option<usize>) -> Result<Vec<RoutingOutcome>, String>;
```

## 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 路由无匹配 | 回退到主 Agent 执行 |
| SubAgent 超时 | 返回超时错误，提供重试选项 |
| SubAgent 执行失败 | 记录错误，回退到主 Agent |
| 权限不足 | 返回权限错误，拒绝委派 |
