// 应用常量定义

export const APP_NAME = 'AI-Automated-office'

export const APP_VERSION = '0.1.0'

// 窗口尺寸
export const WINDOW_MIN_WIDTH = 1024
export const WINDOW_MIN_HEIGHT = 600
export const WINDOW_DEFAULT_WIDTH = 1280
export const WINDOW_DEFAULT_HEIGHT = 800

// API 配置
export const API_TIMEOUT = 30000 // 30 seconds

// 分页配置
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// 文件上传配置
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// 部门模块 ID
export const DEPARTMENT_IDS = {
  HR: 'hr',
  FINANCE: 'finance',
  SALES: 'sales',
  WAREHOUSE: 'warehouse',
  APPROVAL: 'approval',
  MANAGEMENT: 'management',
  SERVICE: 'service',
  TENDER: 'tender',
  MARKETING: 'marketing',
} as const

// 权限级别
export const PERMISSION_LEVELS = {
  NONE: 0,
  READ: 1,
  WRITE: 2,
  ADMIN: 3,
} as const
