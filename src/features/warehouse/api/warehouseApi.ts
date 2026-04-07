/**
 * Warehouse 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
import type { InboundOrder, OutboundOrder, InboundListItem, OutboundListItem, InventoryListItem, WarehouseStats, CreateInboundRequest, CreateOutboundRequest } from '../types/warehouse.types'

export async function listInbounds(): Promise<InboundListItem[]> { return invoke('warehouse_list_inbounds') }
export async function getInbound(id: string): Promise<InboundOrder> { return invoke('warehouse_get_inbound', { id }) }
export async function createInbound(request: CreateInboundRequest): Promise<InboundOrder> { return invoke('warehouse_create_inbound', { request }) }
export async function listOutbounds(): Promise<OutboundListItem[]> { return invoke('warehouse_list_outbounds') }
export async function getOutbound(id: string): Promise<OutboundOrder> { return invoke('warehouse_get_outbound', { id }) }
export async function createOutbound(request: CreateOutboundRequest): Promise<OutboundOrder> { return invoke('warehouse_create_outbound', { request }) }
export async function listInventory(): Promise<InventoryListItem[]> { return invoke('warehouse_list_inventory') }
export async function getWarehouseStats(): Promise<WarehouseStats> { return invoke('warehouse_get_stats') }

export const warehouseApi = { listInbounds, getInbound, createInbound, listOutbounds, getOutbound, createOutbound, listInventory, getStats: getWarehouseStats }
