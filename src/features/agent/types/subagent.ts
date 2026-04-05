// src/features/agent/types/subagent.ts
// Subagent 类型定义 - 对应后端 Rust types.rs
// ADR-059 部门化 Subagent 架构

/**
 * Agent 类型
 */
export enum AgentType {
  Primary = 'primary',
  Department = 'department',
  Personal = 'personal',
  Hidden = 'hidden',
}

/**
 * Agent Mode 枚举（来自 kilocode 启发）
 */
export enum AgentMode {
  Code = 'code',
  Ask = 'ask',
  Orchestrator = 'orchestrator',
  General = 'general',
  Department = 'department',
  Hidden = 'hidden',
}

/**
 * 触发模式
 */
export enum TriggerMode {
  Manual = 'manual',
  Auto = 'auto',
  Hybrid = 'hybrid',
}

/**
 * 数据范围
 */
export enum DataScope {
  Personal = 'personal',
  Department = 'department',
  All = 'all',
  Executive = 'executive',
}

/**
 * 输出格式
 */
export enum OutputFormat {
  Text = 'text',
  Structured = 'structured',
  Json = 'json',
}

/**
 * 结果状态
 */
export enum ResultStatus {
  Success = 'success',
  PartialFailure = 'partialFailure',
  Failure = 'failure',
}

/**
 * 模型提供者
 */
export interface ModelProvider {
  provider: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
}

/**
 * 工具约束
 */
export interface ToolConstraint {
  maxPerDay?: number;
  maxAmount?: number;
  allowedFields?: string[];
  dataScope?: DataScope;
}

/**
 * 触发条件
 */
export interface TriggerCondition {
  intent: string;
  entities: string[];
}

/**
 * 模型配置
 */
export interface ModelConfig {
  primary: ModelProvider;
  light?: ModelProvider;
  small?: ModelProvider;
}

/**
 * 工具权限配置
 */
export interface ToolPermissions {
  allowed: string[];
  denied: string[];
  constraints: Record<string, ToolConstraint>;
}

/**
 * 触发配置
 */
export interface TriggerConfig {
  mode: TriggerMode;
  keywords: string[];
  conditions: TriggerCondition[];
  priority: number;
}

/**
 * 限制配置
 */
export interface LimitsConfig {
  maxSteps: number;
  maxConcurrent: number;
  timeoutSeconds: number;
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  name: string;
  agentType: AgentType;
  mode: AgentMode;
  displayName: string;
  description: string;
  models: ModelConfig;
  tools: ToolPermissions;
  trigger: TriggerConfig;
  limits: LimitsConfig;
  pluginId?: string;
  creatorId?: string;
}

/**
 * 委派目标
 */
export interface DelegationTarget {
  subagent: string;
  intent?: string;
}

/**
 * 委派约束
 */
export interface DelegationConstraints {
  allowedTools: string[];
  deniedTools: string[];
  dataScope: DataScope;
  maxSteps: number;
  timeout: number;
}

/**
 * 委派上下文
 */
export interface DelegationContext {
  userMessage: string;
  extractedEntities: Record<string, unknown>;
  previousResults?: SubagentResult[];
}

/**
 * 输出契约
 */
export interface OutputContract {
  format: OutputFormat;
  schema?: unknown;
}

/**
 * 委派协议（Delegation Contract）
 */
export interface DelegationContract {
  target: DelegationTarget;
  constraints: DelegationConstraints;
  context: DelegationContext;
  output: OutputContract;
}

/**
 * Subagent 执行结果
 */
export interface SubagentResult {
  subagent: string;
  status: ResultStatus;
  output: string;
  error?: string;
  elapsedMs: number;
}

/**
 * 创建 Personal Subagent 请求
 */
export interface CreatePersonalSubagentRequest {
  name: string;
  displayName: string;
  description?: string;
  model: ModelProvider;
  prompt: string;
  trigger: TriggerConfig;
  tools: ToolPermissions;
  knowledgeSources?: string[];
  limits?: LimitsConfig;
}

/**
 * 更新 Personal Subagent 请求
 */
export interface UpdatePersonalSubagentRequest {
  displayName?: string;
  description?: string;
  model?: ModelProvider;
  prompt?: string;
  trigger?: TriggerConfig;
  tools?: ToolPermissions;
  enabled?: boolean;
}

/**
 * Subagent 统计信息
 */
export interface SubagentStats {
  hidden: number;
  department: number;
  personal: number;
  total: number;
}

/**
 * Subagent 列表项（简化版）
 */
export interface SubagentListItem {
  name: string;
  displayName: string;
  description: string;
  agentType: AgentType;
  mode: AgentMode;
  priority: number;
  enabled: boolean;
  toolCount: number;
  creatorId?: string;
  pluginId?: string;
  updatedAt?: string;
}

/**
 * 从 AgentConfig 转换为列表项
 */
export function toSubagentListItem(config: AgentConfig): SubagentListItem {
  return {
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    agentType: config.agentType,
    mode: config.mode,
    priority: config.trigger.priority,
    enabled: true,
    toolCount: config.tools.allowed.length,
    pluginId: config.pluginId,
    creatorId: config.creatorId,
  };
}

/**
 * 验证 Subagent 配置
 */
export function validateSubagentConfig(config: Partial<CreatePersonalSubagentRequest>): string[] {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('名称不能为空');
  } else if (config.name.length > 64) {
    errors.push('名称不能超过64个字符');
  }

  if (!config.displayName) {
    errors.push('显示名称不能为空');
  } else if (config.displayName.length > 128) {
    errors.push('显示名称不能超过128个字符');
  }

  if (config.description && config.description.length > 512) {
    errors.push('描述不能超过512个字符');
  }

  if (!config.prompt) {
    errors.push('提示词不能为空');
  } else if (config.prompt.length > 8192) {
    errors.push('提示词不能超过8192个字符');
  }

  if (config.trigger?.keywords && config.trigger.keywords.length > 50) {
    errors.push('触发关键词不能超过50个');
  }

  return errors;
}

/**
 * 创建默认的 ToolPermissions
 */
export function createDefaultToolPermissions(): ToolPermissions {
  return {
    allowed: [],
    denied: [],
    constraints: {},
  };
}

/**
 * 创建默认的 TriggerConfig
 */
export function createDefaultTriggerConfig(): TriggerConfig {
  return {
    mode: TriggerMode.Manual,
    keywords: [],
    conditions: [],
    priority: 5,
  };
}

/**
 * 创建默认的 LimitsConfig
 */
export function createDefaultLimitsConfig(): LimitsConfig {
  return {
    maxSteps: 20,
    maxConcurrent: 1,
    timeoutSeconds: 300,
  };
}

/**
 * 创建默认的 ModelProvider
 */
export function createDefaultModelProvider(): ModelProvider {
  return {
    provider: 'openai',
    modelId: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096,
  };
}
