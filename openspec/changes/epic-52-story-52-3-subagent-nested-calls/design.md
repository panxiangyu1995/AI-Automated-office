# Design: Sub-Agent嵌套调用控制

## 技术方案

### 实现类型
- **类型**: new（新功能开发）
- **优先级**: high
- **阶段**: Phase 2 - Sub-Agent运行时实现
- **实现方式**: 前后端协同，前端定义类型接口，后端实现核心逻辑

### API设计

#### 前端类型定义

```typescript
// src/features/agent/types/subagent-nested.types.ts

/**
 * 嵌套调用请求
 */
export interface NestedCallRequest {
  /** 父上下文ID */
  parentContextId: string;
  /** 要调用的Sub-Agent ID */
  subAgentId: string;
  /** 调用参数 */
  parameters: Record<string, unknown>;
  /** 超时时间（毫秒），覆盖默认值 */
  timeoutMs?: number;
}

/**
 * 嵌套调用响应
 */
export interface NestedCallResponse {
  /** 调用ID */
  callId: string;
  /** 关联的上下文ID */
  contextId: string;
  /** 调用状态 */
  status: NestedCallStatus;
  /** 调用结果 */
  result?: unknown;
  /** 错误信息 */
  error?: NestedCallError;
  /** 调用链路数据 */
  callChain: CallChainData;
}

/**
 * 嵌套调用状态
 */
export enum NestedCallStatus {
  Pending = 'pending',         // 待执行
  Running = 'running',         // 执行中
  Completed = 'completed',      // 已完成
  Failed = 'failed',           // 失败
  Timeout = 'timeout',          // 超时
  CycleDetected = 'cycle_detected', // 检测到循环
  MaxDepthExceeded = 'max_depth_exceeded', // 超出最大深度
}

/**
 * 嵌套调用错误
 */
export interface NestedCallError {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: unknown;
}

/**
 * 调用链数据（用于前端展示）
 */
export interface CallChainData {
  /** 调用ID */
  callId: string;
  /** 根调用ID */
  rootCallId: string;
  /** 当前层级深度 */
  depth: number;
  /** 完整调用链路 */
  chain: CallChainNode[];
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 总耗时（毫秒） */
  durationMs?: number;
}

/**
 * 调用链节点
 */
export interface CallChainNode {
  /** 调用ID */
  callId: string;
  /** Sub-Agent ID */
  subAgentId: string;
  /** Sub-Agent名称 */
  subAgentName: string;
  /** 父调用ID */
  parentCallId?: string;
  /** 子调用ID列表 */
  childCallIds: string[];
  /** 层级深度 */
  depth: number;
  /** 状态 */
  status: NestedCallStatus;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
}

/**
 * 调用栈信息
 */
export interface CallStackInfo {
  /** 根上下文ID */
  rootContextId: string;
  /** 当前上下文ID */
  currentContextId: string;
  /** 当前深度 */
  currentDepth: number;
  /** 最大深度 */
  maxDepth: number;
  /** 调用栈链条 */
  stack: CallStackFrame[];
}

/**
 * 调用栈帧
 */
export interface CallStackFrame {
  /** 上下文ID */
  contextId: string;
  /** Sub-Agent ID */
  subAgentId: string;
  /** 调用时间 */
  callTime: number;
  /** 是否完成 */
  completed: boolean;
}

/**
 * 超时配置
 */
export interface TimeoutConfig {
  /** 层级默认超时（毫秒） */
  defaultTimeoutPerLevel: number;
  /** 每层级超时递增（毫秒） */
  timeoutIncrementPerLevel: number;
  /** 最大超时时间（毫秒） */
  maxTimeout: number;
}
```

#### Rust后端接口

```rust
// src-tauri/src/agent/subagent/commands.rs (扩展)

use serde::{Deserialize, Serialize};
use tauri::command;

/// 嵌套调用请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NestedCallRequest {
    pub parent_context_id: String,
    pub sub_agent_id: String,
    pub parameters: serde_json::Value,
    #[serde(default)]
    pub timeout_ms: Option<u64>,
}

/// 嵌套调用响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NestedCallResponse {
    pub call_id: String,
    pub context_id: String,
    pub status: NestedCallStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<NestedCallError>,
    pub call_chain: CallChainData,
}

/// 调用链数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallChainData {
    pub call_id: String,
    pub root_call_id: String,
    pub depth: u32,
    pub chain: Vec<CallChainNode>,
    pub start_time: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration_ms: Option<u64>,
}

/// 调用链节点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallChainNode {
    pub call_id: String,
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent_call_id: Option<String>,
    pub child_call_ids: Vec<String>,
    pub depth: u32,
    pub status: NestedCallStatus,
    pub start_time: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<i64>,
}

/// 嵌套调用状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NestedCallStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Timeout,
    CycleDetected,
    MaxDepthExceeded,
}

/// 嵌套调用错误
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NestedCallError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

/// 执行嵌套调用
#[command]
pub async fn execute_nested_call(
    request: NestedCallRequest,
) -> Result<NestedCallResponse, String> {
    // 实现逻辑
}

/// 获取调用栈信息
#[command]
pub async fn get_call_stack_info(
    context_id: String,
) -> Result<CallStackInfo, String> {
    // 实现逻辑
}

/// 获取调用链路数据
#[command]
pub async fn get_call_chain(
    call_id: String,
) -> Result<CallChainData, String> {
    // 实现逻辑
}

/// 取消嵌套调用
#[command]
pub async fn cancel_nested_call(
    call_id: String,
) -> Result<(), String> {
    // 实现逻辑
}
```

### 模块结构

```
src-tauri/src/agent/
├── mod.rs                          # Agent模块入口
├── subagent/
│   ├── mod.rs                      # SubAgent子模块入口
│   ├── context.rs                  # SubAgentExecutionContext（扩展嵌套深度）
│   ├── nested.rs                   # 嵌套调用控制器（新增）
│   ├── call_stack.rs               # 调用栈追踪（新增）
│   └── cycle_detector.rs           # 循环检测（新增）
```

### 技术方案详解

#### 1. 嵌套调用控制器

```rust
// src-tauri/src/agent/subagent/nested.rs

/// 常量：最大嵌套深度
const MAX_NESTING_DEPTH: u32 = 3;

/// 嵌套调用控制器
pub struct NestedCallController {
    /// 根调用ID -> 调用信息映射
    calls: RwLock<HashMap<String, NestedCallInfo>>,
    /// 循环检测器
    cycle_detector: CycleDetector,
    /// 超时配置
    timeout_config: TimeoutConfig,
}

/// 嵌套调用信息
pub struct NestedCallInfo {
    pub call_id: String,
    pub root_call_id: String,
    pub parent_call_id: Option<String>,
    pub context_id: String,
    pub sub_agent_id: String,
    pub depth: u32,
    pub status: NestedCallStatus,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub child_calls: Vec<String>,
}

impl NestedCallController {
    /// 执行嵌套调用
    pub async fn execute_nested_call(
        &self,
        request: NestedCallRequest,
    ) -> Result<NestedCallResponse, NestedCallError> {
        // 1. 获取父上下文
        let parent_context = self.get_parent_context(&request.parent_context_id)?;

        // 2. 检查嵌套深度
        if parent_context.nesting_depth >= MAX_NESTING_DEPTH {
            return Err(NestedCallError {
                code: "MAX_DEPTH_EXCEEDED".into(),
                message: format!(
                    "Maximum nesting depth {} exceeded",
                    MAX_NESTING_DEPTH
                ),
                details: Some(serde_json::json!({
                    "current_depth": parent_context.nesting_depth,
                    "max_depth": MAX_NESTING_DEPTH
                })),
            });
        }

        // 3. 检测循环调用
        if self.cycle_detector.would_create_cycle(
            &parent_context.id,
            &request.sub_agent_id,
        ) {
            return Err(NestedCallError {
                code: "CYCLE_DETECTED".into(),
                message: "Cycle detected in sub-agent call chain".into(),
                details: None,
            });
        }

        // 4. 创建新上下文
        let child_context = self.create_child_context(&parent_context, &request)?;

        // 5. 计算超时时间
        let timeout = self.calculate_timeout(parent_context.nesting_depth, request.timeout_ms);

        // 6. 执行调用（带超时控制）
        let result = self.execute_with_timeout(child_context, timeout).await;

        // 7. 构建响应
        self.build_response(request, result).await
    }

    /// 计算超时时间
    fn calculate_timeout(
        &self,
        current_depth: u32,
        override_timeout: Option<u64>,
    ) -> u64 {
        if let Some(timeout) = override_timeout {
            return timeout.min(self.timeout_config.max_timeout);
        }

        let calculated = self.timeout_config.default_timeout_per_level
            + (current_depth * self.timeout_config.timeout_increment_per_level);

        calculated.min(self.timeout_config.max_timeout)
    }

    /// 执行带超时的调用
    async fn execute_with_timeout(
        &self,
        context: SubAgentExecutionContext,
        timeout_ms: u64,
    ) -> Result<serde_json::Value, NestedCallError> {
        tokio::time::timeout(
            Duration::from_millis(timeout_ms),
            self.execute_call(context),
        )
        .await
        .map_err(|_| NestedCallError {
            code: "TIMEOUT".into(),
            message: format!("Call timed out after {}ms", timeout_ms),
            details: None,
        })?
    }
}
```

#### 2. 调用栈追踪

```rust
// src-tauri/src/agent/subagent/call_stack.rs

/// 调用栈追踪器
pub struct CallStackTracker {
    /// 根上下文ID -> 调用栈
    stacks: RwLock<HashMap<String, CallStack>>,
}

/// 调用栈
#[derive(Debug, Clone)]
pub struct CallStack {
    pub root_context_id: String,
    pub frames: Vec<CallStackFrame>,
    pub max_depth: u32,
}

#[derive(Debug, Clone)]
pub struct CallStackFrame {
    pub context_id: String,
    pub call_id: String,
    pub sub_agent_id: String,
    pub call_time: DateTime<Utc>,
    pub completed: bool,
}

impl CallStackTracker {
    /// 推送调用栈帧
    pub async fn push_frame(
        &self,
        root_context_id: &str,
        frame: CallStackFrame,
    ) -> Result<(), CallStackError> {
        let mut stacks = self.stacks.write().await;

        let stack = stacks
            .entry(root_context_id.to_string())
            .or_insert_with(|| CallStack {
                root_context_id: root_context_id.to_string(),
                frames: Vec::new(),
                max_depth: 0,
            });

        // 更新最大深度
        let current_depth = stack.frames.len() as u32;
        if current_depth > stack.max_depth {
            stack.max_depth = current_depth;
        }

        stack.frames.push(frame);

        Ok(())
    }

    /// 弹出调用栈帧
    pub async fn pop_frame(
        &self,
        root_context_id: &str,
        call_id: &str,
    ) -> Result<CallStackFrame, CallStackError> {
        let mut stacks = self.stacks.write().await;

        let stack = stacks
            .get_mut(root_context_id)
            .ok_or_else(|| CallStackError::StackNotFound)?;

        // 从栈顶弹出匹配的帧
        stack.frames
            .pop()
            .filter(|f| f.call_id == call_id)
            .ok_or_else(|| CallStackError::FrameNotFound)
    }

    /// 获取当前调用栈信息
    pub async fn get_stack_info(
        &self,
        root_context_id: &str,
    ) -> Result<CallStackInfo, CallStackError> {
        let stacks = self.stacks.read().await;

        let stack = stacks
            .get(root_context_id)
            .ok_or_else(|| CallStackError::StackNotFound)?;

        let frames = stack.frames.clone();
        let current_depth = frames.len() as u32;

        // 找到最后一个未完成的帧作为当前上下文
        let current_frame = frames.last().cloned();

        Ok(CallStackInfo {
            root_context_id: root_context_id.to_string(),
            current_context_id: current_frame.map(|f| f.context_id),
            current_depth,
            max_depth: stack.max_depth,
            stack: frames,
        })
    }

    /// 清理完成的调用栈
    pub async fn cleanup_completed(
        &self,
        root_context_id: &str,
    ) -> Result<(), CallStackError> {
        let mut stacks = self.stacks.write().await;

        if let Some(stack) = stacks.get_mut(root_context_id) {
            // 保留未完成的帧
            stack.frames.retain(|f| !f.completed);
        }

        Ok(())
    }
}
```

#### 3. 循环检测器

```rust
// src-tauri/src/agent/subagent/cycle_detector.rs

/// 循环检测器
pub struct CycleDetector {
    /// 调用图：Sub-Agent ID -> 被调用的Sub-Agent ID集合
    call_graph: RwLock<HashMap<String, HashSet<String>>>,
    /// 最大历史记录数
    max_history_size: usize,
}

impl CycleDetector {
    /// 检测是否会导致循环
    pub fn would_create_cycle(
        &self,
        caller_sub_agent_id: &str,
        callee_sub_agent_id: &str,
    ) -> bool {
        // 直接自调用检测
        if caller_sub_agent_id == callee_sub_agent_id {
            return true;
        }

        // 获取调用者的调用历史
        let history = self.get_call_history(caller_sub_agent_id);

        // 检查被调用者是否在调用链中（会导致循环）
        // A -> B -> C -> A 这种情况
        if history.contains(callee_sub_agent_id) {
            return true;
        }

        false
    }

    /// 记录一次调用
    pub async fn record_call(
        &self,
        caller_sub_agent_id: &str,
        callee_sub_agent_id: &str,
    ) {
        let mut graph = self.call_graph.write().await;

        let callers = graph
            .entry(caller_sub_agent_id.to_string())
            .or_insert_with(HashSet::new);

        callers.insert(callee_sub_agent_id.to_string());

        // 限制历史记录大小
        if callers.len() > self.max_history_size {
            // 保留最近的记录
            let to_remove: Vec<_> = callers
                .iter()
                .take(callers.len() - self.max_history_size)
                .cloned()
                .collect();
            for item in to_remove {
                callers.remove(&item);
            }
        }
    }

    /// 获取调用历史
    fn get_call_history(&self, sub_agent_id: &str) -> HashSet<String> {
        // 通过递归查找所有被当前Sub-Agent调用过的Sub-Agent
        let mut history = HashSet::new();
        self.collect_history(sub_agent_id, &mut history);
        history
    }

    /// 递归收集历史
    fn collect_history(&self, sub_agent_id: &str, history: &mut HashSet<String>) {
        let graph = self.call_graph.blocking_read();

        if let Some(callers) = graph.get(sub_agent_id) {
            for caller in callers {
                if history.insert(caller.clone()) {
                    self.collect_history(caller, history);
                }
            }
        }
    }

    /// 清除历史（当调用链完成后）
    pub async fn clear_history(&self, root_sub_agent_id: &str) {
        let mut graph = self.call_graph.write().await;
        graph.remove(root_sub_agent_id);
    }
}
```

#### 4. 与上下文的集成

```rust
// src-tauri/src/agent/subagent/context.rs (扩展)

impl SubAgentExecutionContext {
    /// 递增嵌套深度
    pub fn increment_nesting_depth(&mut self) -> Result<u32, ContextError> {
        if self.nesting_depth >= MAX_NESTING_DEPTH {
            return Err(ContextError::MaxNestingDepthExceeded);
        }
        self.nesting_depth += 1;
        self.last_active_at = Utc::now();
        Ok(self.nesting_depth)
    }

    /// 递减嵌套深度
    pub fn decrement_nesting_depth(&mut self) {
        if self.nesting_depth > 0 {
            self.nesting_depth -= 1;
            self.last_active_at = Utc::now();
        }
    }

    /// 检查是否可以嵌套调用
    pub fn can_nest(&self) -> bool {
        self.nesting_depth < MAX_NESTING_DEPTH && self.status == ContextStatus::Ready
    }
}
```

## 安全考虑

1. **深度限制强制执行**：最大深度3层在代码中作为常量强制检查
2. **循环检测前置检查**：在每次调用前进行循环检测，不允许循环调用
3. **超时保护**：每个层级都有超时控制，防止资源长时间占用
4. **调用审计**：所有嵌套调用记录完整日志，包括调用链、超时、错误等
5. **资源清理**：调用完成后自动清理调用栈，防止内存泄漏

## 性能考虑

1. **调用栈缓存**：已完成调用的栈帧可异步写入审计日志，主栈保持精简
2. **循环检测优化**：使用HashSet进行O(1)查找，递归深度有限
3. **超时检查**：使用tokio的timeout机制，精确控制超时
4. **并发控制**：使用RwLock允许多读单写，提高并发性能
