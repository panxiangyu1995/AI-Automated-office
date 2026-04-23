//! Service 模块 API 封装 - 扩展处理记录和回访

import { safeInvoke } from '@/lib/tauri';
import type {
  ServiceTicket,
  TicketListItem,
  ServicePersonnel,
  PersonnelListItem,
  CreateTicketRequest,
  UpdateTicketRequest,
  UpdateTicketStatusRequest,
  AssignTicketRequest,
  QueryTicketsParams,
  QueryPersonnelParams,
  UpdatePersonnelRequest,
  UpdatePersonnelStatusRequest,
  PagedResult,
  // 新增类型
  ProcessingRecord,
  CreateProcessingRecordRequest,
  QueryProcessingRecordsParams,
  FollowUpRecord,
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  AutoAssignRequest,
  AssignmentResult,
} from '../types/service';

// ==================== 工单 API ====================

/** 创建工单 */
export async function createTicket(request: CreateTicketRequest, tenantId?: string): Promise<ServiceTicket> {
  const result = await safeInvoke<ServiceTicket>('service_create_ticket', { request, tenantId });
  return result ?? ({} as ServiceTicket);
}

/** 获取工单 */
export async function getTicket(id: string): Promise<ServiceTicket> {
  const result = await safeInvoke<ServiceTicket>('service_get_ticket', { id });
  return result ?? ({} as ServiceTicket);
}

/** 查询工单列表 */
export async function listTickets(params?: QueryTicketsParams): Promise<PagedResult<TicketListItem>> {
  const result = await safeInvoke<PagedResult<TicketListItem>>('service_list_tickets', { params });
  return result ?? ({} as PagedResult<TicketListItem>);
}

/** 更新工单 */
export async function updateTicket(id: string, request: UpdateTicketRequest): Promise<ServiceTicket> {
  const result = await safeInvoke<ServiceTicket>('service_update_ticket', { id, request });
  return result ?? ({} as ServiceTicket);
}

/** 删除工单 */
export async function deleteTicket(id: string): Promise<void> {
  await safeInvoke('service_delete_ticket', { id });
}

/** 更新工单状态 */
export async function updateTicketStatus(id: string, request: UpdateTicketStatusRequest): Promise<ServiceTicket> {
  const result = await safeInvoke<ServiceTicket>('service_update_ticket_status', { id, request });
  return result ?? ({} as ServiceTicket);
}

/** 分配工单 */
export async function assignTicket(id: string, request: AssignTicketRequest): Promise<ServiceTicket> {
  const result = await safeInvoke<ServiceTicket>('service_assign_ticket', { id, request });
  return result ?? ({} as ServiceTicket);
}

// ==================== 服务人员 API ====================

/** 创建服务人员 */
export async function createPersonnel(userId: string, userName: string, tenantId?: string): Promise<ServicePersonnel> {
  const result = await safeInvoke<ServicePersonnel>('service_create_personnel', { userId, userName, tenantId });
  return result ?? ({} as ServicePersonnel);
}

/** 获取服务人员 */
export async function getPersonnel(id: string): Promise<ServicePersonnel> {
  const result = await safeInvoke<ServicePersonnel>('service_get_personnel', { id });
  return result ?? ({} as ServicePersonnel);
}

/** 查询服务人员列表 */
export async function listPersonnel(params?: QueryPersonnelParams): Promise<PagedResult<PersonnelListItem>> {
  const result = await safeInvoke<PagedResult<PersonnelListItem>>('service_list_personnel', { params });
  return result ?? ({} as PagedResult<PersonnelListItem>);
}

/** 更新服务人员 */
export async function updatePersonnel(id: string, request: UpdatePersonnelRequest): Promise<ServicePersonnel> {
  const result = await safeInvoke<ServicePersonnel>('service_update_personnel', { id, request });
  return result ?? ({} as ServicePersonnel);
}

/** 更新服务人员状态 */
export async function updatePersonnelStatus(id: string, request: UpdatePersonnelStatusRequest): Promise<ServicePersonnel> {
  const result = await safeInvoke<ServicePersonnel>('service_update_personnel_status', { id, request });
  return result ?? ({} as ServicePersonnel);
}

/** 删除服务人员 */
export async function deletePersonnel(id: string): Promise<void> {
  await safeInvoke('service_delete_personnel', { id });
}

/** 获取可用的服务人员 */
export async function getAvailablePersonnel(): Promise<PersonnelListItem[]> {
  const result = await safeInvoke<PersonnelListItem[]>('service_get_available_personnel');
  return result ?? [];
}

// ==================== 处理记录 API ====================

/** 创建处理记录 */
export async function createProcessingRecord(request: CreateProcessingRecordRequest): Promise<ProcessingRecord> {
  const result = await safeInvoke<ProcessingRecord>('service_create_processing_record', { request });
  return result ?? ({} as ProcessingRecord);
}

/** 查询处理记录列表 */
export async function listProcessingRecords(params: QueryProcessingRecordsParams): Promise<PagedResult<ProcessingRecord>> {
  const result = await safeInvoke<PagedResult<ProcessingRecord>>('service_list_processing_records', { params });
  return result ?? ({} as PagedResult<ProcessingRecord>);
}

/** 获取工单的处理记录 */
export async function getTicketProcessingRecords(ticketId: string): Promise<ProcessingRecord[]> {
  const result = await safeInvoke<ProcessingRecord[]>('service_get_ticket_processing_records', { ticketId });
  return result ?? [];
}

// ==================== 回访记录 API ====================

/** 创建回访记录 */
export async function createFollowUp(request: CreateFollowUpRequest): Promise<FollowUpRecord> {
  const result = await safeInvoke<FollowUpRecord>('service_create_follow_up', { request });
  return result ?? ({} as FollowUpRecord);
}

/** 查询回访记录列表 */
export async function listFollowUps(params?: { ticketId?: string; status?: string; page?: number; pageSize?: number }): Promise<PagedResult<FollowUpRecord>> {
  const result = await safeInvoke<PagedResult<FollowUpRecord>>('service_list_follow_ups', { params });
  return result ?? ({} as PagedResult<FollowUpRecord>);
}

/** 获取回访记录 */
export async function getFollowUp(id: string): Promise<FollowUpRecord> {
  const result = await safeInvoke<FollowUpRecord>('service_get_follow_up', { id });
  return result ?? ({} as FollowUpRecord);
}

/** 更新回访记录 */
export async function updateFollowUp(id: string, request: UpdateFollowUpRequest): Promise<FollowUpRecord> {
  const result = await safeInvoke<FollowUpRecord>('service_update_follow_up', { id, request });
  return result ?? ({} as FollowUpRecord);
}

/** 删除回访记录 */
export async function deleteFollowUp(id: string): Promise<void> {
  await safeInvoke('service_delete_follow_up', { id });
}

// ==================== 自动分配 API ====================

/** 自动分配工单 */
export async function autoAssignTicket(request: AutoAssignRequest): Promise<AssignmentResult> {
  const result = await safeInvoke<AssignmentResult>('service_auto_assign_ticket', { request });
  return result ?? ({} as AssignmentResult);
}
