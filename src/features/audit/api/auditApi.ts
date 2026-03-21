/**
 * 审计日志 API 封装
 *
 * @module auditApi
 * @description 封装审计日志相关的 API 调用
 */

import { useAuthStore } from '@/stores/authStore'
import type {
  AuditLogListResponse,
  AuditLogDetail,
  AuditLogQueryParams,
  ExportFormat,
} from '../types/audit.types'

const REQUEST_TIMEOUT_MS = 30000 // 审计导出可能较慢
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

  const result = await response.json()

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || 'Token refresh failed')
  }

  useAuthStore.getState().updateToken(result.data.accessToken, result.data.refreshToken)
  return result.data.accessToken
}

interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
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
 * 构建查询字符串
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export const auditApi = {
  /**
   * 获取审计日志列表
   */
  async listAuditLogs(params: AuditLogQueryParams = {}): Promise<AuditLogListResponse> {
    const queryString = buildQueryString({
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      operator_id: params.operator_id,
      event_type: params.event_type,
      resource: params.resource,
      action: params.action,
      result: params.result,
      start_time: params.start_time,
      end_time: params.end_time,
    })

    return requestApi<AuditLogListResponse>(`/api/v1/audit/logs${queryString}`)
  },

  /**
   * 获取审计日志详情
   */
  async getAuditLog(id: string): Promise<AuditLogDetail> {
    return requestApi<AuditLogDetail>(`/api/v1/audit/logs/${id}`)
  },

  /**
   * 导出审计日志
   */
  async exportAuditLogs(params: AuditLogQueryParams = {}, format: ExportFormat = 'csv'): Promise<void> {
    const queryString = buildQueryString({
      ...params,
      format,
    })

    const accessToken = useAuthStore.getState().accessToken
    if (!accessToken) {
      throw new Error('AUTH_UNAUTHORIZED')
    }

    const response = await fetch(buildApiUrl(`/api/v1/audit/export${queryString}`), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      try {
        const newToken = await refreshAccessToken()
        const retryResponse = await fetch(buildApiUrl(`/api/v1/audit/export${queryString}`), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        })
        if (!retryResponse.ok) {
          throw new Error('导出失败')
        }
        await downloadFile(retryResponse, format)
        return
      } catch {
        await useAuthStore.getState().clearAuthSession()
        throw new Error('登录状态已过期，请重新登录')
      }
    }

    if (!response.ok) {
      throw new Error('导出失败')
    }

    await downloadFile(response, format)
  },
}

/**
 * 下载文件
 */
async function downloadFile(response: Response, format: ExportFormat): Promise<void> {
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.download = `audit_logs_${timestamp}.${format === 'excel' ? 'xlsx' : 'csv'}`
  
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

/**
 * 解析错误信息
 */
export function resolveErrorMessage(err: unknown, operation: string): string {
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
