/**
 * 用户管理 API 封装
 *
 * @module userApi
 * @description 封装用户管理相关的 API 调用
 */

import { useAuthStore } from '@/stores/authStore'
import type {
  ApiEnvelope,
  ListUsersRequest,
  ListUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UserDetail,
  UpdateStatusRequest,
  UpdateManagerRequest,
  ManagerChainResponse,
  SubordinatesResponse,
  ManagerSearchResponse,
  UserSummary,
} from '../types/user.types'

const REQUEST_TIMEOUT_MS = 15000
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

export const userApi = {
  /**
   * 获取用户列表
   */
  async listUsers(params: ListUsersRequest = {}): Promise<ListUsersResponse> {
    const queryString = buildQueryString({
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      name: params.name,
      employee_code: params.employee_code,
      department_id: params.department_id,
      status: params.status,
    })

    return requestApi<ListUsersResponse>(`/api/admin/users${queryString}`)
  },

  /**
   * 获取用户详情
   */
  async getUser(userId: string): Promise<UserDetail> {
    return requestApi<UserDetail>(`/api/admin/users/${userId}`)
  },

  /**
   * 创建用户
   */
  async createUser(request: CreateUserRequest): Promise<CreateUserResponse> {
    return requestApi<CreateUserResponse>('/api/admin/users', {
      method: 'POST',
      body: request,
    })
  },

  /**
   * 更新用户
   */
  async updateUser(userId: string, request: UpdateUserRequest): Promise<{ id: string }> {
    return requestApi<{ id: string }>(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: request,
    })
  },

  /**
   * 更新用户状态
   */
  async updateUserStatus(userId: string, request: UpdateStatusRequest): Promise<{ id: string; status: string }> {
    return requestApi<{ id: string; status: string }>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: request,
    })
  },

  /**
   * 更新用户上级
   */
  async updateManager(userId: string, request: UpdateManagerRequest): Promise<{ id: string }> {
    return requestApi<{ id: string }>(`/api/admin/users/${userId}/manager`, {
      method: 'PUT',
      body: request,
    })
  },

  /**
   * 获取用户上级链
   */
  async getManagerChain(userId: string): Promise<ManagerChainResponse> {
    return requestApi<ManagerChainResponse>(`/api/admin/users/${userId}/managers`)
  },

  /**
   * 获取用户直接下属
   */
  async getSubordinates(userId: string): Promise<SubordinatesResponse> {
    return requestApi<SubordinatesResponse>(`/api/admin/users/${userId}/subordinates`)
  },

  /**
   * 搜索可选上级的用户
   */
  async searchUsersForManager(userId: string, query: string, limit: number = 10): Promise<UserSummary[]> {
    const queryString = buildQueryString({
      user_id: userId,
      q: query,
      limit,
    })
    const response = await requestApi<ManagerSearchResponse>(`/api/admin/users/search-for-manager${queryString}`)
    return response.items
  },
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
