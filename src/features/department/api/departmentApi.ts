/**
 * 部门模块 API 封装
 * Task 146 - 部门模块基础框架
 */

import { safeInvoke } from '@/lib/tauri'
import type {
  DepartmentPackage,
  DepartmentListItem,
  DepartmentDetailResponse,
  DepartmentLoadState,
  DepartmentMessage,
  MessageResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentStats,
} from '../types/department'

/**
 * 创建部门
 */
export async function createDepartment(
  request: CreateDepartmentRequest
): Promise<DepartmentPackage> {
  const result = await safeInvoke<DepartmentPackage>('department_create', { request })
  return result ?? ({} as DepartmentPackage)
}

/**
 * 获取部门列表
 */
export async function listDepartments(): Promise<DepartmentListItem[]> {
  const result = await safeInvoke<DepartmentListItem[]>('department_list')
  return result ?? []
}

/**
 * 获取部门详情
 */
export async function getDepartment(id: string): Promise<DepartmentDetailResponse> {
  const result = await safeInvoke<DepartmentDetailResponse>('department_get', { id })
  return result ?? ({} as DepartmentDetailResponse)
}

/**
 * 更新部门
 */
export async function updateDepartment(
  id: string,
  request: UpdateDepartmentRequest
): Promise<DepartmentPackage> {
  const result = await safeInvoke<DepartmentPackage>('department_update', { id, request })
  return result ?? ({} as DepartmentPackage)
}

/**
 * 删除部门
 */
export async function deleteDepartment(id: string): Promise<void> {
  await safeInvoke('department_delete', { id })
}

/**
 * 启用部门
 */
export async function enableDepartment(id: string): Promise<DepartmentPackage> {
  const result = await safeInvoke<DepartmentPackage>('department_enable', { id })
  return result ?? ({} as DepartmentPackage)
}

/**
 * 禁用部门
 */
export async function disableDepartment(id: string): Promise<DepartmentPackage> {
  const result = await safeInvoke<DepartmentPackage>('department_disable', { id })
  return result ?? ({} as DepartmentPackage)
}

/**
 * 获取部门能力列表
 */
export async function getDepartmentCapabilities(
  id: string
): Promise<DepartmentPackage['capabilities']> {
  const result = await safeInvoke<DepartmentPackage['capabilities']>('department_capabilities', { id })
  return result ?? []
}

/**
 * 加载部门
 */
export async function loadDepartment(id: string): Promise<DepartmentPackage> {
  const result = await safeInvoke<DepartmentPackage>('department_load', { id })
  return result ?? ({} as DepartmentPackage)
}

/**
 * 卸载部门
 */
export async function unloadDepartment(id: string): Promise<void> {
  await safeInvoke('department_unload', { id })
}

/**
 * 获取已加载的部门列表
 */
export async function listLoadedDepartments(): Promise<DepartmentPackage[]> {
  const result = await safeInvoke<DepartmentPackage[]>('department_loaded_list')
  return result ?? []
}

/**
 * 获取部门加载状态
 */
export async function getDepartmentLoadState(
  id: string
): Promise<DepartmentLoadState | null> {
  const result = await safeInvoke<DepartmentLoadState | null>('department_load_state', { id })
  return result ?? null
}

/**
 * 发送部门消息
 */
export async function sendDepartmentMessage(
  from: string,
  to: string,
  messageType: string,
  payload: unknown
): Promise<MessageResponse> {
  const result = await safeInvoke<MessageResponse>('department_send_message', { from, to, messageType, payload })
  return result ?? ({} as MessageResponse)
}

/**
 * 获取消息历史
 */
export async function getMessageHistory(
  limit?: number
): Promise<DepartmentMessage[]> {
  const result = await safeInvoke<DepartmentMessage[]>('department_message_history', { limit })
  return result ?? []
}

/**
 * 获取部门消息历史
 */
export async function getDepartmentMessageHistory(
  department: string,
  limit?: number
): Promise<DepartmentMessage[]> {
  const result = await safeInvoke<DepartmentMessage[]>('department_message_history_by_department', {
    department,
    limit,
  })
  return result ?? []
}

/**
 * 获取部门统计信息
 */
export async function getDepartmentStats(): Promise<DepartmentStats> {
  const result = await safeInvoke<DepartmentStats>('department_stats')
  return result ?? ({} as DepartmentStats)
}

/**
 * 部门 API 汇总导出
 */
export const departmentApi = {
  create: createDepartment,
  list: listDepartments,
  get: getDepartment,
  update: updateDepartment,
  delete: deleteDepartment,
  enable: enableDepartment,
  disable: disableDepartment,
  getCapabilities: getDepartmentCapabilities,
  load: loadDepartment,
  unload: unloadDepartment,
  listLoaded: listLoadedDepartments,
  getLoadState: getDepartmentLoadState,
  sendMessage: sendDepartmentMessage,
  getMessageHistory,
  getDepartmentMessageHistory,
  getStats: getDepartmentStats,
}
