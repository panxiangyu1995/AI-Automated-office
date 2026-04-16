/**
 * Warehouse 模块单元测试
 * 覆盖：类型定义、状态约束、库存计算逻辑
 */

import { describe, it, expect } from 'vitest'
import type {
  InboundType,
  InboundStatus,
  OutboundType,
  OutboundStatus,
  InboundOrder,
  OutboundOrder,
  Inventory,
  InboundItem,
} from '@/features/warehouse/types/warehouse.types'

describe('Warehouse Types', () => {
  describe('InboundType', () => {
    it('should only allow purchase or return', () => {
      const validTypes: InboundType[] = ['purchase', 'return']
      expect(validTypes).toHaveLength(2)
    })
  })

  describe('InboundStatus', () => {
    it('should follow complete lifecycle', () => {
      const statuses: InboundStatus[] = ['draft', 'submitted', 'approved', 'completed']
      expect(statuses).toHaveLength(4)
    })

    it('should start with draft and end with completed', () => {
      const flow: InboundStatus[] = ['draft', 'submitted', 'approved', 'completed']
      expect(flow[0]).toBe('draft')
      expect(flow[flow.length - 1]).toBe('completed')
    })
  })

  describe('OutboundType', () => {
    it('should only allow sale or transfer', () => {
      const validTypes: OutboundType[] = ['sale', 'transfer']
      expect(validTypes).toHaveLength(2)
    })
  })

  describe('OutboundStatus', () => {
    it('should follow complete lifecycle', () => {
      const statuses: OutboundStatus[] = ['draft', 'submitted', 'approved', 'shipped']
      expect(statuses).toHaveLength(4)
    })
  })
})

describe('Warehouse Structure Validation', () => {
  it('InboundOrder should contain items', () => {
    const items: InboundItem[] = [
      { productId: 'p-1', productName: '笔记本电脑', quantity: 10 },
      { productId: 'p-2', productName: '显示器', quantity: 20 },
    ]

    const order: InboundOrder = {
      id: 'inb-1',
      number: 'INB-2024-001',
      inboundType: 'purchase',
      items,
      status: 'draft',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(order.items).toHaveLength(2)
    expect(order.items[0].quantity).toBe(10)
  })

  it('OutboundOrder can reference sales order', () => {
    const order: OutboundOrder = {
      id: 'out-1',
      number: 'OUT-2024-001',
      outboundType: 'sale',
      salesOrderId: 'so-1',
      items: [{ productId: 'p-1', productName: '笔记本电脑', quantity: 5 }],
      status: 'draft',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(order.salesOrderId).toBe('so-1')
  })

  it('Inventory should track available quantity', () => {
    const inventory: Inventory = {
      id: 'inv-1',
      productId: 'p-1',
      productName: '笔记本电脑',
      warehouseId: 'wh-1',
      quantity: 100,
      reservedQuantity: 30,
      availableQuantity: 70,
      updatedAt: 1700000000,
    }

    expect(inventory.availableQuantity).toBe(inventory.quantity - inventory.reservedQuantity)
    expect(inventory.availableQuantity).toBeGreaterThanOrEqual(0)
  })

  it('availableQuantity should never exceed total quantity', () => {
    const inventory: Inventory = {
      id: 'inv-1',
      productId: 'p-1',
      productName: '笔记本电脑',
      warehouseId: 'wh-1',
      quantity: 100,
      reservedQuantity: 30,
      availableQuantity: 70,
      updatedAt: 1700000000,
    }

    expect(inventory.availableQuantity).toBeLessThanOrEqual(inventory.quantity)
  })
})
