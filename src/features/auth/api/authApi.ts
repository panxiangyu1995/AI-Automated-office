import { useAuthStore } from '@/stores/authStore'
import type {
  ApiEnvelope,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TokenPair,
} from '../types/auth.types'

const REQUEST_TIMEOUT_MS = 10000
const AUTH_API_BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

let refreshTokenInFlight: Promise<TokenPair> | null = null

function buildAuthUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  try {
    const base = new URL(AUTH_API_BASE_URL)
    const basePath = base.pathname.replace(/\/+$/, '')

    const dedupedPath =
      basePath && basePath !== '/' && normalizedPath.startsWith(`${basePath}/`)
        ? normalizedPath.slice(basePath.length)
        : normalizedPath

    return `${base.origin}${basePath}${dedupedPath}`
  } catch {
    return `${AUTH_API_BASE_URL}${normalizedPath}`
  }
}

async function refreshAccessTokenOrThrow() {
  if (!refreshTokenInFlight) {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      throw new Error('AUTH_UNAUTHORIZED')
    }

    refreshTokenInFlight = requestAuthApi<TokenPair>(
      '/api/v1/auth/refresh',
      { refresh_token: refreshToken },
      { skipAuth: true, retryOnUnauthorized: false }
    ).finally(() => {
      refreshTokenInFlight = null
    })
  }

  const refreshedTokens = await refreshTokenInFlight
  useAuthStore.getState().updateToken(refreshedTokens.accessToken, refreshedTokens.refreshToken)
  return refreshedTokens
}

async function requestAuthApi<T>(
  path: string,
  payload: Record<string, unknown>,
  options: { skipAuth?: boolean; retryOnUnauthorized?: boolean } = {}
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (!options.skipAuth) {
      const accessToken = useAuthStore.getState().accessToken
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }
    }

    const response = await fetch(buildAuthUrl(path), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (
      response.status === 401 &&
      !options.skipAuth &&
      options.retryOnUnauthorized !== false
    ) {
      await refreshAccessTokenOrThrow()
      return requestAuthApi<T>(path, payload, {
        ...options,
        retryOnUnauthorized: false,
      })
    }

    const result = (await response.json()) as ApiEnvelope<T>

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || '请求失败')
    }

    return result.data
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('AUTH_API_TIMEOUT')
    }

    if (err instanceof Error && err.message === 'AUTH_UNAUTHORIZED') {
      await useAuthStore.getState().clearAuthSession()
      throw new Error('登录状态已过期，请重新登录')
    }

    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const authApi = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    return requestAuthApi<LoginResponse>(
      '/api/v1/auth/login',
      {
        username: request.username,
        password: request.password,
        remember_me: request.rememberMe,
      },
      { skipAuth: true, retryOnUnauthorized: false }
    )
  },

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return requestAuthApi<RegisterResponse>(
      '/api/v1/auth/register',
      {
        username: request.username,
        password: request.password,
        name: request.name,
        department: request.department,
      },
      { skipAuth: true, retryOnUnauthorized: false }
    )
  },

  async forgotPassword(username: string): Promise<ForgotPasswordResponse> {
    return requestAuthApi<ForgotPasswordResponse>(
      '/api/v1/auth/forgot-password',
      { username },
      { skipAuth: true, retryOnUnauthorized: false }
    )
  },

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return requestAuthApi<TokenPair>(
      '/api/v1/auth/refresh',
      { refresh_token: refreshToken },
      { skipAuth: true, retryOnUnauthorized: false }
    )
  },
}

export function resolveAuthErrorMessage(err: unknown, mode: 'login' | 'register'): string {
  if (err instanceof Error && err.message === 'AUTH_API_TIMEOUT') {
    return '认证服务响应超时，请稍后重试'
  }

  if (err instanceof Error) {
    return err.message
  }

  if (typeof err === 'string') {
    return err
  }

  return mode === 'login' ? '登录失败，请检查账号或密码' : '注册失败，请检查输入信息'
}
