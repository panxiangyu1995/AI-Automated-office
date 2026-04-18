/**
 * Finance 模块 Hooks - 使用统一 Hooks 封装
 * Phase 11-20: 应用统一Hooks到各业务模块
 */

import { useMemo } from 'react'
import { useTauriCommand } from '@/hooks/useTauriCommand'
import type {
  Invoice,
  InvoiceListItem,
  InvoiceStatus,
  InvoiceType,
  LedgerEntry,
  LedgerListItem,
  LedgerStatus,
  LedgerType,
  OcrResult,
  FinanceStats,
} from '../types/finance.types'

// ==================== 发票 Hooks ====================

/**
 * 发票列表 Hook
 */
export function useInvoices(status?: InvoiceStatus, invoiceType?: InvoiceType) {
  return useTauriCommand<InvoiceListItem[]>({
    command: 'finance_list_invoices',
    params: { status, invoiceType },
  })
}

/**
 * 单个发票 Hook
 */
export function useInvoice(id: string | null) {
  return useTauriCommand<Invoice | null>({
    command: 'finance_get_invoice',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建发票 Hook
 */
export function useCreateInvoice() {
  return useTauriCommand<Invoice>({
    command: 'finance_create_invoice',
  })
}

/**
 * 更新发票 Hook
 */
export function useUpdateInvoice() {
  return useTauriCommand<Invoice>({
    command: 'finance_update_invoice',
  })
}

/**
 * 删除发票 Hook
 */
export function useDeleteInvoice() {
  return useTauriCommand<void>({
    command: 'finance_delete_invoice',
  })
}

/**
 * OCR 识别发票 Hook
 */
export function useOcrInvoice() {
  return useTauriCommand<OcrResult>({
    command: 'finance_ocr_invoice',
  })
}

// ==================== 台账 Hooks ====================

/**
 * 台账列表 Hook
 */
export function useLedgerEntries(ledgerType?: LedgerType, status?: LedgerStatus) {
  return useTauriCommand<LedgerListItem[]>({
    command: 'finance_list_ledger',
    params: { ledgerType, status },
  })
}

/**
 * 单个台账 Hook
 */
export function useLedgerEntry(id: string | null) {
  return useTauriCommand<LedgerEntry | null>({
    command: 'finance_get_ledger',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建台账 Hook
 */
export function useCreateLedger() {
  return useTauriCommand<LedgerEntry>({
    command: 'finance_create_ledger',
  })
}

/**
 * 更新台账 Hook
 */
export function useUpdateLedger() {
  return useTauriCommand<LedgerEntry>({
    command: 'finance_update_ledger',
  })
}

/**
 * 删除台账 Hook
 */
export function useDeleteLedger() {
  return useTauriCommand<void>({
    command: 'finance_delete_ledger',
  })
}

// ==================== 统计 Hooks ====================

/**
 * 财务统计 Hook
 */
export function useFinanceStats() {
  return useTauriCommand<FinanceStats>({
    command: 'finance_get_stats',
  })
}

// ==================== 辅助函数 ====================

/**
 * 财务仪表盘 Hook（组合多个数据源）
 */
export function useFinanceDashboard() {
  const stats = useFinanceStats()
  const pendingInvoices = useInvoices('pending')
  const pendingLedger = useLedgerEntries(undefined, 'pending')

  return useMemo(
    () => ({
      stats,
      pendingInvoices,
      pendingLedger,
      isLoading: stats.loading || pendingInvoices.loading || pendingLedger.loading,
      error: stats.error || pendingInvoices.error || pendingLedger.error,
    }),
    [stats, pendingInvoices, pendingLedger]
  )
}
