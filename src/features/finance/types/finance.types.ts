/**
 * Finance 模块类型定义
 */

export type InvoiceType = 'vat' | 'normal' | 'receipt'
export type InvoiceStatus = 'pending' | 'verified' | 'recorded'
export type LedgerType = 'receivable' | 'payable'
export type LedgerStatus = 'pending' | 'partial' | 'completed'

export interface OcrResult {
  invoiceNumber: string
  invoiceDate: string
  sellerName: string
  buyerName: string
  totalAmount: number
  taxAmount: number
  items: OcrItem[]
}

export interface OcrItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  number: string
  invoiceType: InvoiceType
  amount: number
  taxAmount: number
  customerId?: string
  salesQuoteId?: string
  salesContractId?: string
  ocrResult?: OcrResult
  status: InvoiceStatus
  createdAt: number
  updatedAt: number
}

export interface LedgerEntry {
  id: string
  ledgerType: LedgerType
  amount: number
  paidAmount: number
  customerId?: string
  invoiceId?: string
  dueDate: number
  status: LedgerStatus
  createdAt: number
  updatedAt: number
}

export interface CreateInvoiceRequest {
  number: string
  invoiceType: InvoiceType
  amount: number
  taxAmount: number
  customerId?: string
}

export interface CreateLedgerRequest {
  ledgerType: LedgerType
  amount: number
  customerId?: string
  invoiceId?: string
  dueDate: number
}

export interface InvoiceListItem {
  id: string
  number: string
  invoiceType: InvoiceType
  amount: number
  status: InvoiceStatus
  createdAt: number
}

export interface LedgerListItem {
  id: string
  ledgerType: LedgerType
  amount: number
  paidAmount: number
  status: LedgerStatus
  dueDate: number
  createdAt: number
}

export interface FinanceStats {
  totalReceivable: number
  totalPayable: number
  totalInvoices: number
  pendingCount: number
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = { vat: '增值税发票', normal: '普通发票', receipt: '收据' }
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = { pending: '待审核', verified: '已验证', recorded: '已入账' }
export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = { pending: 'bg-yellow-500', verified: 'bg-green-500', recorded: 'bg-blue-500' }
export const LEDGER_TYPE_LABELS: Record<LedgerType, string> = { receivable: '应收', payable: '应付' }
