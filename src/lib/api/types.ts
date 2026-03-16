export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type RetryBackoff = 'exponential' | 'fixed'

export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  retryCount: number
  retryDelay: number
  retryBackoff: RetryBackoff
}

export interface RequestConfig {
  method: HttpMethod
  url: string
  data?: unknown
  headers?: Record<string, string>
  skipAuth?: boolean
  idempotencyKey?: string
  offlineQueue?: boolean
}

export interface ApiResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiError {
  success: false
  code: string
  message: string
  details?: Record<string, string>
  status?: number
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export interface HttpRequest {
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string | null
  timeout?: number
}

export interface HttpResponse {
  status: number
  ok: boolean
  body?: string | null
  headers?: Record<string, string>
}

export interface QueuedRequest {
  id: string
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string
  createdAt: number
  retryCount: number
  maxRetries: number
  status: 'pending' | 'processing' | 'failed' | 'synced'
  lastError?: string
  idempotencyKey?: string
}
