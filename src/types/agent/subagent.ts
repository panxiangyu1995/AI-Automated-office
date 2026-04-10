// src/types/agent/subagent.ts
// Subagent 共享类型 - 对应后端 Rust subagent/types.rs
// 与 openspec/changes/agent-integration-align/tasks.md Step 3 对齐

export type AgentType = 'primary' | 'department' | 'personal' | 'hidden';
export type AgentMode = 'code' | 'ask' | 'orchestrator' | 'general' | 'department' | 'hidden';
export type TriggerMode = 'manual' | 'auto' | 'hybrid';

export interface ModelProvider {
  provider: string;
  model_id: string;
  temperature: number;
  max_tokens: number;
}

export interface TriggerConfig {
  mode: TriggerMode;
  keywords: string[];
  conditions: TriggerCondition[];
  priority: number;
}

export interface TriggerCondition {
  intent: string;
  entities: string[];
}

export interface ToolPermissions {
  allowed: string[];
  denied: string[];
  constraints: ToolConstraint;
}

export interface ToolConstraint {
  max_per_day?: number;
  max_amount?: number;
  allowed_fields?: string[];
  data_scope?: string;
}

export interface LimitsConfig {
  max_steps: number;
  max_concurrent: number;
  timeout_seconds: number;
}

export interface ModelConfig {
  primary: ModelProvider;
  light?: ModelProvider;
  small?: ModelProvider;
}

export interface AgentConfig {
  name: string;
  display_name: string;
  description: string;
  agent_type: AgentType;
  mode: AgentMode;
  models: ModelConfig;
  prompt: string;
  trigger: TriggerConfig;
  tools: ToolPermissions;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubagentStats {
  total_count: number;
  personal_count: number;
  department_count: number;
  hidden_count: number;
  enabled_count: number;
  disabled_count: number;
  last_updated: number;
}

export interface CreateSubagentParams {
  name: string;
  displayName: string;
  description?: string;
  modelProvider: string;
  modelId: string;
  temperature: number;
  maxTokens: number;
  prompt: string;
  triggerMode: string;
  triggerKeywords: string[];
  allowedTools: string[];
}

export interface UpdateSubagentParams {
  name: string;
  displayName?: string;
  description?: string;
  prompt?: string;
  enabled?: boolean;
}
