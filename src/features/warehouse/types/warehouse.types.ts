/**
 * Warehouse 模块类型定义
 */

export type InboundType = 'purchase' | 'return'
export type InboundStatus = 'draft' | 'submitted' | 'approved' | 'completed'
export type OutboundType = 'sale' | 'transfer'
export type OutboundStatus = 'draft' | 'submitted' | 'approved' | 'shipped'

export interface InboundItem {
  productId: string
  productName: string
  quantity: number
}

export interface InboundOrder {
  id: string
  number: string
  inboundType: InboundType
  items: InboundItem[]
  status: InboundStatus
  createdAt: number
  updatedAt: number
}

export interface OutboundItem {
  productId: string
  productName: string
  quantity: number
}

export interface OutboundOrder {
  id: string
  number: string
  outboundType: OutboundType
  salesOrderId?: string
  items: OutboundItem[]
  status: OutboundStatus
  createdAt: number
  updatedAt: number
}

export interface Inventory {
  id: string
  productId: string
  productName: string
  warehouseId: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  updatedAt: number
}

export interface CreateInboundRequest {
  inboundType: InboundType
  items: InboundItem[]
}

export interface CreateOutboundRequest {
  outboundType: OutboundType
  salesOrderId?: string
  items: OutboundItem[]
}

export interface InboundListItem {
  id: string
  number: string
  inboundType: InboundType
  status: InboundStatus
  createdAt: number
}

export interface OutboundListItem {
  id: string
  number: string
  outboundType: OutboundType
  status: OutboundStatus
  createdAt: number
}

export interface InventoryListItem {
  id: string
  productId: string
  productName: string
  quantity: number
  availableQuantity: number
}

export interface WarehouseStats {
  totalInventory: number
  lowStockCount: number
  pendingInbound: number
  pendingOutbound: number
}

export const INBOUND_STATUS_LABELS: Record<InboundStatus, string> = { draft: '草稿', submitted: '已提交', approved: '已审核', completed: '已完成' }
export const OUTBOUND_STATUS_LABELS: Record<OutboundStatus, string> = { draft: '草稿', submitted: '已提交', approved: '已审核', shipped: '已发货' }
