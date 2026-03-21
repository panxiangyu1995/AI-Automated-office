/**
 * 导入导出相关类型定义
 *
 * @module import.types
 * @description 定义用户导入导出相关的类型
 */

/**
 * 导入批次状态
 */
export type ImportBatchStatus = 
  | 'pending'
  | 'preview'
  | 'confirmed'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

/**
 * 导入行状态
 */
export type ImportRowStatus = 'pending' | 'valid' | 'conflict' | 'error'

/**
 * 冲突类型
 */
export type ConflictType = 
  | 'duplicate_username'
  | 'duplicate_employee_code'
  | 'department_not_found'
  | 'position_not_found'
  | 'manager_not_found'

/**
 * 冲突策略
 */
export type ConflictPolicy = 'skip' | 'update' | 'create'

/**
 * 模板字段
 */
export interface ImportTemplateField {
  key: string
  label: string
  required: boolean
  example: string
}

/**
 * 导入预览项
 */
export interface ImportPreviewItem {
  row_number: number
  username: string
  real_name: string
  employee_code: string
  department: string
  position?: string
  manager?: string
  email?: string
  phone?: string
  status: ImportRowStatus
  conflict_type?: ConflictType
  conflict_message?: string
  existing_user_id?: string
}

/**
 * 冲突项
 */
export interface ImportConflictItem {
  row_number: number
  conflict_type: ConflictType
  field: string
  existing_value: string
  new_value: string
  suggested_action: string
}

/**
 * 上传预览响应
 */
export interface ImportPreviewResponse {
  batch_id: string
  file_name: string
  total_rows: number
  valid_rows: number
  conflict_rows: number
  error_rows: number
  preview_items: ImportPreviewItem[]
  conflicts: ImportConflictItem[]
  template_fields: ImportTemplateField[]
}

/**
 * 确认导入请求
 */
export interface ConfirmImportRequest {
  batch_id: string
  idempotency_key: string
  conflict_policy?: ConflictPolicy
  row_policies?: Record<number, ConflictPolicy>
}

/**
 * 导入回执项
 */
export interface ImportReceiptItem {
  row_number: number
  username: string
  real_name: string
  status: 'success' | 'skipped' | 'failed'
  message?: string
  user_id?: string
}

/**
 * 导入回执
 */
export interface ImportReceipt {
  batch_id: string
  file_name: string
  total_rows: number
  success_rows: number
  skipped_rows: number
  failed_rows: number
  items: ImportReceiptItem[]
  export_url?: string
  created_at: string
}

/**
 * 确认导入响应
 */
export interface ConfirmImportResponse {
  batch_id: string
  status: ImportBatchStatus
  success_rows: number
  skipped_rows: number
  failed_rows: number
  receipt_url: string
}

/**
 * 导入进度
 */
export interface ImportProgress {
  batch_id: string
  status: ImportBatchStatus
  total_rows: number
  processed_rows: number
  success_rows: number
  failed_rows: number
  percentage: number
  started_at?: string
  estimated_remaining?: string
}

/**
 * 导出范围类型
 */
export type ExportScopeType = 'all' | 'department' | 'filter'

/**
 * 导出范围
 */
export interface ExportScope {
  type: ExportScopeType
  department_id?: string
  filter_conditions?: Record<string, string>
}

/**
 * 导出请求
 */
export interface ExportUsersRequest {
  scope: ExportScope
  fields: string[]
  format?: 'xlsx' | 'csv'
}

/**
 * 导出响应
 */
export interface ExportUsersResponse {
  download_url: string
  expires_at: string
  total_count: number
}

/**
 * 可导出字段
 */
export interface ExportableField {
  key: string
  label: string
  default: boolean
}

/**
 * 导入步骤
 */
export type ImportStep = 'upload' | 'preview' | 'confirm' | 'result'
