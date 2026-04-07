/**
 * 部门模块类型定义
 * Task 146 - 部门模块基础框架
 */

// 部门代码
export type DepartmentCode =
  | 'hr'
  | 'approval'
  | 'sales'
  | 'finance'
  | 'warehouse'
  | 'management'
  | string

// 部门状态
export type DepartmentStatus =
  | 'active'
  | 'inactive'
  | 'loading'
  | 'unloading'
  | 'error'

// 消息类型
export type MessageType =
  | 'data_request'
  | 'data_response'
  | 'event'
  | 'delegate'
  | 'cross_query'
  | 'status_change'

// 消息状态
export type MessageStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

// 能力描述
export interface Capability {
  id: string
  name: string
  description: string
  capabilityType: string
  enabled: boolean
  config: Record<string, unknown>
}

// 工具描述
export interface ToolDescriptor {
  id: string
  name: string
  description: string
  parameters: Record<string, unknown>
  permissions: string[]
}

// 技能描述
export interface SkillDescriptor {
  id: string
  name: string
  description: string
  skillFile: string
  requiredTools: string[]
}

// 路由配置
export interface RouteConfig {
  path: string
  name: string
  component: string
  permissions: string[]
}

// 入口点配置
export interface EntryPoint {
  id: string
  name: string
  icon: string
  route: string
  weight: number
}

// 部门能力包
export interface DepartmentPackage {
  id: string
  code: DepartmentCode
  name: string
  version: string
  description: string
  capabilities: Capability[]
  dependencies: DepartmentCode[]
  tools: ToolDescriptor[]
  skills: SkillDescriptor[]
  routes: RouteConfig[]
  entryPoints: EntryPoint[]
  status: DepartmentStatus
  loadedAt?: number
  createdAt: number
  updatedAt: number
}

// 部门消息
export interface DepartmentMessage {
  id: string
  from: DepartmentCode
  to: DepartmentCode
  messageType: MessageType
  payload: unknown
  correlationId?: string
  timestamp: number
  status: MessageStatus
}

// 消息响应
export interface MessageResponse {
  messageId: string
  status: MessageStatus
  responseData?: unknown
  error?: string
}

// 创建部门请求
export interface CreateDepartmentRequest {
  code: DepartmentCode
  name: string
  version?: string
  description?: string
  dependencies?: DepartmentCode[]
}

// 更新部门请求
export interface UpdateDepartmentRequest {
  name?: string
  version?: string
  description?: string
  status?: DepartmentStatus
}

// 部门列表项
export interface DepartmentListItem {
  id: string
  code: string
  name: string
  status: DepartmentStatus
  version: string
  description: string
  capabilityCount: number
  toolCount: number
  loadedAt?: number
}

// 部门详情响应
export interface DepartmentDetailResponse {
  department: DepartmentPackage
  capabilities: Capability[]
  tools: ToolDescriptor[]
  skills: SkillDescriptor[]
  routes: RouteConfig[]
}

// 部门加载状态
export interface DepartmentLoadState {
  departmentId: string
  isLoaded: boolean
  loadStartedAt?: number
  loadCompletedAt?: number
  error?: string
}

// 部门统计
export interface DepartmentStats {
  total: number
  loaded: number
  subscribers: number
}

// 部门错误码
export enum DepartmentErrorCode {
  CodeExists = 'DEPT_001',
  NotFound = 'DEPT_002',
  DependencyNotLoaded = 'DEPT_003',
  LoadFailed = 'DEPT_004',
  UnloadFailed = 'DEPT_005',
  MessageSendFailed = 'DEPT_006',
  InternalError = 'DEPT_999',
}

// 部门错误
export interface DepartmentError {
  code: DepartmentErrorCode
  message: string
}

// 部门图标映射
export const DEPARTMENT_ICONS: Record<string, string> = {
  hr: 'Users',
  approval: 'FileCheck',
  sales: 'TrendingUp',
  finance: 'Wallet',
  warehouse: 'Package',
  management: 'BarChart3',
}

// 部门颜色映射
export const DEPARTMENT_COLORS: Record<string, string> = {
  hr: '#4F46E5',
  approval: '#059669',
  sales: '#D97706',
  finance: '#DC2626',
  warehouse: '#0891B2',
  management: '#7C3AED',
}
