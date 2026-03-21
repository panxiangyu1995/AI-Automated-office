/**
 * 导入导出 API 封装
 *
 * @module importApi
 * @description 封装用户导入导出相关的 API 调用
 */

import { useAuthStore } from '@/stores/authStore'
import type { ApiEnvelope } from '../types/user.types'
import type {
  ImportPreviewResponse,
  ConfirmImportRequest,
  ConfirmImportResponse,
  ImportReceipt,
  ImportProgress,
  ExportUsersRequest,
  ExportUsersResponse,
  ExportableField,
} from '../types/import.types'

const REQUEST_TIMEOUT_MS = 30000 // 导入导出可能需要更长时间
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  try {
    const base = new URL(API_BASE_URL)
    const basePath = base.pathname.replace(/\/+$/, '')

    const dedupedPath =
      basePath && basePath !== '/' && normalizedPath.startsWith(`${basePath}/`)
        ? normalizedPath.slice(basePath.length)
        : normalizedPath

    return `${base.origin}${basePath}${dedupedPath}`
  } catch {
    return `${API_BASE_URL}${normalizedPath}`
  }
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken
  if (!refreshToken) {
    throw new Error('AUTH_UNAUTHORIZED')
  }

  const response = await fetch(buildApiUrl('/api/v1/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  const result = (await response.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || 'Token refresh failed')
  }

  useAuthStore.getState().updateToken(result.data.accessToken, result.data.refreshToken)
  return result.data.accessToken
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  skipAuth?: boolean
}

async function requestApi<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    let accessToken = useAuthStore.getState().accessToken
    if (!skipAuth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }

    let response = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    // Handle 401 - try to refresh token
    if (response.status === 401 && !skipAuth) {
      try {
        accessToken = await refreshAccessToken()
        headers.Authorization = `Bearer ${accessToken}`
        response = await fetch(buildApiUrl(path), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        })
      } catch {
        await useAuthStore.getState().clearAuthSession()
        throw new Error('登录状态已过期，请重新登录')
      }
    }

    const result = (await response.json()) as ApiEnvelope<T>

    if (!response.ok || !result.success) {
      throw new Error(result.message || result.code || '请求失败')
    }

    return result.data as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('API_TIMEOUT')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 生成唯一幂等性键
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

export const importApi = {
  /**
   * 下载导入模板
   */
  async downloadTemplate(): Promise<Blob> {
    const accessToken = useAuthStore.getState().accessToken
    
    const response = await fetch(buildApiUrl('/api/admin/users/import/template'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('下载模板失败')
    }

    return response.blob()
  },

  /**
   * 上传并预览导入文件
   */
  async uploadAndPreview(file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const accessToken = useAuthStore.getState().accessToken

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000) // 文件上传超时设置为 60 秒

    try {
      const response = await fetch(buildApiUrl('/api/admin/users/import/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
        signal: controller.signal,
      })

      const result = (await response.json()) as ApiEnvelope<ImportPreviewResponse>

      if (!response.ok || !result.success) {
        throw new Error(result.message || '上传失败')
      }

      return result.data as ImportPreviewResponse
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('上传超时，请重试')
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  },

  /**
   * 确认导入
   */
  async confirmImport(request: ConfirmImportRequest): Promise<ConfirmImportResponse> {
    return requestApi<ConfirmImportResponse>('/api/admin/users/import/confirm', {
      method: 'POST',
      body: request,
    })
  },

  /**
   * 获取导入回执
   */
  async getReceipt(batchId: string): Promise<ImportReceipt> {
    return requestApi<ImportReceipt>(`/api/admin/users/import/${batchId}/receipt`)
  },

  /**
   * 下载回执 Excel
   */
  async downloadReceiptExcel(batchId: string): Promise<Blob> {
    const accessToken = useAuthStore.getState().accessToken
    
    const response = await fetch(buildApiUrl(`/api/admin/users/import/${batchId}/receipt/download`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('下载回执失败')
    }

    return response.blob()
  },

  /**
   * 获取导入进度
   */
  async getProgress(batchId: string): Promise<ImportProgress> {
    return requestApi<ImportProgress>(`/api/admin/users/import/${batchId}/progress`)
  },
}

export const exportApi = {
  /**
   * 获取可导出字段列表
   */
  async getExportableFields(): Promise<ExportableField[]> {
    return requestApi<ExportableField[]>('/api/admin/users/export/fields')
  },

  /**
   * 导出用户
   */
  async exportUsers(request: ExportUsersRequest): Promise<ExportUsersResponse> {
    return requestApi<ExportUsersResponse>('/api/admin/users/export', {
      method: 'POST',
      body: request,
    })
  },

  /**
   * 下载导出文件
   */
  async downloadExport(downloadUrl: string): Promise<Blob> {
    const accessToken = useAuthStore.getState().accessToken
    
    const response = await fetch(buildApiUrl(downloadUrl), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('下载文件失败')
    }

    return response.blob()
  },
}

/**
 * 解析错误信息
 */
export function resolveImportErrorMessage(err: unknown, operation: string): string {
  if (err instanceof Error && err.message === 'API_TIMEOUT') {
    return '请求超时，请稍后重试'
  }

  if (err instanceof Error) {
    return err.message
  }

  if (typeof err === 'string') {
    return err
  }

  return `${operation}失败，请稍后重试`
}

/**
 * 触发文件下载
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
