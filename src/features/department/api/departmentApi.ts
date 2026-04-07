/**
 * 部门模块 API 封装
 * Task 146 - 部门模块基础框架
 */

import { invoke } from '@tauri-apps/api/core'
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
  return invoke('department_create', { request })
}

/**
 * 获取部门列表
 */
export async function listDepartments(): Promise<DepartmentListItem[]> {
  return invoke('department_list')
}

/**
 * 获取部门详情
 */
export async function getDepartment(id: string): Promise<DepartmentDetailResponse> {
  return invoke('department_get', { id })
}

/**
 * 更新部门
 */
export async function updateDepartment(
  id: string,
  request: UpdateDepartmentRequest
): Promise<DepartmentPackage> {
  return invoke('department_update', { id, request })
}

/**
 * 删除部门
 */
export async function deleteDepartment(id: string): Promise<void> {
  return invoke('department_delete', { id })
}

/**
 * 启用部门
 */
export async function enableDepartment(id: string): Promise<DepartmentPackage> {
  return invoke('department_enable', { id })
}

/**
 * 禁用部门
 */
export async function disableDepartment(id: string): Promise<DepartmentPackage> {
  return invoke('department_disable', { id })
}

/**
 * 获取部门能力列表
 */
export async function getDepartmentCapabilities(
  id: string
): Promise<DepartmentPackage['capabilities']> {
  return invoke('department_capabilities', { id })
}

/**
 * 加载部门
 */
export async function loadDepartment(id: string): Promise<DepartmentPackage> {
  return invoke('department_load', { id })
}

/**
 * 卸载部门
 */
export async function unloadDepartment(id: string): Promise<void> {
  return invoke('department_unload', { id })
}

/**
 * 获取已加载的部门列表
 */
export async function listLoadedDepartments(): Promise<DepartmentPackage[]> {
  return invoke('department_loaded_list')
}

/**
 * 获取部门加载状态
 */
export async function getDepartmentLoadState(
  id: string
): Promise<DepartmentLoadState | null> {
  return invoke('department_load_state', { id })
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
  return invoke('department_send_message', { from, to, messageType, payload })
}

/**
 * 获取消息历史
 */
export async function getMessageHistory(
  limit?: number
): Promise<DepartmentMessage[]> {
  return invoke('department_message_history', { limit })
}

/**
 * 获取部门消息历史
 */
export async function getDepartmentMessageHistory(
  department: string,
  limit?: number
): Promise<DepartmentMessage[]> {
  return invoke('department_message_history_by_department', {
    department,
    limit,
  })
}

/**
 * 获取部门统计信息
 */
export async function getDepartmentStats(): Promise<DepartmentStats> {
  return invoke('department_stats')
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
