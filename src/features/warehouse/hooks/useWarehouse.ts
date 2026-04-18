/**
 * Warehouse 模块 Hooks - 使用统一 Hooks 封装
 * Phase 11-20: 应用统一Hooks到各业务模块
 */

import { useMemo } from 'react'
import { useTauriCommand } from '@/hooks/useTauriCommand'
import type {
  InboundOrder,
  InboundListItem,
  OutboundOrder,
  OutboundListItem,
  Inventory,
  InventoryListItem,
  WarehouseStats,
  InboundStatus,
  OutboundStatus,
} from '../types/warehouse.types'

// ==================== 入库单 Hooks ====================

/**
 * 入库单列表 Hook
 */
export function useInboundOrders(status?: InboundStatus) {
  return useTauriCommand<InboundListItem[]>({
    command: 'warehouse_list_inbounds',
    params: { status },
  })
}

/**
 * 单个入库单 Hook
 */
export function useInboundOrder(id: string | null) {
  return useTauriCommand<InboundOrder | null>({
    command: 'warehouse_get_inbound',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建入库单 Hook
 */
export function useCreateInbound() {
  return useTauriCommand<InboundOrder>({
    command: 'warehouse_create_inbound',
  })
}

/**
 * 提交入库单 Hook
 */
export function useSubmitInbound() {
  return useTauriCommand<InboundOrder>({
    command: 'warehouse_submit_inbound',
  })
}

/**
 * 审核入库单 Hook
 */
export function useApproveInbound() {
  return useTauriCommand<InboundOrder>({
    command: 'warehouse_approve_inbound',
  })
}

// ==================== 出库单 Hooks ====================

/**
 * 出库单列表 Hook
 */
export function useOutboundOrders(status?: OutboundStatus) {
  return useTauriCommand<OutboundListItem[]>({
    command: 'warehouse_list_outbounds',
    params: { status },
  })
}

/**
 * 单个出库单 Hook
 */
export function useOutboundOrder(id: string | null) {
  return useTauriCommand<OutboundOrder | null>({
    command: 'warehouse_get_outbound',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建出库单 Hook
 */
export function useCreateOutbound() {
  return useTauriCommand<OutboundOrder>({
    command: 'warehouse_create_outbound',
  })
}

/**
 * 提交出库单 Hook
 */
export function useSubmitOutbound() {
  return useTauriCommand<OutboundOrder>({
    command: 'warehouse_submit_outbound',
  })
}

/**
 * 审核出库单 Hook
 */
export function useApproveOutbound() {
  return useTauriCommand<OutboundOrder>({
    command: 'warehouse_approve_outbound',
  })
}

// ==================== 库存 Hooks ====================

/**
 * 库存列表 Hook
 */
export function useInventory(warehouseId?: string) {
  return useTauriCommand<InventoryListItem[]>({
    command: 'warehouse_list_inventory',
    params: { warehouseId },
  })
}

/**
 * 单个库存 Hook
 */
export function useInventoryItem(productId: string | null, warehouseId?: string) {
  return useTauriCommand<Inventory | null>({
    command: 'warehouse_get_inventory',
    params: productId ? { productId, warehouseId } : undefined,
  })
}

// ==================== 统计 Hooks ====================

/**
 * 仓库统计 Hook
 */
export function useWarehouseStats() {
  return useTauriCommand<WarehouseStats>({
    command: 'warehouse_get_stats',
  })
}

// ==================== 辅助 Hooks ====================

/**
 * 仓库仪表盘 Hook（组合多个数据源）
 */
export function useWarehouseDashboard() {
  const stats = useWarehouseStats()
  const pendingInbound = useInboundOrders('submitted')
  const pendingOutbound = useOutboundOrders('submitted')

  return useMemo(
    () => ({
      stats,
      pendingInbound,
      pendingOutbound,
      isLoading: stats.loading || pendingInbound.loading || pendingOutbound.loading,
      error: stats.error || pendingInbound.error || pendingOutbound.error,
    }),
    [stats, pendingInbound, pendingOutbound]
  )
}
