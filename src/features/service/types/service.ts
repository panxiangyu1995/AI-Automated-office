//! Service 模块类型定义 - 扩展处理记录和回访

// ==================== 工单相关类型 ====================

/** 工单类型 */
export type TicketType = 'repair' | 'consultation' | 'complaint';

/** 工单状态 */
export type TicketStatus = 'new' | 'processing' | 'pending_confirm' | 'completed' | 'cancelled';

/** 工单优先级 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/** 服务人员状态 */
export type PersonnelStatus = 'available' | 'busy' | 'offline';

/** 售后工单 */
export interface ServiceTicket {
  id: string;
  title: string;
  description?: string;
  ticketType: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  customerId?: string;
  customerName: string;
  customerContact?: string;
  customerEmail?: string;
  assignedTo?: string;
  assignedName?: string;
  knowledgeId?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  tenantId: string;
  metadata: Record<string, unknown>;
}

/** 工单列表项 */
export interface TicketListItem {
  id: string;
  title: string;
  ticketType: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  customerName: string;
  assignedName?: string;
  createdAt: number;
  updatedAt: number;
}

/** 服务人员 */
export interface ServicePersonnel {
  id: string;
  userId: string;
  userName: string;
  department?: string;
  specializations: string[];
  status: PersonnelStatus;
  currentTicketCount: number;
  maxTicketCount: number;
  createdAt: number;
  updatedAt: number;
  tenantId: string;
}

/** 服务人员列表项 */
export interface PersonnelListItem {
  id: string;
  userName: string;
  department?: string;
  status: PersonnelStatus;
  currentTicketCount: number;
  maxTicketCount: number;
}

// ==================== 请求类型 ====================

/** 创建工单请求 */
export interface CreateTicketRequest {
  title: string;
  description?: string;
  ticketType: TicketType;
  priority: TicketPriority;
  customerName: string;
  customerContact?: string;
  customerEmail?: string;
}

/** 更新工单请求 */
export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  customerContact?: string;
  customerEmail?: string;
}

/** 更新工单状态请求 */
export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

/** 分配工单请求 */
export interface AssignTicketRequest {
  assignedTo: string;
  assignedName: string;
}

/** 查询工单参数 */
export interface QueryTicketsParams {
  status?: TicketStatus[];
  ticketType?: TicketType[];
  priority?: TicketPriority[];
  assignedTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'created_at' | 'updated_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/** 查询服务人员参数 */
export interface QueryPersonnelParams {
  status?: PersonnelStatus;
  department?: string;
  page?: number;
  pageSize?: number;
}

/** 更新服务人员请求 */
export interface UpdatePersonnelRequest {
  department?: string;
  specializations?: string[];
  maxTicketCount?: number;
}

/** 更新服务人员状态请求 */
export interface UpdatePersonnelStatusRequest {
  status: PersonnelStatus;
}

// ==================== 响应类型 ====================

/** 分页结果 */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== 辅助类型 ====================

/** 工单状态配置 */
export interface TicketStatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

/** 优先级配置 */
export interface PriorityConfig {
  label: string;
  color: string;
  level: number;
}

/** 工单类型配置 */
export interface TicketTypeConfig {
  label: string;
  icon: string;
}

/** 工单统计 */
export interface TicketStatistics {
  total: number;
  new: number;
  processing: number;
  pendingConfirm: number;
  completed: number;
  cancelled: number;
}

// ==================== 处理记录 ====================

/** 处理记录 */
export interface ProcessingRecord {
  id: string;
  ticketId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  content: string;
  attachments?: string[];
  createdAt: number;
}

/** 创建处理记录请求 */
export interface CreateProcessingRecordRequest {
  ticketId: string;
  operatorId: string;
  operatorName: string;
  action: string;
  content: string;
  attachments?: string[];
}

/** 查询处理记录参数 */
export interface QueryProcessingRecordsParams {
  ticketId?: string;
  operatorId?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  pageSize?: number;
}

// ==================== 回访记录 ====================

/** 回访状态 */
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

/** 回访记录 */
export interface FollowUpRecord {
  id: string;
  ticketId: string;
  customerName: string;
  customerContact: string;
  visitTime: number;
  visitType: 'phone' | 'visit' | 'online';
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  issues: string[];
  followUpRequired: boolean;
  nextVisitDate?: number;
  status: FollowUpStatus;
  createdAt: number;
  updatedAt: number;
}

/** 创建回访记录请求 */
export interface CreateFollowUpRequest {
  ticketId: string;
  customerName: string;
  customerContact: string;
  visitType: 'phone' | 'visit' | 'online';
  satisfactionLevel: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  issues: string[];
  followUpRequired: boolean;
  nextVisitDate?: number;
}

/** 更新回访记录请求 */
export interface UpdateFollowUpRequest {
  satisfactionLevel?: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  issues?: string[];
  followUpRequired?: boolean;
  nextVisitDate?: number;
  status?: FollowUpStatus;
}

// ==================== 自动分配 ====================

/** 分配策略 */
export type AssignmentStrategy = 'least_load' | 'specialization' | 'round_robin';

/** 自动分配请求 */
export interface AutoAssignRequest {
  ticketId: string;
  strategy?: AssignmentStrategy;
}

/** 分配结果 */
export interface AssignmentResult {
  ticketId: string;
  assignedTo: string;
  assignedName: string;
  reason: string;
}

// ==================== 扩展类型 ====================

/** 工单详情 (包含处理记录和回访) */
export interface ServiceTicketDetail extends ServiceTicket {
  processingRecords: ProcessingRecord[];
  followUp?: FollowUpRecord;
}
