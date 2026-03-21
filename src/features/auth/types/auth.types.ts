/**
 * 认证相关类型定义
 * 
 * @module auth.types
 * @description 定义用户认证、权限、Token 等相关类型
 */

/**
 * 用户信息
 */
export interface User {
  id: string
  username: string
  name: string
  email?: string
  department: string
  tenant_id?: string
  role: string
  roles?: string[]
  status?: 'active' | 'inactive' | 'suspended'
}

/**
 * 权限摘要
 */
export interface PermissionSummary {
  roles: string[]
  permissions: string[]
  dataScopes: Record<string, string>
  department_ids?: string[]
}

/**
 * Token 对
 */
export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * 登录请求
 */
export interface LoginRequest {
  username: string
  password: string
  rememberMe?: boolean
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
  permissions?: PermissionSummary
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  username: string
  password: string
  name: string
  department?: string
}

/**
 * 注册响应
 */
export interface RegisterResponse {
  user: User
}

/**
 * 认证错误
 */
export interface AuthError {
  code: string
  message: string
}

/**
 * 忘记密码响应
 */
export interface ForgotPasswordResponse {
  accepted: boolean
}

/**
 * API 响应信封
 */
export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  message?: string
  code?: string
}
