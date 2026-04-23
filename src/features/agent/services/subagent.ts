// src/features/agent/services/subagent.ts
// Subagent 服务 - 前端调用 Tauri Commands 的封装
// ADR-059 部门化 Subagent 架构

import { safeInvoke } from '@/lib/tauri';
import {
  AgentConfig,
  AgentType,
  AgentMode,
  CreatePersonalSubagentRequest,
  UpdatePersonalSubagentRequest,
  SubagentStats,
  toSubagentListItem,
  SubagentListItem,
  createDefaultModelProvider,
  createDefaultTriggerConfig,
  createDefaultToolPermissions,
  createDefaultLimitsConfig,
} from '../types/subagent';

/**
 * 获取所有可用的 Subagent 列表
 */
export async function getAvailableSubagents(): Promise<AgentConfig[]> {
  const result = await safeInvoke<AgentConfig[]>('get_available_subagents');
  return result ?? []
}

/**
 * 获取单个 Subagent 配置
 */
export async function getSubagentConfig(name: string): Promise<AgentConfig | null> {
  const result = await safeInvoke<AgentConfig | null>('get_subagent_config', { name });
  return result ?? null
}

/**
 * 获取 Subagent 统计信息
 */
export async function getSubagentStats(): Promise<SubagentStats> {
  const result = await safeInvoke<SubagentStats>('get_subagent_stats');
  return result ?? { hidden: 0, department: 0, personal: 0, total: 0 }
}

/**
 * 根据关键词匹配 Subagent
 */
export async function matchSubagentsByKeywords(keywords: string[]): Promise<AgentConfig[]> {
  const result = await safeInvoke<AgentConfig[]>('match_subagents_by_keywords', { keywords });
  return result ?? []
}

/**
 * 获取 Personal Subagent 列表
 */
export async function listPersonalSubagents(): Promise<AgentConfig[]> {
  const result = await safeInvoke<AgentConfig[]>('list_personal_subagents');
  return result ?? []
}

/**
 * 获取 Department Subagent 列表
 */
export async function listDepartmentSubagents(): Promise<AgentConfig[]> {
  const result = await safeInvoke<AgentConfig[]>('list_department_subagents');
  return result ?? []
}

/**
 * 获取 Hidden Subagent 列表
 */
export async function listHiddenSubagents(): Promise<AgentConfig[]> {
  const result = await safeInvoke<AgentConfig[]>('list_hidden_subagents');
  return result ?? []
}

/**
 * 创建 Personal Subagent
 */
export async function createPersonalSubagent(
  request: CreatePersonalSubagentRequest
): Promise<AgentConfig> {
  const result = await safeInvoke<AgentConfig>('create_personal_subagent', {
    name: request.name,
    display_name: request.displayName,
    description: request.description,
    model_provider: request.model.provider,
    model_id: request.model.modelId,
    temperature: request.model.temperature,
    max_tokens: request.model.maxTokens,
    prompt: request.prompt,
    trigger_mode: request.trigger.mode,
    trigger_keywords: request.trigger.keywords,
    allowed_tools: request.tools.allowed,
  });
  if (result) return result
  const defaultModel = createDefaultModelProvider()
  return {
    name: request.name,
    displayName: request.displayName,
    agentType: AgentType.Personal,
    mode: AgentMode.General,
    description: request.description ?? '',
    models: { primary: defaultModel },
    prompt: request.prompt,
    tools: request.tools,
    trigger: request.trigger,
    limits: createDefaultLimitsConfig(),
  }
}

/**
 * 更新 Personal Subagent
 */
export async function updatePersonalSubagent(
  name: string,
  request: UpdatePersonalSubagentRequest
): Promise<AgentConfig> {
  const result = await safeInvoke<AgentConfig>('update_personal_subagent', {
    name,
    display_name: request.displayName,
    description: request.description,
    prompt: request.prompt,
    enabled: request.enabled,
  });
  if (result) return result
  const defaultModel = createDefaultModelProvider()
  return {
    name,
    displayName: request.displayName ?? name,
    agentType: AgentType.Personal,
    mode: AgentMode.General,
    description: request.description ?? '',
    models: { primary: defaultModel },
    prompt: request.prompt ?? '',
    tools: createDefaultToolPermissions(),
    trigger: createDefaultTriggerConfig(),
    limits: createDefaultLimitsConfig(),
  }
}

/**
 * 删除 Personal Subagent
 */
export async function deletePersonalSubagent(name: string): Promise<void> {
  await safeInvoke('delete_personal_subagent', { name })
}

/**
 * 获取 Subagent 列表项（简化版）
 */
export async function getSubagentListItems(): Promise<SubagentListItem[]> {
  const configs = await getAvailableSubagents();
  return configs.map(toSubagentListItem);
}

/**
 * 按类型获取 Subagent 列表
 */
export async function getSubagentsByType(type_: AgentType): Promise<AgentConfig[]> {
  const configs = await getAvailableSubagents();
  return configs.filter(c => c.agentType === type_);
}

/**
 * 获取 Personal Subagent 列表项
 */
export async function getPersonalSubagentListItems(): Promise<SubagentListItem[]> {
  const configs = await listPersonalSubagents();
  return configs.map(toSubagentListItem);
}

/**
 * 获取 Department Subagent 列表项
 */
export async function getDepartmentSubagentListItems(): Promise<SubagentListItem[]> {
  const configs = await listDepartmentSubagents();
  return configs.map(toSubagentListItem);
}

/**
 * 创建默认的 Personal Subagent 请求
 */
export function createDefaultPersonalSubagentRequest(): CreatePersonalSubagentRequest {
  return {
    name: '',
    displayName: '',
    description: undefined,
    model: createDefaultModelProvider(),
    prompt: '',
    trigger: createDefaultTriggerConfig(),
    tools: createDefaultToolPermissions(),
    knowledgeSources: [],
    limits: createDefaultLimitsConfig(),
  };
}

/**
 * 导出 Subagent 配置（用于备份）
 */
export async function exportSubagentConfig(name: string): Promise<string> {
  const config = await getSubagentConfig(name);
  if (!config) {
    throw new Error(`Subagent '${name}' not found`);
  }
  return JSON.stringify(config, null, 2);
}

/**
 * 导入 Subagent 配置（用于恢复）
 */
export async function importSubagentConfig(configJson: string): Promise<AgentConfig> {
  const config = JSON.parse(configJson) as AgentConfig;
  
  // 验证配置
  if (!config.name || !config.displayName || !config.prompt) {
    throw new Error('Invalid configuration: missing required fields');
  }
  
  // 创建 Personal Subagent
  const request: CreatePersonalSubagentRequest = {
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    model: config.models.primary,
    prompt: config.prompt,
    trigger: config.trigger,
    tools: config.tools,
    limits: config.limits,
  };
  
  return createPersonalSubagent(request);
}

/**
 * 搜索 Subagent
 */
export async function searchSubagents(query: string): Promise<SubagentListItem[]> {
  // 使用关键词匹配
  const keywords = query.toLowerCase().split(/\s+/);
  const configs = await matchSubagentsByKeywords(keywords);
  return configs.map(toSubagentListItem);
}
