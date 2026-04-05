// src/features/agent/services/subagent.ts
// Subagent 服务 - 前端调用 Tauri Commands 的封装
// ADR-059 部门化 Subagent 架构

import { invoke } from '@tauri-apps/api/core';
import {
  AgentConfig,
  AgentType,
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
  return invoke<AgentConfig[]>('get_available_subagents');
}

/**
 * 获取单个 Subagent 配置
 */
export async function getSubagentConfig(name: string): Promise<AgentConfig | null> {
  return invoke<AgentConfig | null>('get_subagent_config', { name });
}

/**
 * 获取 Subagent 统计信息
 */
export async function getSubagentStats(): Promise<SubagentStats> {
  return invoke<SubagentStats>('get_subagent_stats');
}

/**
 * 根据关键词匹配 Subagent
 */
export async function matchSubagentsByKeywords(keywords: string[]): Promise<AgentConfig[]> {
  return invoke<AgentConfig[]>('match_subagents_by_keywords', { keywords });
}

/**
 * 获取 Personal Subagent 列表
 */
export async function listPersonalSubagents(): Promise<AgentConfig[]> {
  return invoke<AgentConfig[]>('list_personal_subagents');
}

/**
 * 获取 Department Subagent 列表
 */
export async function listDepartmentSubagents(): Promise<AgentConfig[]> {
  return invoke<AgentConfig[]>('list_department_subagents');
}

/**
 * 获取 Hidden Subagent 列表
 */
export async function listHiddenSubagents(): Promise<AgentConfig[]> {
  return invoke<AgentConfig[]>('list_hidden_subagents');
}

/**
 * 创建 Personal Subagent
 */
export async function createPersonalSubagent(
  request: CreatePersonalSubagentRequest
): Promise<AgentConfig> {
  return invoke<AgentConfig>('create_personal_subagent', {
    name: request.name,
    displayName: request.displayName,
    description: request.description,
    modelProvider: request.model.provider,
    modelId: request.model.modelId,
    temperature: request.model.temperature,
    maxTokens: request.model.maxTokens,
    prompt: request.prompt,
    triggerMode: request.trigger.mode,
    triggerKeywords: request.trigger.keywords,
    allowedTools: request.tools.allowed,
  });
}

/**
 * 更新 Personal Subagent
 */
export async function updatePersonalSubagent(
  name: string,
  request: UpdatePersonalSubagentRequest
): Promise<AgentConfig> {
  return invoke<AgentConfig>('update_personal_subagent', {
    name,
    displayName: request.displayName,
    description: request.description,
    prompt: request.prompt,
    enabled: request.enabled,
  });
}

/**
 * 删除 Personal Subagent
 */
export async function deletePersonalSubagent(name: string): Promise<void> {
  return invoke<void>('delete_personal_subagent', { name });
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
