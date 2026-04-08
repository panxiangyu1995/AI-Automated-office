/**
 * WorkCard Types
 * Story 24.1 - 工作卡片消息系统
 *
 * 定义工作卡片消息的类型系统，与后端 workcard/mod.rs 保持一致
 */

// ==================== Enums ====================

export type CardStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

export type CardPriority = 'low' | 'normal' | 'high' | 'urgent'

export type CardActionType = 'approve' | 'reject' | 'edit' | 'delete' | 'confirm' | 'cancel' | 'custom'

export type ResultType = 'success' | 'warning' | 'error' | 'info'

export type FieldType = 'text' | 'number' | 'date' | 'status' | 'link' | 'user' | 'currency'

// ==================== Interfaces ====================

export interface CardField {
  label: string
  value: string
  type: FieldType
  editable?: boolean
}

export interface ActionResult {
  type: ResultType
  message: string
}

export interface CardAction {
  id: string
  label: string
  type: CardActionType
  icon?: string
  variant?: string
  disabled?: boolean
  loading?: boolean
  result?: ActionResult
}

export interface AuditTrailEntry {
  action: string
  actor: string
  timestamp: string
  details?: string
}

export interface WorkCard {
  id: string
  title: string
  description?: string
  type: string
  status: CardStatus
  priority: CardPriority
  sender_id: string
  sender_name: string
  sender_avatar?: string
  sender_role?: string
  recipient_id?: string
  fields: CardField[]
  actions: CardAction[]
  created_at: string
  updated_at?: string
  expires_at?: string
  attachment_count: number
  thread_id?: string
  related_card_ids?: string[]
  audit_trail?: AuditTrailEntry[]
}

// ==================== Template Types ====================

export interface TemplateField {
  label: string
  type: FieldType
  value_path: string
  editable: boolean
}

export interface TemplateAction {
  label: string
  type: CardActionType
  icon?: string
  variant?: string
}

export interface WorkCardTemplate {
  id: string
  name: string
  card_type: string
  priority: CardPriority
  fields: TemplateField[]
  actions: TemplateAction[]
  description_template?: string
}

// ==================== API Request/Response Types ====================

export interface CreateCardRequest {
  title: string
  card_type: string
  priority: CardPriority
  sender_id: string
  sender_name: string
  fields: CardField[]
  actions: CardAction[]
}

export interface ExecuteActionRequest {
  card_id: string
  action_id: string
  actor_id: string
  actor_name: string
}

export interface GenerateFromTemplateRequest {
  template_id: string
  title: string
  sender_id: string
  sender_name: string
  context: Record<string, string>
}
