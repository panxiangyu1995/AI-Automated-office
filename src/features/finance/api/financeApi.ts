/**
 * Finance 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
import type { Invoice, LedgerEntry, InvoiceListItem, LedgerListItem, FinanceStats, CreateInvoiceRequest, CreateLedgerRequest } from '../types/finance.types'

export async function createInvoice(request: CreateInvoiceRequest): Promise<Invoice> {
  return invoke('finance_create_invoice', { request })
}

export async function listInvoices(): Promise<InvoiceListItem[]> {
  return invoke('finance_list_invoices')
}

export async function getInvoice(id: string): Promise<Invoice> {
  return invoke('finance_get_invoice', { id })
}

export async function verifyInvoice(id: string): Promise<Invoice> {
  return invoke('finance_verify_invoice', { id })
}

export async function createLedger(request: CreateLedgerRequest): Promise<LedgerEntry> {
  return invoke('finance_create_ledger', { request })
}

export async function listLedger(ledgerType?: string): Promise<LedgerListItem[]> {
  return invoke('finance_list_ledger', { ledgerType })
}

export async function getLedger(id: string): Promise<LedgerEntry> {
  return invoke('finance_get_ledger', { id })
}

export async function recordPayment(id: string, amount: number): Promise<LedgerEntry> {
  return invoke('finance_record_payment', { id, amount })
}

export async function getFinanceStats(): Promise<FinanceStats> {
  return invoke('finance_get_stats')
}

export const financeApi = { createInvoice, listInvoices, getInvoice, verifyInvoice, createLedger, listLedger, getLedger, recordPayment, getStats: getFinanceStats }
