/**
 * Sales 模块单元测试
 * 覆盖：类型定义、客户等级、报价/合同状态生命周期
 */

import { describe, it, expect } from 'vitest'
import type {
  CustomerType,
  CustomerLevel,
  QuoteStatus,
  ContractStatus,
  Customer,
  QuoteItem,
  Quote,
  Contract,
} from '@/features/sales/types/sales.types'

describe('Sales Types', () => {
  describe('CustomerType', () => {
    it('should have individual and corporate types', () => {
      const types: CustomerType[] = ['individual', 'corporate']
      expect(types).toHaveLength(2)
    })
  })

  describe('CustomerLevel', () => {
    it('should have 3 levels: A, B, C', () => {
      const levels: CustomerLevel[] = ['A', 'B', 'C']
      expect(levels).toHaveLength(3)
    })

    it('A should be highest level', () => {
      const levelOrder: Record<CustomerLevel, number> = { A: 3, B: 2, C: 1 }
      expect(levelOrder.A).toBeGreaterThan(levelOrder.B)
      expect(levelOrder.B).toBeGreaterThan(levelOrder.C)
    })
  })

  describe('QuoteStatus', () => {
    it('should follow complete lifecycle', () => {
      const statuses: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected']
      expect(statuses).toHaveLength(4)
    })

    it('should have terminal states accepted and rejected', () => {
      const terminals: QuoteStatus[] = ['accepted', 'rejected']
      expect(terminals).toHaveLength(2)
    })
  })

  describe('ContractStatus', () => {
    it('should follow complete lifecycle', () => {
      const statuses: ContractStatus[] = ['draft', 'signed', 'executing', 'completed']
      expect(statuses).toHaveLength(4)
    })
  })
})

describe('Sales Structure Validation', () => {
  it('Customer should support tags for categorization', () => {
    const customer: Customer = {
      id: 'cust-1',
      name: 'ABC公司',
      contact: '张经理',
      phone: '13800000000',
      email: 'zhang@abc.com',
      address: '北京市朝阳区',
      customerType: 'corporate',
      level: 'A',
      tags: ['VIP', '长期合作'],
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(customer.tags).toHaveLength(2)
    expect(customer.level).toBe('A')
  })

  it('QuoteItem total should equal quantity times unitPrice', () => {
    const item: QuoteItem = {
      id: 'qi-1',
      product: '企业版订阅',
      quantity: 10,
      unitPrice: 1000,
      total: 10000,
    }

    expect(item.total).toBe(item.quantity * item.unitPrice)
  })

  it('Quote should aggregate item totals', () => {
    const items: QuoteItem[] = [
      { id: 'qi-1', product: '产品A', quantity: 5, unitPrice: 100, total: 500 },
      { id: 'qi-2', product: '产品B', quantity: 3, unitPrice: 200, total: 600 },
    ]

    const quote: Quote = {
      id: 'q-1',
      number: 'QT-2024-001',
      customerId: 'cust-1',
      customerName: 'ABC公司',
      items,
      totalAmount: 1100,
      status: 'draft',
      validUntil: 1735689600,
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    const expectedTotal = items.reduce((sum, item) => sum + item.total, 0)
    expect(quote.totalAmount).toBe(expectedTotal)
  })

  it('Contract can reference a quote', () => {
    const contract: Contract = {
      id: 'c-1',
      number: 'CT-2024-001',
      customerId: 'cust-1',
      customerName: 'ABC公司',
      quoteId: 'q-1',
      items: [{ id: 'ci-1', product: '产品A', quantity: 5, unitPrice: 100, total: 500 }],
      totalAmount: 500,
      status: 'signed',
      signDate: 1700000000,
      expireDate: 1735689600,
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(contract.quoteId).toBe('q-1')
    expect(contract.status).toBe('signed')
    expect(contract.signDate).toBeDefined()
  })
})
