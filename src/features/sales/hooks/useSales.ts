/**
 * Sales 模块 Hooks - 使用统一 Hooks 封装
 * Phase 11-20: 应用统一Hooks到各业务模块
 */

import { useMemo } from 'react'
import { useTauriCommand } from '@/hooks/useTauriCommand'
import type {
  Customer,
  CustomerListItem,
  Quote,
  QuoteListItem,
  QuoteStatus,
  Contract,
  ContractListItem,
  ContractStatus,
  SalesStats,
} from '../types/sales.types'

// ==================== 客户 Hooks ====================

/**
 * 客户列表 Hook
 */
export function useCustomers() {
  return useTauriCommand<CustomerListItem[]>({
    command: 'sales_list_customers',
  })
}

/**
 * 单个客户 Hook
 */
export function useCustomer(id: string | null) {
  return useTauriCommand<Customer | null>({
    command: 'sales_get_customer',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建客户 Hook
 */
export function useCreateCustomer() {
  return useTauriCommand<Customer>({
    command: 'sales_create_customer',
  })
}

/**
 * 更新客户 Hook
 */
export function useUpdateCustomer() {
  return useTauriCommand<Customer>({
    command: 'sales_update_customer',
  })
}

/**
 * 删除客户 Hook
 */
export function useDeleteCustomer() {
  return useTauriCommand<void>({
    command: 'sales_delete_customer',
  })
}

// ==================== 报价单 Hooks ====================

/**
 * 报价单列表 Hook
 */
export function useQuotes(status?: QuoteStatus, customerId?: string) {
  return useTauriCommand<QuoteListItem[]>({
    command: 'sales_list_quotes',
    params: { status, customerId },
  })
}

/**
 * 单个报价单 Hook
 */
export function useQuote(id: string | null) {
  return useTauriCommand<Quote | null>({
    command: 'sales_get_quote',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建报价单 Hook
 */
export function useCreateQuote() {
  return useTauriCommand<Quote>({
    command: 'sales_create_quote',
  })
}

/**
 * 更新报价单 Hook
 */
export function useUpdateQuote() {
  return useTauriCommand<Quote>({
    command: 'sales_update_quote',
  })
}

/**
 * 发送报价单 Hook
 */
export function useSendQuote() {
  return useTauriCommand<Quote>({
    command: 'sales_send_quote',
  })
}

/**
 * 接受报价 Hook
 */
export function useAcceptQuote() {
  return useTauriCommand<Quote>({
    command: 'sales_accept_quote',
  })
}

/**
 * 拒绝报价 Hook
 */
export function useRejectQuote() {
  return useTauriCommand<Quote>({
    command: 'sales_reject_quote',
  })
}

// ==================== 合同 Hooks ====================

/**
 * 合同列表 Hook
 */
export function useContracts(status?: ContractStatus, customerId?: string) {
  return useTauriCommand<ContractListItem[]>({
    command: 'sales_list_contracts',
    params: { status, customerId },
  })
}

/**
 * 单个合同 Hook
 */
export function useContract(id: string | null) {
  return useTauriCommand<Contract | null>({
    command: 'sales_get_contract',
    params: id ? { id } : undefined,
  })
}

/**
 * 创建合同 Hook
 */
export function useCreateContract() {
  return useTauriCommand<Contract>({
    command: 'sales_create_contract',
  })
}

/**
 * 更新合同 Hook
 */
export function useUpdateContract() {
  return useTauriCommand<Contract>({
    command: 'sales_update_contract',
  })
}

/**
 * 签署合同 Hook
 */
export function useSignContract() {
  return useTauriCommand<Contract>({
    command: 'sales_sign_contract',
  })
}

// ==================== 统计 Hooks ====================

/**
 * 销售统计 Hook
 */
export function useSalesStats() {
  return useTauriCommand<SalesStats>({
    command: 'sales_get_stats',
  })
}

// ==================== 辅助 Hooks ====================

/**
 * 销售仪表盘 Hook（组合多个数据源）
 */
export function useSalesDashboard() {
  const stats = useSalesStats()
  const customers = useCustomers()
  const pendingQuotes = useQuotes('sent')

  return useMemo(
    () => ({
      stats,
      customers,
      pendingQuotes,
      isLoading: stats.loading || customers.loading || pendingQuotes.loading,
      error: stats.error || customers.error || pendingQuotes.error,
    }),
    [stats, customers, pendingQuotes]
  )
}
