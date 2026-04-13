//! Service 模块 API 封装

import { invoke } from '@tauri-apps/api/core';
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
} from '../types/service';

// ==================== 工单 API ====================

/** 创建工单 */
export async function createTicket(request: CreateTicketRequest, tenantId?: string): Promise<ServiceTicket> {
  return invoke('service_create_ticket', { request, tenantId });
}

/** 获取工单 */
export async function getTicket(id: string): Promise<ServiceTicket> {
  return invoke('service_get_ticket', { id });
}

/** 查询工单列表 */
export async function listTickets(params?: QueryTicketsParams): Promise<PagedResult<TicketListItem>> {
  return invoke('service_list_tickets', { params });
}

/** 更新工单 */
export async function updateTicket(id: string, request: UpdateTicketRequest): Promise<ServiceTicket> {
  return invoke('service_update_ticket', { id, request });
}

/** 删除工单 */
export async function deleteTicket(id: string): Promise<void> {
  return invoke('service_delete_ticket', { id });
}

/** 更新工单状态 */
export async function updateTicketStatus(id: string, request: UpdateTicketStatusRequest): Promise<ServiceTicket> {
  return invoke('service_update_ticket_status', { id, request });
}

/** 分配工单 */
export async function assignTicket(id: string, request: AssignTicketRequest): Promise<ServiceTicket> {
  return invoke('service_assign_ticket', { id, request });
}

// ==================== 服务人员 API ====================

/** 创建服务人员 */
export async function createPersonnel(userId: string, userName: string, tenantId?: string): Promise<ServicePersonnel> {
  return invoke('service_create_personnel', { userId, userName, tenantId });
}

/** 获取服务人员 */
export async function getPersonnel(id: string): Promise<ServicePersonnel> {
  return invoke('service_get_personnel', { id });
}

/** 查询服务人员列表 */
export async function listPersonnel(params?: QueryPersonnelParams): Promise<PagedResult<PersonnelListItem>> {
  return invoke('service_list_personnel', { params });
}

/** 更新服务人员 */
export async function updatePersonnel(id: string, request: UpdatePersonnelRequest): Promise<ServicePersonnel> {
  return invoke('service_update_personnel', { id, request });
}

/** 更新服务人员状态 */
export async function updatePersonnelStatus(id: string, request: UpdatePersonnelStatusRequest): Promise<ServicePersonnel> {
  return invoke('service_update_personnel_status', { id, request });
}

/** 删除服务人员 */
export async function deletePersonnel(id: string): Promise<void> {
  return invoke('service_delete_personnel', { id });
}

/** 获取可用的服务人员 */
export async function getAvailablePersonnel(): Promise<PersonnelListItem[]> {
  return invoke('service_get_available_personnel');
}
