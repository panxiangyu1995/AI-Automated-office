/**
 * Warehouse 模块 API
 */

import { safeInvoke } from '@/lib/tauri'
import type {
  InboundOrder,
  OutboundOrder,
  InboundListItem,
  OutboundListItem,
  InventoryListItem,
  WarehouseStats,
  CreateInboundRequest,
  CreateOutboundRequest,
} from '../types/warehouse.types'
import type {
  Location,
  ListWarningsResponse,
  ListMovementsResponse,
  LogisticsRecord,
} from '../types/inventory'

export async function listInbounds(): Promise<InboundListItem[]> {
  const result = await safeInvoke<InboundListItem[]>('warehouse_list_inbounds')
  return result ?? []
}
export async function getInbound(id: string): Promise<InboundOrder> {
  const result = await safeInvoke<InboundOrder>('warehouse_get_inbound', { id })
  return result ?? ({} as InboundOrder)
}
export async function createInbound(request: CreateInboundRequest): Promise<InboundOrder> {
  const result = await safeInvoke<InboundOrder>('warehouse_create_inbound', { request })
  return result ?? ({} as InboundOrder)
}
export async function listOutbounds(): Promise<OutboundListItem[]> {
  const result = await safeInvoke<OutboundListItem[]>('warehouse_list_outbounds')
  return result ?? []
}
export async function getOutbound(id: string): Promise<OutboundOrder> {
  const result = await safeInvoke<OutboundOrder>('warehouse_get_outbound', { id })
  return result ?? ({} as OutboundOrder)
}
export async function createOutbound(request: CreateOutboundRequest): Promise<OutboundOrder> {
  const result = await safeInvoke<OutboundOrder>('warehouse_create_outbound', { request })
  return result ?? ({} as OutboundOrder)
}
export async function listInventory(): Promise<InventoryListItem[]> {
  const result = await safeInvoke<InventoryListItem[]>('warehouse_list_inventory')
  return result ?? []
}
export async function getWarehouseStats(): Promise<WarehouseStats> {
  const result = await safeInvoke<WarehouseStats>('warehouse_get_stats')
  return result ?? ({} as WarehouseStats)
}

export async function listLocations(): Promise<Location[]> {
  const result = await safeInvoke<Location[]>('warehouse_list_locations')
  return result ?? []
}
export async function listWarnings(): Promise<ListWarningsResponse> {
  const result = await safeInvoke<ListWarningsResponse>('warehouse_list_warnings', { request: { page: 1, pageSize: 100 } })
  return result ?? ({} as ListWarningsResponse)
}
export async function markWarningRead(id: string): Promise<void> {
  await safeInvoke('warehouse_mark_warning_read', { id })
}
export async function resolveWarning(id: string): Promise<void> {
  await safeInvoke('warehouse_resolve_warning', { id })
}
export async function listMovements(request?: {
  type?: string
  keyword?: string
}): Promise<ListMovementsResponse> {
  const result = await safeInvoke<ListMovementsResponse>('warehouse_list_movements', { request: request ?? {} })
  return result ?? ({} as ListMovementsResponse)
}
export async function listLogistics(): Promise<LogisticsRecord[]> {
  const result = await safeInvoke<LogisticsRecord[]>('warehouse_list_logistics')
  return result ?? []
}
export async function createLocation(request: {
  code: string
  name: string
  zone: string
  capacity?: number
}): Promise<Location> {
  const result = await safeInvoke<Location>('warehouse_create_location', { request })
  return result ?? ({} as Location)
}
export async function updateLocation(
  id: string,
  request: { code?: string; name?: string; zone?: string; status?: string }
): Promise<Location> {
  const result = await safeInvoke<Location>('warehouse_update_location', { id, request })
  return result ?? ({} as Location)
}

export const warehouseApi = {
  listInbounds,
  getInbound,
  createInbound,
  listOutbounds,
  getOutbound,
  createOutbound,
  listInventory,
  getStats: getWarehouseStats,
  listLocations,
  listWarnings,
  markWarningRead,
  resolveWarning,
  listMovements,
  listLogistics,
  createLocation,
  updateLocation,
}
