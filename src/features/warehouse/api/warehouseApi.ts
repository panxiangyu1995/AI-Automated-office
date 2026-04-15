/**
 * Warehouse 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
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
  InventoryWarning,
  ListWarningsResponse,
  MovementRecord,
  ListMovementsResponse,
  LogisticsRecord,
} from '../types/inventory'

export async function listInbounds(): Promise<InboundListItem[]> {
  return invoke('warehouse_list_inbounds')
}
export async function getInbound(id: string): Promise<InboundOrder> {
  return invoke('warehouse_get_inbound', { id })
}
export async function createInbound(request: CreateInboundRequest): Promise<InboundOrder> {
  return invoke('warehouse_create_inbound', { request })
}
export async function listOutbounds(): Promise<OutboundListItem[]> {
  return invoke('warehouse_list_outbounds')
}
export async function getOutbound(id: string): Promise<OutboundOrder> {
  return invoke('warehouse_get_outbound', { id })
}
export async function createOutbound(request: CreateOutboundRequest): Promise<OutboundOrder> {
  return invoke('warehouse_create_outbound', { request })
}
export async function listInventory(): Promise<InventoryListItem[]> {
  return invoke('warehouse_list_inventory')
}
export async function getWarehouseStats(): Promise<WarehouseStats> {
  return invoke('warehouse_get_stats')
}

export async function listLocations(): Promise<Location[]> {
  try {
    return await invoke('warehouse_list_locations')
  } catch {
    return []
  }
}
export async function listWarnings(): Promise<ListWarningsResponse> {
  try {
    return await invoke('warehouse_list_warnings', { request: { page: 1, page_size: 100 } })
  } catch {
    return {
      items: [],
      total: 0,
      page: 1,
      page_size: 100,
      summary: { low_count: 0, high_count: 0, expiring_count: 0 },
    }
  }
}
export async function markWarningRead(id: string): Promise<void> {
  return invoke('warehouse_mark_warning_read', { id })
}
export async function resolveWarning(id: string): Promise<void> {
  return invoke('warehouse_resolve_warning', { id })
}
export async function listMovements(request?: {
  type?: string
  keyword?: string
}): Promise<ListMovementsResponse> {
  try {
    return await invoke('warehouse_list_movements', { request: request ?? {} })
  } catch {
    return {
      items: [],
      total: 0,
      page: 1,
      page_size: 100,
      summary: { total_inbound: 0, total_outbound: 0, net_change: 0 },
    }
  }
}
export async function listLogistics(): Promise<LogisticsRecord[]> {
  try {
    return await invoke('warehouse_list_logistics')
  } catch {
    return []
  }
}
export async function createLocation(request: {
  code: string
  name: string
  zone: string
  capacity?: number
}): Promise<Location> {
  return invoke('warehouse_create_location', { request })
}
export async function updateLocation(
  id: string,
  request: { code?: string; name?: string; zone?: string; status?: string }
): Promise<Location> {
  return invoke('warehouse_update_location', { id, request })
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
