import { invoke } from '@tauri-apps/api/core'
import {
  applyRequestInterceptors,
  parseResponseBody,
  toApiError,
} from './interceptors'
import type {
  ApiClientConfig,
  ApiError,
  HttpRequest,
  HttpResponse,
  QueuedRequest,
  RequestConfig,
} from './types'

type RefreshHandler = () => Promise<string | null>

const defaultConfig: ApiClientConfig = {
  baseUrl: '',
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  retryBackoff: 'exponential',
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const shouldRetry = (error: ApiError, attempt: number, retryCount: number) => {
  if (attempt >= retryCount) return false
  if (error.code === 'ERR_NETWORK' || error.code === 'ERR_TIMEOUT') return true
  if (error.status && error.status >= 500) return true
  return false
}

const isWriteMethod = (method: string) =>
  method === 'POST' || method === 'PUT' || method === 'DELETE'

/**
 * 请求去重器 - 防止同一请求重复发送
 */
class RequestDeduplicator {
  private pending = new Map<string, Promise<unknown>>()

  /**
   * 生成请求唯一key
   */
  private getKey(method: string, url: string, data?: unknown): string {
    return `${method}:${url}:${JSON.stringify(data ?? {})}`
  }

  /**
   * 检查是否有相同请求正在执行
   */
  has(method: string, url: string, data?: unknown): boolean {
    const key = this.getKey(method, url, data)
    return this.pending.has(key)
  }

  /**
   * 获取正在执行的相同请求
   */
  get<T>(method: string, url: string, data?: unknown): Promise<T> | undefined {
    const key = this.getKey(method, url, data)
    return this.pending.get(key) as Promise<T> | undefined
  }

  /**
   * 注册请求
   */
  register(method: string, url: string, data: unknown, promise: Promise<unknown>): void {
    const key = this.getKey(method, url, data)
    this.pending.set(key, promise)
    // 请求完成后自动清理
    promise.finally(() => {
      this.pending.delete(key)
    })
  }

  /**
   * 取消注册
   */
  unregister(method: string, url: string, data?: unknown): void {
    const key = this.getKey(method, url, data)
    this.pending.delete(key)
  }

  /**
   * 清除所有挂起的请求
   */
  clear(): void {
    this.pending.clear()
  }
}

const globalDeduplicator = new RequestDeduplicator()

export class ApiClient {
  private config: ApiClientConfig
  private token: string | null = null
  private refreshHandler: RefreshHandler | null = null
  private refreshPromise: Promise<string | null> | null = null

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  setToken(token: string | null) {
    this.token = token
  }

  setRefreshHandler(handler: RefreshHandler | null) {
    this.refreshHandler = handler
  }

  async request<T>(config: RequestConfig): Promise<T> {
    const { method, url, data } = config
    
    // 检查是否有相同的GET请求正在执行（防止重复请求）
    if (method === 'GET') {
      const existingRequest = globalDeduplicator.get<T>(method, url, data)
      if (existingRequest) {
        return existingRequest
      }
      // 注册请求
      const promise = this.executeWithRetry<T>(config)
      globalDeduplicator.register(method, url, data, promise)
      return promise
    }
    
    // 非GET请求直接执行
    return this.executeWithRetry<T>(config)
  }
  
  private async executeWithRetry<T>(config: RequestConfig): Promise<T> {
    let lastError: ApiError | null = null
    for (let attempt = 0; attempt <= this.config.retryCount; attempt += 1) {
      try {
        return await this.executeRequest<T>(config, attempt)
      } catch (error) {
        const apiError = toApiError(error)
        lastError = apiError
        if (shouldRetry(apiError, attempt, this.config.retryCount)) {
          const delayMs =
            this.config.retryBackoff === 'exponential'
              ? this.config.retryDelay * Math.pow(2, attempt)
              : this.config.retryDelay
          await delay(delayMs)
          continue
        }
        throw apiError
      }
    }
    throw lastError ?? {
      success: false,
      code: 'ERR_UNKNOWN',
      message: '请求失败',
    }
  }

  get<T>(url: string, config?: Partial<RequestConfig>) {
    return this.request<T>({ ...config, method: 'GET', url })
  }

  post<T>(url: string, data?: unknown, config?: Partial<RequestConfig>) {
    return this.request<T>({ ...config, method: 'POST', url, data })
  }

  put<T>(url: string, data?: unknown, config?: Partial<RequestConfig>) {
    return this.request<T>({ ...config, method: 'PUT', url, data })
  }

  delete<T>(url: string, config?: Partial<RequestConfig>) {
    return this.request<T>({ ...config, method: 'DELETE', url })
  }

  private async executeRequest<T>(config: RequestConfig, attempt: number): Promise<T> {
    const mergedConfig = applyRequestInterceptors(config, this.token)
    const url = `${this.config.baseUrl}${mergedConfig.url}`

    if (!navigator.onLine && isWriteMethod(mergedConfig.method)) {
      if (mergedConfig.offlineQueue !== false) {
        await this.enqueueOfflineRequest(url, mergedConfig)
      }
      throw {
        success: false,
        code: 'ERR_OFFLINE',
        message: '当前处于离线状态',
      }
    }

    const request: HttpRequest = {
      method: mergedConfig.method,
      url,
      headers: mergedConfig.headers ?? {},
      body: mergedConfig.data ? JSON.stringify(mergedConfig.data) : null,
      timeout: this.config.timeout,
    }

    const response = await invoke<HttpResponse>('http_request', { request })
    const result = parseResponseBody<T>(response)

    if (result.success) {
      return result.data
    }

    if (result.code === 'ERR_UNAUTHORIZED' && !mergedConfig.skipAuth) {
      const refreshed = await this.refreshToken()
      if (refreshed) {
        this.token = refreshed
        if (attempt < this.config.retryCount) {
          // 使用合并后的配置重试，确保使用新的 token
          return this.executeRequest<T>(mergedConfig, attempt + 1)
        }
      }
    }

    throw result
  }

  private async refreshToken(): Promise<string | null> {
    if (!this.refreshHandler) {
      return null
    }
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshHandler().finally(() => {
        this.refreshPromise = null
      })
    }
    return this.refreshPromise
  }

  private async enqueueOfflineRequest(url: string, config: RequestConfig) {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const queued: QueuedRequest = {
      id,
      method: config.method,
      url,
      headers: config.headers ?? {},
      body: config.data ? JSON.stringify(config.data) : undefined,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: this.config.retryCount,
      status: 'pending',
      idempotencyKey: config.idempotencyKey,
    }

    await invoke<string>('enqueue_request', { request: queued })
  }
}
