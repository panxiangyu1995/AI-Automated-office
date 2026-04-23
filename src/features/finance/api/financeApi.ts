/**
 * Finance 模块 API
 */

import { safeInvoke } from '@/lib/tauri'
import type { Invoice, LedgerEntry, InvoiceListItem, LedgerListItem, FinanceStats, CreateInvoiceRequest, CreateLedgerRequest } from '../types/finance.types'

export async function createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
  const result = await safeInvoke<Invoice>('finance_create_invoice', { request })
  return result ?? ({} as Invoice)
}

export async function listInvoices(): Promise<InvoiceListItem[]> {
  const result = await safeInvoke<InvoiceListItem[]>('finance_list_invoices')
  return result ?? []
}

export async function getInvoice(id: string): Promise<Invoice> {
  const result = await safeInvoke<Invoice>('finance_get_invoice', { id })
  return result ?? ({} as Invoice)
}

export async function verifyInvoice(id: string): Promise<Invoice> {
  const result = await safeInvoke<Invoice>('finance_verify_invoice', { id })
  return result ?? ({} as Invoice)
}

export async function createLedger(request: CreateLedgerRequest): Promise<LedgerEntry> {
  const result = await safeInvoke<LedgerEntry>('finance_create_ledger', { request })
  return result ?? ({} as LedgerEntry)
}

export async function listLedger(ledgerType?: string): Promise<LedgerListItem[]> {
  const result = await safeInvoke<LedgerListItem[]>('finance_list_ledger', { ledgerType })
  return result ?? []
}

export async function getLedger(id: string): Promise<LedgerEntry> {
  const result = await safeInvoke<LedgerEntry>('finance_get_ledger', { id })
  return result ?? ({} as LedgerEntry)
}

export async function recordPayment(id: string, amount: number): Promise<LedgerEntry> {
  const result = await safeInvoke<LedgerEntry>('finance_record_payment', { id, amount })
  return result ?? ({} as LedgerEntry)
}

export async function getFinanceStats(): Promise<FinanceStats> {
  const result = await safeInvoke<FinanceStats>('finance_get_stats')
  return result ?? ({} as FinanceStats)
}

export const financeApi = { createInvoice, listInvoices, getInvoice, verifyInvoice, createLedger, listLedger, getLedger, recordPayment, getStats: getFinanceStats }
