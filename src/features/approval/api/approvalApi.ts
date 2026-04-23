/**
 * Approval 模块 API 封装
 * Task 148 - Approval审批中心模块
 */

import { safeInvoke } from '@/lib/tauri'
import type {
  ApprovalFlow,
  FlowListItem,
  ApprovalRecord,
  RecordListItem,
  ApprovalStats,
  CreateFlowRequest,
  UpdateFlowRequest,
  CreateRecordRequest,
  ApproveRequest,
} from '../types/approval.types'

// ==================== 流程 API ====================

export async function createFlow(request: CreateFlowRequest, createdBy: string): Promise<ApprovalFlow> {
  const result = await safeInvoke<ApprovalFlow>('approval_create_flow', { request, createdBy })
  return result ?? ({} as ApprovalFlow)
}

export async function listFlows(): Promise<FlowListItem[]> {
  const result = await safeInvoke<FlowListItem[]>('approval_list_flows')
  return result ?? []
}

export async function getFlow(id: string): Promise<ApprovalFlow> {
  const result = await safeInvoke<ApprovalFlow>('approval_get_flow', { id })
  return result ?? ({} as ApprovalFlow)
}

export async function updateFlow(id: string, request: UpdateFlowRequest): Promise<ApprovalFlow> {
  const result = await safeInvoke<ApprovalFlow>('approval_update_flow', { id, request })
  return result ?? ({} as ApprovalFlow)
}

export async function deleteFlow(id: string): Promise<void> {
  await safeInvoke('approval_delete_flow', { id })
}

// ==================== 记录 API ====================

export async function createRecord(request: CreateRecordRequest): Promise<ApprovalRecord> {
  const result = await safeInvoke<ApprovalRecord>('approval_create_record', { request })
  return result ?? ({} as ApprovalRecord)
}

export async function listRecords(status?: string): Promise<RecordListItem[]> {
  const result = await safeInvoke<RecordListItem[]>('approval_list_records', { status })
  return result ?? []
}

export async function getRecord(id: string): Promise<ApprovalRecord> {
  const result = await safeInvoke<ApprovalRecord>('approval_get_record', { id })
  return result ?? ({} as ApprovalRecord)
}

export async function approveRecord(id: string, request: ApproveRequest): Promise<ApprovalRecord> {
  const result = await safeInvoke<ApprovalRecord>('approval_approve', { id, request })
  return result ?? ({} as ApprovalRecord)
}

export async function rejectRecord(id: string, request: ApproveRequest): Promise<ApprovalRecord> {
  const result = await safeInvoke<ApprovalRecord>('approval_reject', { id, request })
  return result ?? ({} as ApprovalRecord)
}

export async function cancelRecord(id: string): Promise<ApprovalRecord> {
  const result = await safeInvoke<ApprovalRecord>('approval_cancel', { id })
  return result ?? ({} as ApprovalRecord)
}

export async function getApprovalStats(): Promise<ApprovalStats> {
  const result = await safeInvoke<ApprovalStats>('approval_get_stats')
  return result ?? ({} as ApprovalStats)
}

// ==================== API 汇总导出 ====================

export const approvalApi = {
  createFlow,
  listFlows,
  getFlow,
  updateFlow,
  deleteFlow,
  createRecord,
  listRecords,
  getRecord,
  approveRecord,
  rejectRecord,
  cancelRecord,
  getStats: getApprovalStats,
}
