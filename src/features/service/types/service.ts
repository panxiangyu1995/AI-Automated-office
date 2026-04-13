//! Service 模块类型定义

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
