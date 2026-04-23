import { safeInvoke } from '@/lib/tauri'

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
  const result = await safeInvoke<ToolDescriptor[]>('list_tools')
  return result ?? []
}

export async function executeBackendTool(
  request: BackendToolExecutionRequest
): Promise<BackendToolExecutionResponse> {
  const result = await safeInvoke<BackendToolExecutionResponse>('execute_tool', { request })
  if (!result) {
    const now = Date.now()
    return {
      result: {
        executionId: `fallback-${now}`,
        toolId: request.toolId,
        status: 'failed',
        output: undefined,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tool execution failed',
          recoverable: false,
          retryable: false,
        },
        duration: 0,
        startedAt: now,
        completedAt: now,
        metadata: {},
      },
    }
  }
  return result
}
