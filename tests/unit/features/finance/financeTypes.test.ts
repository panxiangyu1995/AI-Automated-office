/**
 * Finance 模块单元测试
 * 覆盖：类型定义、发票类型、OCR 结构、账本状态
 */

import { describe, it, expect } from 'vitest'
import type {
  InvoiceType,
  InvoiceStatus,
  LedgerType,
  LedgerStatus,
  Invoice,
  LedgerEntry,
  OcrResult,
  OcrItem,
} from '@/features/finance/types/finance.types'

describe('Finance Types', () => {
  describe('InvoiceType', () => {
    it('should support 3 invoice types', () => {
      const types: InvoiceType[] = ['vat', 'normal', 'receipt']
      expect(types).toHaveLength(3)
    })

    it('vat should be for VAT special invoices', () => {
      const vatType: InvoiceType = 'vat'
      expect(vatType).toBe('vat')
    })
  })

  describe('InvoiceStatus', () => {
    it('should follow verification lifecycle', () => {
      const statuses: InvoiceStatus[] = ['pending', 'verified', 'recorded']
      expect(statuses).toHaveLength(3)
    })

    it('should progress from pending through verified to recorded', () => {
      const flow: InvoiceStatus[] = ['pending', 'verified', 'recorded']
      expect(flow[0]).toBe('pending')
      expect(flow[flow.length - 1]).toBe('recorded')
    })
  })

  describe('LedgerType', () => {
    it('should have receivable and payable', () => {
      const types: LedgerType[] = ['receivable', 'payable']
      expect(types).toHaveLength(2)
    })
  })

  describe('LedgerStatus', () => {
    it('should have 3 statuses', () => {
      const statuses: LedgerStatus[] = ['pending', 'partial', 'completed']
      expect(statuses).toHaveLength(3)
    })

    it('partial indicates partial payment', () => {
      const partial: LedgerStatus = 'partial'
      expect(partial).toBe('partial')
    })
  })
})

describe('Finance Structure Validation', () => {
  it('OcrResult should contain line items', () => {
    const ocrItems: OcrItem[] = [
      { name: '服务器', quantity: 2, unitPrice: 50000, total: 100000 },
      { name: '交换机', quantity: 5, unitPrice: 3000, total: 15000 },
    ]

    const ocrResult: OcrResult = {
      invoiceNumber: 'FP-2024-001',
      invoiceDate: '2024-01-15',
      sellerName: '供应商A',
      buyerName: '我方公司',
      totalAmount: 115000,
      taxAmount: 14950,
      items: ocrItems,
    }

    expect(ocrResult.items).toHaveLength(2)
    expect(ocrResult.totalAmount).toBeGreaterThan(0)
  })

  it('Invoice can contain OCR result', () => {
    const invoice: Invoice = {
      id: 'inv-1',
      number: 'FP-2024-001',
      invoiceType: 'vat',
      amount: 100000,
      taxAmount: 13000,
      status: 'pending',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(invoice.ocrResult).toBeUndefined()
    expect(invoice.customerId).toBeUndefined()
  })

  it('Invoice with OCR should link to customer and sales', () => {
    const invoice: Invoice = {
      id: 'inv-1',
      number: 'FP-2024-001',
      invoiceType: 'vat',
      amount: 100000,
      taxAmount: 13000,
      customerId: 'cust-1',
      salesQuoteId: 'q-1',
      salesContractId: 'c-1',
      status: 'verified',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(invoice.customerId).toBe('cust-1')
    expect(invoice.salesQuoteId).toBe('q-1')
    expect(invoice.salesContractId).toBe('c-1')
  })

  it('LedgerEntry should track payment progress', () => {
    const entry: LedgerEntry = {
      id: 'le-1',
      ledgerType: 'receivable',
      amount: 100000,
      paidAmount: 30000,
      dueDate: 1735689600,
      status: 'partial',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(entry.paidAmount).toBeLessThan(entry.amount)
    expect(entry.status).toBe('partial')
    expect(entry.paidAmount).toBeGreaterThan(0)
  })

  it('LedgerEntry completed means fully paid', () => {
    const entry: LedgerEntry = {
      id: 'le-2',
      ledgerType: 'payable',
      amount: 50000,
      paidAmount: 50000,
      dueDate: 1735689600,
      status: 'completed',
      createdAt: 1700000000,
      updatedAt: 1700000000,
    }

    expect(entry.paidAmount).toBe(entry.amount)
    expect(entry.status).toBe('completed')
  })
})
