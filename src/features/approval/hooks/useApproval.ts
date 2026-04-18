/**
 * Approval 模块 Hooks - 使用统一 Hooks 封装
 * Phase 11-20: 应用统一Hooks到各业务模块
 * 
 * 使用简化的模式：useTauriCommand + invokeCommand
 */

import { useMemo } from 'react'
import { useTauriCommand } from '@/hooks/useTauriCommand'
import type {
  ApprovalFlow,
  FlowListItem,
  ApprovalRecord,
  RecordListItem,
  ApprovalStats,
} from '../types/approval.types'

// ==================== 流程 Hooks ====================

/**
 * 获取流程列表
 */
export function useApprovalFlows() {
  return useTauriCommand<FlowListItem[]>({
    command: 'approval_list_flows',
  })
}

/**
 * 获取单个流程
 */
export function useApprovalFlow(id: string | null) {
  return useTauriCommand<ApprovalFlow | null>({
    command: 'approval_get_flow',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建流程
 */
export function useCreateFlow() {
  return useTauriCommand<ApprovalFlow>({
    command: 'approval_create_flow',
  })
}

/**
 * 更新流程
 */
export function useUpdateFlow() {
  return useTauriCommand<ApprovalFlow>({
    command: 'approval_update_flow',
  })
}

/**
 * 删除流程
 */
export function useDeleteFlow() {
  return useTauriCommand<void>({
    command: 'approval_delete_flow',
  })
}

// ==================== 记录 Hooks ====================

/**
 * 获取审批记录列表
 */
export function useApprovalRecords(status?: string) {
  return useTauriCommand<RecordListItem[]>({
    command: 'approval_list_records',
    params: status ? { status } : undefined,
  })
}

/**
 * 获取单个审批记录
 */
export function useApprovalRecord(id: string | null) {
  return useTauriCommand<ApprovalRecord | null>({
    command: 'approval_get_record',
    params: id ? { id } : undefined,
  })
}

/**
 * 提交审批
 */
export function useSubmitApproval() {
  return useTauriCommand<ApprovalRecord>({
    command: 'approval_create_record',
  })
}

/**
 * 审批通过
 */
export function useApprove() {
  return useTauriCommand<ApprovalRecord>({
    command: 'approval_approve',
  })
}

/**
 * 审批驳回
 */
export function useReject() {
  return useTauriCommand<ApprovalRecord>({
    command: 'approval_reject',
  })
}

/**
 * 撤回审批
 */
export function useCancelApproval() {
  return useTauriCommand<ApprovalRecord>({
    command: 'approval_cancel',
  })
}

/**
 * 获取审批统计
 */
export function useApprovalStats() {
  return useTauriCommand<ApprovalStats>({
    command: 'approval_get_stats',
  })
}

// ==================== 辅助 Hooks ====================

/**
 * 审批仪表盘 Hook（组合多个数据源）
 */
export function useApprovalDashboard() {
  const stats = useApprovalStats()
  const recentRecords = useApprovalRecords('pending')

  return useMemo(
    () => ({
      stats,
      recentRecords,
      isLoading: stats.loading || recentRecords.loading,
      error: stats.error || recentRecords.error,
    }),
    [stats, recentRecords]
  )
}
