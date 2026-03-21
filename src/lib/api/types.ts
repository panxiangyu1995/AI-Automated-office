/**
 * API Types
 *
 * Shared type definitions for API requests and responses.
 * These types must match the backend DTOs.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RetryBackoff = 'exponential' | 'fixed'

// ==================== API Response Types ====================

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

/**
 * Standard 403 Forbidden response from backend
 * Matches cloud-server/pkg/response/forbidden.go:ForbiddenResponse
 */
export interface ForbiddenResponse {
  success: false
  code: string
  http_status: 403
  message: string
  resource?: string
  required_permission?: string
  apply_entry?: string
  trace_id?: string
  details?: Record<string, string>
}

// ==================== Pagination Types ====================

export interface PaginationParams {
  page?: number
  page_size?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ==================== Common Types ====================

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

// ==================== User Types ====================

export interface UserSummary {
  id: string
  real_name: string
  employee_code: string
  avatar_url?: string
}

export interface UserDetail {
  id: string
  tenant_id: string
  employee_code: string
  real_name: string
  email: string
  phone?: string
  status: 'active' | 'inactive' | 'locked'
  hire_date?: string
  avatar_url?: string
  departments: Array<{ id: string; name: string }>
  roles: Array<{ id: string; name: string }>
  positions: Array<{ id: string; name: string }>
  created_at: string
  updated_at: string
}

// ==================== Department Types ====================

export interface DepartmentTree {
  id: string
  name: string
  parent_id?: string
  level: number
  path: string
  children: DepartmentTree[]
}

export interface DepartmentOption {
  id: string
  name: string
  parent_id?: string
}

// ==================== Role Types ====================

export interface RoleSummary {
  id: string
  name: string
  description?: string
  is_builtin: boolean
}

// ==================== Session Types ====================

export interface SessionInfo {
  id: string
  user_agent: string
  ip_address: string
  created_at: string
  last_active_at: string
  expires_at: string
  is_current: boolean
}

// ==================== Audit Types ====================

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
  trace_id?: string
  created_at: string
}

export interface AuditLogDetail extends AuditLogItem {
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  user_agent?: string
}

// ==================== Import/Export Types ====================

export interface ImportResult {
  batch_id: string
  total_rows: number
  success_rows: number
  failed_rows: number
  errors?: Array<{ row: number; message: string }>
}

export interface ExportOptions {
  format: 'csv' | 'excel'
  fields?: string[]
  filters?: Record<string, unknown>
}

// ==================== Permission Types ====================

export interface PermissionCheck {
  resource: string
  action: string
  allowed: boolean
}

export interface UserPermission {
  resource: string
  actions: string[]
}