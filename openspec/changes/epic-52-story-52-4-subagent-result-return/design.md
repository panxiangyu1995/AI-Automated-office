# Design: Sub-Agent结果汇总与回传

## 技术方案

### 实现类型
- **类型**: new（新功能开发）
- **优先级**: medium
- **阶段**: Phase 2 - Sub-Agent运行时实现
- **实现方式**: 前后端协同，前端定义类型接口，后端实现核心逻辑

### API设计

#### 前端类型定义

```typescript
// src/features/agent/types/subagent-result.types.ts

/**
 * Sub-Agent执行结果
 */
export interface SubAgentResult {
  /** 结果ID */
  resultId: string;
  /** 关联的调用ID */
  callId: string;
  /** 关联的上下文ID */
  contextId: string;
  /** 执行状态 */
  status: SubAgentResultStatus;
  /** 执行摘要 */
  summary: ExecutionSummary;
  /** 返回数据 */
  data?: unknown;
  /** 错误信息 */
  error?: SubAgentError;
  /** 执行开始时间 */
  startTime: number;
  /** 执行结束时间 */
  endTime: number;
  /** 总耗时（毫秒） */
  durationMs: number;
  /** 调用链数据 */
  callChain: CallChainData;
}

/**
 * 结果状态
 */
export enum SubAgentResultStatus {
  Success = 'success',       // 成功
  Failed = 'failed',         // 失败
  PartialSuccess = 'partial_success', // 部分成功
  Timeout = 'timeout',        // 超时
}

/**
 * 执行摘要
 */
export interface ExecutionSummary {
  /** 摘要ID */
  summaryId: string;
  /** Sub-Agent名称 */
  subAgentName: string;
  /** 执行概述（一句话） */
  overview: string;
  /** 主要输出 */
  mainOutput: string;
  /** 使用的工具列表 */
  toolsUsed: ToolUsageSummary[];
  /** 产生的子调用数 */
  childCallsCount: number;
  /** 关键决策 */
  keyDecisions: string[];
  /** 建议的后续操作 */
  suggestedNextSteps: string[];
  /** 摘要生成时间 */
  generatedAt: number;
}

/**
 * 工具使用摘要
 */
export interface ToolUsageSummary {
  /** 工具名称 */
  toolName: string;
  /** 调用次数 */
  callCount: number;
  /** 是否成功 */
  success: boolean;
  /** 简要结果 */
  briefResult: string;
}

/**
 * Sub-Agent错误
 */
export interface SubAgentError {
  /** 错误码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误类型 */
  type: SubAgentErrorType;
  /** 错误详情 */
  details?: unknown;
  /** 回退建议 */
  fallbackSuggestions: string[];
  /** 是否可重试 */
  retryable: boolean;
}

/**
 * 错误类型
 */
export enum SubAgentErrorType {
  ExecutionError = 'execution_error',       // 执行错误
  Timeout = 'timeout',                       // 超时错误
  PermissionDenied = 'permission_denied',   // 权限错误
  ToolNotFound = 'tool_not_found',          // 工具不存在
  InvalidInput = 'invalid_input',           // 输入无效
  ResourceExhausted = 'resource_exhausted', // 资源耗尽
  Unknown = 'unknown',                       // 未知错误
}

/**
 * 上下文整合请求
 */
export interface ContextIntegrationRequest {
  /** 主Agent上下文ID */
  mainContextId: string;
  /** Sub-Agent执行结果 */
  result: SubAgentResult;
  /** 整合策略 */
  strategy: IntegrationStrategy;
}

/**
 * 整合策略
 */
export enum IntegrationStrategy {
  /** 替换：完全替换主上下文中的相关数据 */
  Replace = 'replace',
  /** 合并：与主上下文数据合并 */
  Merge = 'merge',
  /** 追加：仅追加新数据 */
  Append = 'append',
  /** 忽略：不整合 */
  Ignore = 'ignore',
}

/**
 * 上下文整合结果
 */
export interface ContextIntegrationResult {
  /** 是否成功 */
  success: boolean;
  /** 整合后的上下文 */
  updatedContext?: SubAgentExecutionContext;
  /** 冲突列表 */
  conflicts: IntegrationConflict[];
  /** 警告列表 */
  warnings: string[];
}

/**
 * 整合冲突
 */
export interface IntegrationConflict {
  /** 冲突类型 */
  type: ConflictType;
  /** 冲突描述 */
  description: string;
  /** 解决方式 */
  resolution: string;
  /** 相关数据 */
  relatedData?: unknown;
}

/**
 * 冲突类型
 */
export enum ConflictType {
  MemoryConflict = 'memory_conflict',       // 记忆冲突
  StateConflict = 'state_conflict',         // 状态冲突
  PermissionConflict = 'permission_conflict', // 权限冲突
}

/**
 * 结果可视化数据
 */
export interface ResultVisualizationData {
  /** 结果ID */
  resultId: string;
  /** 执行状态 */
  status: SubAgentResultStatus;
  /** 执行时间线 */
  timeline: TimelineEvent[];
  /** 工具使用统计 */
  toolUsageStats: ToolUsageStat[];
  /** 调用树（用于可视化） */
  callTree: CallTreeNode;
}

/**
 * 时间线事件
 */
export interface TimelineEvent {
  /** 事件ID */
  eventId: string;
  /** 事件类型 */
  type: TimelineEventType;
  /** 事件描述 */
  description: string;
  /** 发生时间 */
  timestamp: number;
  /** 持续时间（毫秒） */
  durationMs?: number;
}

/**
 * 时间线事件类型
 */
export enum TimelineEventType {
  CallStart = 'call_start',
  CallEnd = 'call_end',
  ToolCall = 'tool_call',
  ToolResult = 'tool_result',
  MemoryInjection = 'memory_injection',
  Error = 'error',
  Warning = 'warning',
}

/**
 * 工具使用统计
 */
export interface ToolUsageStat {
  /** 工具名称 */
  toolName: string;
  /** 调用次数 */
  callCount: number;
  /** 成功率 */
  successRate: number;
  /** 平均耗时 */
  avgDurationMs: number;
}

/**
 * 调用树节点
 */
export interface CallTreeNode {
  /** 节点ID */
  nodeId: string;
  /** Sub-Agent信息 */
  subAgent: {
    id: string;
    name: string;
  };
  /** 状态 */
  status: SubAgentResultStatus;
  /** 子节点 */
  children: CallTreeNode[];
  /** 展开状态（用于UI） */
  expanded?: boolean;
}
```

#### Rust后端接口

```rust
// src-tauri/src/agent/subagent/commands.rs (扩展)

use serde::{Deserialize, Serialize};
use tauri::command;

/// 归一化Sub-Agent执行结果
#[command]
pub async fn normalize_result(
    call_id: String,
    raw_result: serde_json::Value,
) -> Result<SubAgentResult, String> {
    // 实现逻辑
}

/// 生成执行摘要
#[command]
pub async fn generate_execution_summary(
    context_id: String,
    call_id: String,
) -> Result<ExecutionSummary, String> {
    // 实现逻辑
}

/// 整合结果到主上下文
#[command]
pub async fn integrate_to_main_context(
    request: ContextIntegrationRequest,
) -> Result<ContextIntegrationResult, String> {
    // 实现逻辑
}

/// 获取结果可视化数据
#[command]
pub async fn get_result_visualization(
    result_id: String,
) -> Result<ResultVisualizationData, String> {
    // 实现逻辑
}
```

### 模块结构

```
src-tauri/src/agent/
├── mod.rs                          # Agent模块入口
├── subagent/
│   ├── mod.rs                      # SubAgent子模块入口
│   ├── result.rs                   # 结果归一化器（新增）
│   ├── summary.rs                  # 执行摘要生成（新增）
│   ├── integration.rs               # 上下文整合（新增）
│   └── nested.rs                    # 嵌套调用（扩展结果返回）
```

### 技术方案详解

#### 1. 结果归一化器

```rust
// src-tauri/src/agent/subagent/result.rs

/// 结果归一化器
pub struct SubAgentResultNormalizer;

impl SubAgentResultNormalizer {
    /// 归一化处理Sub-Agent返回的原始结果
    pub fn normalize(
        call_id: &str,
        context_id: &str,
        raw_result: serde_json::Value,
        execution_metadata: ExecutionMetadata,
    ) -> Result<SubAgentResult, NormalizationError> {
        // 1. 解析原始结果
        let parsed = Self::parse_raw_result(raw_result)?;

        // 2. 验证结果格式
        Self::validate_result(&parsed)?;

        // 3. 转换为我们定义的格式
        let normalized = Self::transform_to_normalized(parsed, call_id, context_id, execution_metadata)?;

        Ok(normalized)
    }

    /// 解析原始结果
    fn parse_raw_result(raw: serde_json::Value) -> Result<ParsedResult, NormalizationError> {
        // 支持多种输入格式：
        // 1. 直接是最终结果
        // 2. 包含result和metadata的结构
        // 3. LLM的完整响应

        if let Ok(simple) = serde_json::from_value::<serde_json::Value>(raw.clone()) {
            return Ok(ParsedResult::Simple(simple));
        }

        if let Ok structured) = serde_json::from_value::<StructuredResult>(raw) {
            return Ok(ParsedResult::Structured(structured));
        }

        Err(NormalizationError::InvalidFormat(
            "Cannot parse raw result into known format".into()
        ))
    }

    /// 验证结果格式
    fn validate_result(parsed: &ParsedResult) -> Result<(), NormalizationError> {
        match parsed {
            ParsedResult::Simple(value) => {
                // 简单格式：确保不是null或undefined
                if value.is_null() {
                    return Err(NormalizationError::NullResult);
                }
                Ok(())
            }
            ParsedResult::Structured(s) => {
                // 结构化格式：验证必要字段
                if s.data.is_none() && s.error.is_none() {
                    return Err(NormalizationError::MissingData);
                }
                Ok(())
            }
        }
    }

    /// 转换为核心结果格式
    fn transform_to_normalized(
        parsed: ParsedResult,
        call_id: &str,
        context_id: &str,
        metadata: ExecutionMetadata,
    ) -> Result<SubAgentResult, NormalizationError> {
        let status = Self::determine_status(&parsed);
        let summary = Self::generate_summary(&parsed, &metadata)?;

        let (data, error) = match parsed {
            ParsedResult::Simple(value) => (Some(value), None),
            ParsedResult::Structured(s) => (s.data, s.error.map(|e| e.into())),
        };

        Ok(SubAgentResult {
            result_id: Uuid::new_v4().to_string(),
            call_id: call_id.to_string(),
            context_id: context_id.to_string(),
            status,
            summary,
            data,
            error,
            start_time: metadata.start_time,
            end_time: metadata.end_time,
            duration_ms: metadata.duration_ms,
            call_chain: metadata.call_chain,
        })
    }

    /// 确定结果状态
    fn determine_status(parsed: &ParsedResult) -> SubAgentResultStatus {
        match parsed {
            ParsedResult::Simple(_) => SubAgentResultStatus::Success,
            ParsedResult::Structured(s) => {
                if s.error.is_some() {
                    SubAgentResultStatus::Failed
                } else if s.partial_success {
                    SubAgentResultStatus::PartialSuccess
                } else {
                    SubAgentResultStatus::Success
                }
            }
        }
    }

    /// 生成执行摘要
    fn generate_summary(
        parsed: &ParsedResult,
        metadata: &ExecutionMetadata,
    ) -> Result<ExecutionSummary, NormalizationError> {
        let sub_agent_name = metadata.sub_agent_name.clone();
        let overview = Self::generate_overview(parsed, metadata)?;

        Ok(ExecutionSummary {
            summary_id: Uuid::new_v4().to_string(),
            sub_agent_name,
            overview,
            main_output: Self::extract_main_output(parsed)?,
            tools_used: Self::summarize_tool_usage(&metadata.tool_calls),
            child_calls_count: metadata.child_calls_count,
            key_decisions: metadata.decisions.clone(),
            suggested_next_steps: metadata.suggestions.clone(),
            generated_at: Utc::now().timestamp_millis(),
        })
    }
}
```

#### 2. 执行摘要生成

```rust
// src-tauri/src/agent/subagent/summary.rs

/// 执行摘要生成器
pub struct ExecutionSummaryGenerator {
    /// 最大摘要长度
    max_summary_length: usize,
    /// 最大工具列表数
    max_tools_listed: usize,
}

impl ExecutionSummaryGenerator {
    /// 生成执行概述（一句话）
    pub fn generate_overview(
        &self,
        result: &ParsedResult,
        metadata: &ExecutionMetadata,
    ) -> String {
        let action = format!(
            "完成了对{}的分析",
            metadata.task_description.as_deref().unwrap_or("任务")
        );

        let status = match result {
            ParsedResult::Simple(_) => "成功",
            ParsedResult::Structured(s) if s.error.is_some() => "失败",
            ParsedResult::Structured(s) if s.partial_success => "部分成功",
            _ => "成功",
        };

        let tools_used = if metadata.tool_calls.is_empty() {
            String::new()
        } else {
            let tool_names: Vec<_> = metadata.tool_calls
                .iter()
                .take(3)
                .map(|t| t.name.as_str())
                .collect();
            format!(", 使用了工具: {}", tool_names.join(", "))
        };

        format!("{}{}{}", action, status, tools_used)
    }

    /// 提取主要输出
    pub fn extract_main_output(&self, result: &ParsedResult) -> Result<String, NormalizationError> {
        let data = match result {
            ParsedResult::Simple(v) => v.clone(),
            ParsedResult::Structured(s) => s.data.clone().ok_or(NormalizationError::MissingData)?,
        };

        // 将数据转换为字符串，限制长度
        let output = match data {
            serde_json::Value::String(s) => s,
            serde_json::Value::Object(m) => serde_json::to_string(&m)
                .unwrap_or_else(|_| "无法序列化结果".to_string()),
            other => serde_json::to_string(&other)
                .unwrap_or_else(|_| "无法序列化结果".to_string()),
        };

        // 截断过长输出
        if output.len() > self.max_summary_length {
            Ok(format!("{}...", &output[..self.max_summary_length]))
        } else {
            Ok(output)
        }
    }

    /// 汇总工具使用情况
    pub fn summarize_tool_usage(&self, tool_calls: &[ToolCall]) -> Vec<ToolUsageSummary> {
        use std::collections::HashMap;

        let mut tool_stats: HashMap<String, (u32, bool, String)> = HashMap::new();

        for call in tool_calls {
            let entry = tool_stats.entry(call.name.clone()).or_insert((0, true, String::new()));
            entry.0 += 1;
            if !call.success {
                entry.1 = false;
            }
            entry.2 = call.brief_result.clone();
        }

        tool_stats
            .into_iter()
            .take(self.max_tools_listed)
            .map(|(name, (count, success, brief))| ToolUsageSummary {
                tool_name: name,
                call_count: count,
                success,
                brief_result: brief,
            })
            .collect()
    }
}
```

#### 3. 上下文整合

```rust
// src-tauri/src/agent/subagent/integration.rs

/// 上下文整合器
pub struct ContextIntegrator {
    memory_merger: MemoryMerger,
    state_resolver: StateConflictResolver,
}

impl ContextIntegrator {
    /// 整合Sub-Agent结果到主上下文
    pub async fn integrate(
        &self,
        request: ContextIntegrationRequest,
    ) -> Result<ContextIntegrationResult, IntegrationError> {
        let mut conflicts = Vec::new();
        let mut warnings = Vec::new();

        // 1. 获取主上下文
        let main_context = self.get_main_context(&request.main_context_id)?;

        // 2. 根据策略整合记忆
        let (updated_memory, memory_conflicts) = self.merge_memory(
            &main_context,
            &request.result,
            &request.strategy,
        )?;
        conflicts.extend(memory_conflicts);

        // 3. 根据策略整合状态
        let (updated_state, state_conflicts) = self.merge_state(
            &main_context,
            &request.result,
            &request.strategy,
        )?;
        conflicts.extend(state_conflicts);

        // 4. 生成警告
        if conflicts.len() > 0 {
            warnings.push(format!(
                "整合过程中产生{}个冲突，已自动解决",
                conflicts.len()
            ));
        }

        Ok(ContextIntegrationResult {
            success: true,
            updated_context: Some(SubAgentExecutionContext {
                memory: updated_memory,
                state: updated_state,
                ..main_context
            }),
            conflicts,
            warnings,
        })
    }

    /// 合并记忆
    fn merge_memory(
        &self,
        main_context: &SubAgentExecutionContext,
        result: &SubAgentResult,
        strategy: &IntegrationStrategy,
    ) -> Result<(Vec<Memory>, Vec<IntegrationConflict>), IntegrationError> {
        let mut conflicts = Vec::new();
        let sub_agent_memories = self.extract_sub_agent_memories(result)?;

        match strategy {
            IntegrationStrategy::Replace => {
                // 完全替换主上下文的记忆
                Ok((sub_agent_memories, conflicts))
            }
            IntegrationStrategy::Merge => {
                // 合并记忆，解决冲突
                self.memory_merger.merge(&main_context.memory, &sub_agent_memories, &mut conflicts)
            }
            IntegrationStrategy::Append => {
                // 仅追加新记忆
                let mut all_memories = main_context.memory.clone();
                all_memories.extend(sub_agent_memories);
                Ok((all_memories, conflicts))
            }
            IntegrationStrategy::Ignore => {
                // 不整合
                Ok((main_context.memory.clone(), conflicts))
            }
        }
    }

    /// 合并状态
    fn merge_state(
        &self,
        main_context: &SubAgentExecutionContext,
        result: &SubAgentResult,
        strategy: &IntegrationStrategy,
    ) -> Result<(ContextState, Vec<IntegrationConflict>), IntegrationError> {
        let mut conflicts = Vec::new();
        let sub_agent_state = self.extract_sub_agent_state(result)?;

        match strategy {
            IntegrationStrategy::Replace => {
                Ok((sub_agent_state, conflicts))
            }
            IntegrationStrategy::Merge => {
                self.state_resolver.merge(&main_context.state, &sub_agent_state, &mut conflicts)
            }
            IntegrationStrategy::Append | IntegrationStrategy::Ignore => {
                Ok((main_context.state.clone(), conflicts))
            }
        }
    }
}

/// 记忆合并器
pub struct MemoryMerger;

impl MemoryMerger {
    /// 合并两组记忆
    fn merge(
        &self,
        main_memories: &[Memory],
        sub_agent_memories: &[Memory],
        conflicts: &mut Vec<IntegrationConflict>,
    ) -> Result<(Vec<Memory>, Vec<IntegrationConflict>), IntegrationError> {
        let mut merged = main_memories.to_vec();
        let mut seen_ids: HashSet<String> = main_memories.iter().map(|m| m.id.clone()).collect();

        for memory in sub_agent_memories {
            if seen_ids.contains(&memory.id) {
                // 记忆冲突：比较时间戳，保留最新的
                let existing = merged.iter_mut().find(|m| m.id == memory.id).unwrap();
                if memory.updated_at > existing.updated_at {
                    conflicts.push(IntegrationConflict {
                        conflict_type: ConflictType::MemoryConflict,
                        description: format!("记忆 '{}' 存在冲突，已使用最新版本", memory.id),
                        resolution: "保留最新版本".to_string(),
                        related_data: serde_json::json!({
                            "old": existing,
                            "new": memory
                        }),
                    });
                    *existing = memory.clone();
                }
            } else {
                merged.push(memory.clone());
                seen_ids.insert(memory.id.clone());
            }
        }

        Ok((merged, conflicts.clone()))
    }
}

/// 状态冲突解决器
pub struct StateConflictResolver;

impl StateConflictResolver {
    /// 合并两组状态
    fn merge(
        &self,
        main_state: &ContextState,
        sub_agent_state: &ContextState,
        conflicts: &mut Vec<IntegrationConflict>,
    ) -> Result<(ContextState, Vec<IntegrationConflict>), IntegrationError> {
        // 简单的状态合并策略：主状态优先，但合并子状态集合
        let merged_state = ContextState {
            variables: main_state.variables.clone(), // 主状态变量优先
            sub_states: {
                let mut combined = main_state.sub_states.clone();
                combined.extend(sub_agent_state.sub_states.clone());
                combined
            },
            last_updated: Utc::now(),
        };

        if !sub_agent_state.variables.is_empty() {
            conflicts.push(IntegrationConflict {
                conflict_type: ConflictType::StateConflict,
                description: "Sub-Agent产生了新的状态变量，已合并".to_string(),
                resolution: "添加到子状态集合".to_string(),
                related_data: serde_json::to_value(&sub_agent_state.variables)?,
            });
        }

        Ok((merged_state, conflicts.clone()))
    }
}
```

#### 4. 失败回退处理

```rust
// src-tauri/src/agent/subagent/result.rs (扩展)

impl SubAgentResultNormalizer {
    /// 处理执行失败的情况
    pub fn handle_failure(
        call_id: &str,
        context_id: &str,
        error: SubAgentError,
        metadata: ExecutionMetadata,
    ) -> SubAgentResult {
        let fallback_suggestions = Self::generate_fallback_suggestions(&error);

        SubAgentResult {
            result_id: Uuid::new_v4().to_string(),
            call_id: call_id.to_string(),
            context_id: context_id.to_string(),
            status: SubAgentResultStatus::Failed,
            summary: ExecutionSummary {
                summary_id: Uuid::new_v4().to_string(),
                sub_agent_name: metadata.sub_agent_name,
                overview: format!("执行失败: {}", error.message),
                main_output: String::new(),
                tools_used: Self::summarize_tool_usage_internal(&metadata.tool_calls),
                child_calls_count: metadata.child_calls_count,
                key_decisions: vec![],
                suggested_next_steps: fallback_suggestions.clone(),
                generated_at: Utc::now().timestamp_millis(),
            },
            data: None,
            error: Some(SubAgentError {
                code: error.code,
                message: error.message,
                error_type: error.error_type,
                details: error.details,
                fallback_suggestions,
                retryable: error.retryable,
            }),
            start_time: metadata.start_time,
            end_time: metadata.end_time,
            duration_ms: metadata.duration_ms,
            call_chain: metadata.call_chain,
        }
    }

    /// 生成回退建议
    fn generate_fallback_suggestions(error: &SubAgentError) -> Vec<String> {
        let mut suggestions = Vec::new();

        match error.error_type {
            SubAgentErrorType::Timeout => {
                suggestions.push("增加超时时间后重试".to_string());
                suggestions.push("检查网络连接是否稳定".to_string());
            }
            SubAgentErrorType::PermissionDenied => {
                suggestions.push("检查是否有足够的权限执行此操作".to_string());
                suggestions.push("联系管理员获取相应权限".to_string());
            }
            SubAgentErrorType::ToolNotFound => {
                suggestions.push("检查工具名称是否正确".to_string());
                suggestions.push("确认该工具是否在允许列表中".to_string());
            }
            SubAgentErrorType::InvalidInput => {
                suggestions.push("检查输入参数格式是否正确".to_string());
                suggestions.push("参考API文档确认参数要求".to_string());
            }
            SubAgentErrorType::ResourceExhausted => {
                suggestions.push("等待一段时间后重试".to_string());
                suggestions.push("减少并发请求数量".to_string());
            }
            _ => {
                suggestions.push("请稍后重试".to_string());
                suggestions.push("如果问题持续存在，请联系技术支持".to_string());
            }
        }

        suggestions
    }
}
```

## 安全考虑

1. **结果验证**：对所有归一化结果进行Schema验证，防止注入攻击
2. **错误脱敏**：对外暴露的错误信息不包含敏感的系统细节
3. **数据隔离**：整合时严格遵守主Agent数据的优先级
4. **日志审计**：记录所有结果整合操作用于审计

## 性能考虑

1. **异步处理**：结果归一化和摘要生成使用异步处理
2. **流式处理**：对于大结果使用流式处理，避免内存峰值
3. **缓存优化**：已生成的摘要可缓存，避免重复生成
4. **长度限制**：对摘要和输出长度进行限制，防止Token消耗过大
