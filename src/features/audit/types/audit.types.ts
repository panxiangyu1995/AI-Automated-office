/**
 * 审计日志类型定义
 */

export interface AuditLogItem {
  id: string
  tenant_id: string
  operator_id?: string
  operator_name?: string
  target_id?: string
  target_type?: string
  event_type: string
  resource: string
  action: string
  result: 'success' | 'failure'
  ip_address?: string
  user_agent?: string
  trace_id?: string
  created_at: string
}

export interface AuditLogDetail extends AuditLogItem {
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
}

export interface AuditLogListResponse {
  list: AuditLogItem[]
  total: number
}

export interface AuditLogQueryParams {
  page?: number
  page_size?: number
  operator_id?: string
  event_type?: string
  resource?: string
  action?: string
  result?: 'success' | 'failure'
  start_time?: string
  end_time?: string
}

export type ExportFormat = 'csv' | 'excel'

// 事件类型选项
export const EVENT_TYPE_OPTIONS = [
  { value: 'auth.login', label: '登录' },
  { value: 'auth.logout', label: '登出' },
  { value: 'user.created', label: '用户创建' },
  { value: 'user.updated', label: '用户更新' },
  { value: 'user.deleted', label: '用户删除' },
  { value: 'user.status_changed', label: '用户状态变更' },
  { value: 'role.created', label: '角色创建' },
  { value: 'role.updated', label: '角色更新' },
  { value: 'role.deleted', label: '角色删除' },
  { value: 'permission.granted', label: '权限授予' },
  { value: 'permission.revoked', label: '权限撤销' },
  { value: 'session.revoked', label: '会话撤销' },
  { value: 'import.completed', label: '导入完成' },
  { value: 'export.completed', label: '导出完成' },
] as const

// 资源类型选项
export const RESOURCE_OPTIONS = [
  { value: 'user', label: '用户' },
  { value: 'role', label: '角色' },
  { value: 'department', label: '部门' },
  { value: 'permission', label: '权限' },
  { value: 'session', label: '会话' },
  { value: 'import', label: '导入' },
  { value: 'export', label: '导出' },
] as const

// 操作类型选项
export const ACTION_OPTIONS = [
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'enable', label: '启用' },
  { value: 'disable', label: '禁用' },
  { value: 'grant', label: '授予' },
  { value: 'revoke', label: '撤销' },
  { value: 'login', label: '登录' },
  { value: 'logout', label: '登出' },
] as const

// 结果选项
export const RESULT_OPTIONS = [
  { value: 'success', label: '成功' },
  { value: 'failure', label: '失败' },
] as const
