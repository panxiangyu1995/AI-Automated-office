/**
 * API Contract - 前后端API契约类型定义
 * 
 * 统一前后端通信的类型契约，确保类型安全
 */

// ==================== 通用类型 ====================

/** ID 类型 */
export type EntityId = string | number

/** 时间戳类型 */
export type Timestamp = number | string

/** 分页参数 */
export interface PageParams {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// ==================== 通用响应 ====================

/** 通用成功响应 */
export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  message?: string
}

/** 通用错误响应 */
export interface ApiFailure {
  success: false
  code: string
  message: string
  details?: Record<string, string>
  status?: number
}

/** API 结果类型 */
export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure

// ==================== CRUD 操作类型 ====================

/** 创建请求 */
export interface CreateRequest<T> {
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>
}

/** 更新请求 */
export interface UpdateRequest<T> {
  id: EntityId
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
}

/** 删除请求 */
export interface DeleteRequest {
  id: EntityId
}

/** 批量删除请求 */
export interface BatchDeleteRequest {
  ids: EntityId[]
}

// ==================== 列表查询 ====================

/** 列表查询参数 */
export interface ListQueryParams extends PageParams {
  search?: string
  filter?: Record<string, unknown>
}

/** 列表查询响应 */
export interface ListResponse<T> extends PageResult<T> {
  code?: string
  message?: string
}

// ==================== 审批模块 API ====================

export interface ApprovalFlow {
  id: EntityId
  name: string
  description: string
  steps: ApprovalFlowStep[]
  form_schema: Record<string, unknown>
  status: 'draft' | 'active' | 'archived'
  created_by: EntityId
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ApprovalFlowStep {
  id: EntityId
  order: number
  approvers: ApprovalApprover[]
  step_type: 'sequential' | 'parallel'
  condition?: ApprovalCondition
}

export interface ApprovalApprover {
  id: EntityId
  name: string
  employee_id: EntityId
}

export interface ApprovalCondition {
  field: string
  operator: string
  value: unknown
}

export interface ApprovalRecord {
  id: EntityId
  flow_id: EntityId
  flow_name: string
  title: string
  applicant_id: EntityId
  applicant_name: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  current_step: number
  form_data: Record<string, unknown>
  history: ApprovalHistory[]
  created_at: Timestamp
  updated_at: Timestamp
}

export interface ApprovalHistory {
  id: EntityId
  step_id: EntityId
  approver_id: EntityId
  approver_name: string
  action: string
  comment?: string
  timestamp: Timestamp
}

export interface ApprovalStats {
  pending: number
  approved: number
  rejected: number
  total: number
}

export interface ApprovalCreateFlowRequest {
  name: string
  description: string
  steps: ApprovalFlowStep[]
  form_schema: Record<string, unknown>
}

export interface ApprovalUpdateFlowRequest {
  name?: string
  description?: string
  steps?: ApprovalFlowStep[]
  form_schema?: Record<string, unknown>
  status?: ApprovalFlow['status']
}

export interface ApprovalCreateRecordRequest {
  flow_id: EntityId
  applicant_id: EntityId
  applicant_name: string
  form_data: Record<string, unknown>
}

export interface ApprovalApproveRequest {
  approver_id: EntityId
  approver_name: string
  comment?: string
}

// ==================== 财务模块 API ====================

export interface FinanceInvoice {
  id: EntityId
  number: string
  type: 'income' | 'expense'
  amount: number
  tax_amount: number
  total_amount: number
  status: 'draft' | 'issued' | 'verified' | 'cancelled'
  issuer_id: EntityId
  issuer_name: string
  recipient_id: EntityId
  recipient_name: string
  issue_date: Timestamp
  due_date?: Timestamp
  verified_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface FinanceInvoiceListItem {
  id: EntityId
  number: string
  type: FinanceInvoice['type']
  amount: number
  status: FinanceInvoice['status']
  issuer_name: string
  issue_date: Timestamp
}

export interface FinanceLedger {
  id: EntityId
  type: 'receivable' | 'payable'
  amount: number
  balance: number
  status: 'unpaid' | 'partial' | 'paid'
  related_id?: EntityId
  related_type?: string
  due_date?: Timestamp
  paid_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface FinanceLedgerListItem {
  id: EntityId
  type: FinanceLedger['type']
  amount: number
  balance: number
  status: FinanceLedger['status']
  due_date?: Timestamp
  created_at: Timestamp
}

export interface FinanceStats {
  total_receivable: number
  total_payable: number
  total_income: number
  total_expense: number
  pending_invoices: number
}

export interface FinanceCreateInvoiceRequest {
  type: FinanceInvoice['type']
  amount: number
  tax_amount?: number
  recipient_id: EntityId
  recipient_name: string
  issue_date: string
  due_date?: string
}

export interface FinanceRecordPaymentRequest {
  amount: number
  payment_method?: string
  payment_date?: string
  remark?: string
}

// ==================== 销售模块 API ====================

export interface SalesCustomer {
  id: EntityId
  name: string
  code: string
  type: 'individual' | 'company'
  industry?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  status: 'active' | 'inactive'
  created_at: Timestamp
  updated_at: Timestamp
}

export interface SalesCustomerListItem {
  id: EntityId
  name: string
  code: string
  type: SalesCustomer['type']
  contact_name?: string
  contact_phone?: string
  status: SalesCustomer['status']
}

export interface SalesQuote {
  id: EntityId
  number: string
  customer_id: EntityId
  customer_name: string
  amount: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  valid_until?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface SalesQuoteListItem {
  id: EntityId
  number: string
  customer_name: string
  amount: number
  status: SalesQuote['status']
  valid_until?: Timestamp
  created_at: Timestamp
}

export interface SalesContract {
  id: EntityId
  number: string
  customer_id: EntityId
  customer_name: string
  quote_id?: EntityId
  amount: number
  signed_date?: Timestamp
  start_date?: Timestamp
  end_date?: Timestamp
  status: 'draft' | 'signed' | 'active' | 'completed' | 'terminated'
  created_at: Timestamp
  updated_at: Timestamp
}

export interface SalesContractListItem {
  id: EntityId
  number: string
  customer_name: string
  amount: number
  status: SalesContract['status']
  signed_date?: Timestamp
  created_at: Timestamp
}

export interface SalesStats {
  total_customers: number
  total_quotes: number
  total_contracts: number
  total_amount: number
  pending_amount: number
}

export interface SalesCreateCustomerRequest {
  name: string
  type: SalesCustomer['type']
  code?: string
  industry?: string
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  address?: string
}

export interface SalesUpdateCustomerRequest extends Partial<SalesCreateCustomerRequest> {
  status?: SalesCustomer['status']
}

// ==================== 人事模块 API ====================

export interface HREmployee {
  id: EntityId
  code: string
  name: string
  real_name: string
  email: string
  phone?: string
  department_id: EntityId
  department_name?: string
  position_id?: EntityId
  position_name?: string
  status: 'active' | 'inactive' | 'probation' | 'resigned'
  hire_date?: Timestamp
  leave_date?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface HREmployeeListItem {
  id: EntityId
  code: string
  name: string
  department_name?: string
  position_name?: string
  status: HREmployee['status']
}

export interface HREmployeeDetail extends HREmployee {
  avatar_url?: string
  emergency_contact?: string
  emergency_phone?: string
  bank_account?: string
  social_security_no?: string
}

export interface HRDepartment {
  id: EntityId
  name: string
  code?: string
  parent_id?: EntityId
  manager_id?: EntityId
  manager_name?: string
  level: number
  path: string
  sort_order: number
  created_at: Timestamp
  updated_at: Timestamp
}

export interface HRDepartmentTreeNode extends HRDepartment {
  children: HRDepartmentTreeNode[]
}

export interface HRPosition {
  id: EntityId
  name: string
  code?: string
  department_id: EntityId
  description?: string
  created_at: Timestamp
}

export interface HRPositionListItem {
  id: EntityId
  name: string
  code?: string
  department_name?: string
}

export interface HRCreateEmployeeRequest {
  code: string
  name: string
  real_name: string
  email: string
  phone?: string
  department_id: EntityId
  position_id?: EntityId
  hire_date?: string
}

export interface HRUpdateEmployeeRequest extends Partial<HRCreateEmployeeRequest> {
  status?: HREmployee['status']
}

// ==================== 看板模块 API ====================

export interface DashboardStats {
  total_employees: number
  total_customers: number
  total_sales: number
  total_contracts: number
  pending_approvals: number
  total_receivable: number
  total_payable: number
  service_tickets: ServiceTicketStats
  last_updated: Timestamp
}

export interface ServiceTicketStats {
  total: number
  pending: number
  completed: number
}

export interface WarningItem {
  id: EntityId
  type: string
  level: 'info' | 'warning' | 'critical'
  title: string
  description: string
  related_module: string
  related_id?: EntityId
  created_at: Timestamp
}

export interface WarningRule {
  id: EntityId
  name: string
  type: string
  condition: string
  threshold: number
  enabled: boolean
  notify_channels: string[]
  created_at: Timestamp
  updated_at: Timestamp
}

export interface CreateWarningRuleRequest {
  name: string
  type: string
  condition: string
  threshold: number
  enabled?: boolean
  notify_channels?: string[]
}

// ==================== 知识库模块 API ====================

export interface KnowledgeEntry {
  id: EntityId
  title: string
  content: string
  summary?: string
  category_id?: EntityId
  category_name?: string
  tags: string[]
  view_count: number
  like_count: number
  status: 'draft' | 'published' | 'archived'
  author_id: EntityId
  author_name: string
  created_at: Timestamp
  updated_at: Timestamp
}

export interface KnowledgeCategory {
  id: EntityId
  name: string
  parent_id?: EntityId
  sort_order: number
  entry_count: number
  created_at: Timestamp
}

export interface KnowledgeSearchResult {
  entries: KnowledgeEntry[]
  total: number
  query: string
  highlights: Record<EntityId, string[]>
}

export interface KnowledgeCreateEntryRequest {
  title: string
  content: string
  category_id?: EntityId
  tags?: string[]
}

export interface KnowledgeUpdateEntryRequest {
  title?: string
  content?: string
  category_id?: EntityId
  tags?: string[]
  status?: KnowledgeEntry['status']
}

export interface KnowledgeSearchRequest {
  query: string
  category_id?: EntityId
  tags?: string[]
  page?: number
  page_size?: number
}

// ==================== 仓库模块 API ====================

export interface WarehouseInventory {
  id: EntityId
  product_id: EntityId
  product_name: string
  product_code: string
  warehouse_id: EntityId
  warehouse_name: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  unit_cost: number
  total_cost: number
  last_check_date?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface WarehouseInventoryListItem {
  id: EntityId
  product_id: EntityId
  product_name: string
  product_code: string
  warehouse_name: string
  quantity: number
  available_quantity: number
}

export interface WarehouseInbound {
  id: EntityId
  number: string
  type: 'purchase' | 'return' | 'transfer_in'
  warehouse_id: EntityId
  warehouse_name: string
  supplier_id?: EntityId
  supplier_name?: string
  status: 'draft' | 'submitted' | 'approved' | 'completed' | 'cancelled'
  total_quantity: number
  total_amount: number
  expected_date?: Timestamp
  actual_date?: Timestamp
  handler_id?: EntityId
  handler_name?: string
  remark?: string
  created_at: Timestamp
  updated_at: Timestamp
}

export interface WarehouseInboundListItem {
  id: EntityId
  number: string
  type: WarehouseInbound['type']
  warehouse_name: string
  status: WarehouseInbound['status']
  total_quantity: number
  expected_date?: Timestamp
  created_at: Timestamp
}

export interface WarehouseOutbound {
  id: EntityId
  number: string
  type: 'sale' | 'transfer_out' | 'return'
  warehouse_id: EntityId
  warehouse_name: string
  customer_id?: EntityId
  customer_name?: string
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'completed' | 'cancelled'
  total_quantity: number
  total_amount: number
  expected_date?: Timestamp
  actual_date?: Timestamp
  handler_id?: EntityId
  handler_name?: string
  remark?: string
  created_at: Timestamp
  updated_at: Timestamp
}

export interface WarehouseOutboundListItem {
  id: EntityId
  number: string
  type: WarehouseOutbound['type']
  warehouse_name: string
  customer_name?: string
  status: WarehouseOutbound['status']
  total_quantity: number
  expected_date?: Timestamp
  created_at: Timestamp
}

export interface WarehouseStats {
  total_products: number
  total_inventory: number
  total_value: number
  low_stock_count: number
  pending_inbound: number
  pending_outbound: number
}

export interface WarehouseProduct {
  id: EntityId
  code: string
  name: string
  category: string
  unit: string
  spec?: string
  cost: number
  price: number
  min_stock: number
  max_stock: number
  status: 'active' | 'inactive'
  created_at: Timestamp
  updated_at: Timestamp
}

export interface WarehouseCreateInboundRequest {
  type: WarehouseInbound['type']
  warehouse_id: EntityId
  supplier_id?: EntityId
  expected_date?: string
  remark?: string
  items: Array<{
    product_id: EntityId
    quantity: number
    unit_cost?: number
  }>
}

export interface WarehouseCreateOutboundRequest {
  type: WarehouseOutbound['type']
  warehouse_id: EntityId
  customer_id?: EntityId
  expected_date?: string
  remark?: string
  items: Array<{
    product_id: EntityId
    quantity: number
  }>
}

// ==================== 消息模块 API ====================

export interface Message {
  id: EntityId
  type: 'system' | 'approval' | 'task' | 'mention' | 'chat' | 'announcement'
  category?: string
  title: string
  content: string
  sender_id: EntityId
  sender_name: string
  sender_avatar?: string
  recipient_id: EntityId
  recipient_type: 'user' | 'department' | 'all'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'unread' | 'read' | 'archived'
  action_url?: string
  action_type?: string
  action_params?: Record<string, unknown>
  expires_at?: Timestamp
  created_at: Timestamp
  read_at?: Timestamp
}

export interface MessageListItem {
  id: EntityId
  type: Message['type']
  title: string
  content: string
  sender_name: string
  priority: Message['priority']
  status: Message['status']
  created_at: Timestamp
  read_at?: Timestamp
}

export interface MessageUnreadCount {
  total: number
  by_type: Record<Message['type'], number>
  by_priority: Record<Message['priority'], number>
}

export interface MessageSettings {
  do_not_disturb: {
    enabled: boolean
    start_time?: string
    end_time?: string
    days?: number[]
  }
  channels: {
    in_app: boolean
    email: boolean
    push: boolean
  }
  types: Record<Message['type'], boolean>
}

export interface MessageSendRequest {
  type: Message['type']
  title: string
  content: string
  recipient_id: EntityId
  recipient_type: Message['recipient_type']
  priority?: Message['priority']
  action_url?: string
  action_type?: string
  action_params?: Record<string, unknown>
}

export interface Announcement {
  id: EntityId
  title: string
  content: string
  author_id: EntityId
  author_name: string
  scope: 'all' | 'department' | 'role' | 'user'
  scope_ids?: EntityId[]
  priority: Message['priority']
  pinned: boolean
  published_at?: Timestamp
  expires_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
}

export interface AnnouncementListItem {
  id: EntityId
  title: string
  author_name: string
  priority: Announcement['priority']
  pinned: boolean
  published_at?: Timestamp
  created_at: Timestamp
}
