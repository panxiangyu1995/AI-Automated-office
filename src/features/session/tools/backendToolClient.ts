import { invoke } from '@tauri-apps/api/core'

import type { ToolDescriptor } from './toolDescriptor'
import type { ToolExecutionResult } from './toolExecutor'

export interface BackendToolExecutionContext {
  sessionId: string
  userId: string
  tenantId: string
  departmentId?: string
  pageId?: string
  resourceId?: string
  permissions: string[]
  metadata?: Record<string, unknown>
}

export interface BackendToolExecutionRequest {
  toolId: string
  parameters: Record<string, unknown>
  context: BackendToolExecutionContext
  executionId?: string
  parentExecutionId?: string
  timeoutMs?: number
  metadata?: Record<string, unknown>
  messageId?: string
}

export interface BackendToolConfirmationRequest {
  message: string
  options: string[]
  riskLevel: string
}

export interface BackendPermissionResult {
  allowed: boolean
  reason?: string
  required: string[]
  missing: string[]
}

export interface BackendSensitivityAssessment {
  riskLevel: string
  requiresConfirmation: boolean
  blocked: boolean
  reason?: string
  matchedRules: string[]
}

export interface BackendToolExecutionResponse {
  result: ToolExecutionResult
  confirmation?: BackendToolConfirmationRequest
  permission?: BackendPermissionResult
  sensitivity?: BackendSensitivityAssessment
}

export async function listBackendTools(): Promise<ToolDescriptor[]> {
  return invoke<ToolDescriptor[]>('list_tools')
}

export async function executeBackendTool(
  request: BackendToolExecutionRequest
): Promise<BackendToolExecutionResponse> {
  return invoke<BackendToolExecutionResponse>('execute_tool', { request })
}
