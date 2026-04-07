/**
 * Approval 模块类型定义
 * Task 148 - Approval审批中心模块
 */

export type FlowStatus = 'draft' | 'active' | 'archived'
export type RecordStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface ApprovalStep {
  id: string
  order: number
  approvers: Approver[]
  stepType: 'sequential' | 'parallel'
  condition?: ApprovalCondition
}

export interface ApprovalCondition {
  field: string
  operator: string
  value: unknown
}

export interface Approver {
  id: string
  name: string
  employeeId: string
}

export interface ApprovalFlow {
  id: string
  name: string
  description: string
  steps: ApprovalStep[]
  formSchema: Record<string, unknown>
  status: FlowStatus
  createdBy: string
  createdAt: number
  updatedAt: number
}

export interface ApprovalHistory {
  id: string
  stepId: string
  approverId: string
  approverName: string
  action: string
  comment?: string
  timestamp: number
}

export interface ApprovalRecord {
  id: string
  flowId: string
  flowName: string
  applicantId: string
  applicantName: string
  status: RecordStatus
  currentStep: number
  formData: Record<string, unknown>
  history: ApprovalHistory[]
  createdAt: number
  updatedAt: number
}

export interface CreateFlowRequest {
  name: string
  description: string
  steps: ApprovalStep[]
  formSchema: Record<string, unknown>
}

export interface UpdateFlowRequest {
  name?: string
  description?: string
  steps?: ApprovalStep[]
  formSchema?: Record<string, unknown>
  status?: FlowStatus
}

export interface CreateRecordRequest {
  flowId: string
  applicantId: string
  applicantName: string
  formData: Record<string, unknown>
}

export interface ApproveRequest {
  approverId: string
  approverName: string
  comment?: string
}

export interface FlowListItem {
  id: string
  name: string
  description: string
  status: FlowStatus
  stepCount: number
  createdBy: string
  createdAt: number
}

export interface RecordListItem {
  id: string
  flowName: string
  applicantName: string
  status: RecordStatus
  currentStep: number
  createdAt: number
}

export interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已撤回',
}

export const RECORD_STATUS_COLORS: Record<RecordStatus, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

export const FLOW_STATUS_LABELS: Record<FlowStatus, string> = {
  draft: '草稿',
  active: '启用',
  archived: '归档',
}

export const FLOW_STATUS_COLORS: Record<FlowStatus, string> = {
  draft: 'bg-gray-400',
  active: 'bg-green-500',
  archived: 'bg-blue-400',
}
