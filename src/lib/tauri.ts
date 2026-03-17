import { invoke } from '@tauri-apps/api/core'
import type { QueuedRequest } from './api/types'

/**
 * Tauri 命令封装
 * 提供类型安全的 Rust 后端调用接口
 */

// 系统命令
export const getAppVersion = async (): Promise<string> => {
  return invoke('get_app_version')
}

export const getPlatform = async (): Promise<string> => {
  return invoke('get_platform')
}

// 配置命令
export const getConfig = async <T>(key: string): Promise<T | null> => {
  return invoke('get_config', { key })
}

export const setConfig = async (key: string, value: unknown): Promise<void> => {
  return invoke('set_config', { key, value })
}

// 存储命令
export const getStorage = async <T>(key: string): Promise<T | null> => {
  return invoke('get_storage', { key })
}

export const setStorage = async (key: string, value: unknown): Promise<void> => {
  return invoke('set_storage', { key, value })
}

export const removeStorage = async (key: string): Promise<void> => {
  return invoke('remove_storage', { key })
}

// 网络状态
/**
 * 检测当前网络连通状态
 */
export const checkNetworkStatus = async (): Promise<boolean> => {
  return invoke('check_network_status')
}

export interface SyncResult {
  id: string
  success: boolean
  status_code?: number
  error?: string
}

/**
 * 获取待同步的请求列表
 */
export const getPendingRequests = async (): Promise<QueuedRequest[]> => {
  return invoke('get_pending_requests')
}

/**
 * 处理待同步的请求并返回结果
 */
export const processPendingRequests = async (): Promise<SyncResult[]> => {
  return invoke('process_pending_requests')
}
