/**
 * Approval 模块 API 封装
 * Task 148 - Approval审批中心模块
 */

import { invoke } from '@tauri-apps/api/core'
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
  return invoke('approval_create_flow', { request, createdBy })
}

export async function listFlows(): Promise<FlowListItem[]> {
  return invoke('approval_list_flows')
}

export async function getFlow(id: string): Promise<ApprovalFlow> {
  return invoke('approval_get_flow', { id })
}

export async function updateFlow(id: string, request: UpdateFlowRequest): Promise<ApprovalFlow> {
  return invoke('approval_update_flow', { id, request })
}

export async function deleteFlow(id: string): Promise<void> {
  return invoke('approval_delete_flow', { id })
}

// ==================== 记录 API ====================

export async function createRecord(request: CreateRecordRequest): Promise<ApprovalRecord> {
  return invoke('approval_create_record', { request })
}

export async function listRecords(status?: string): Promise<RecordListItem[]> {
  return invoke('approval_list_records', { status })
}

export async function getRecord(id: string): Promise<ApprovalRecord> {
  return invoke('approval_get_record', { id })
}

export async function approveRecord(id: string, request: ApproveRequest): Promise<ApprovalRecord> {
  return invoke('approval_approve', { id, request })
}

export async function rejectRecord(id: string, request: ApproveRequest): Promise<ApprovalRecord> {
  return invoke('approval_reject', { id, request })
}

export async function cancelRecord(id: string): Promise<ApprovalRecord> {
  return invoke('approval_cancel', { id })
}

export async function getApprovalStats(): Promise<ApprovalStats> {
  return invoke('approval_get_stats')
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
