/**
 * Sales 模块 API
 */

import { safeInvoke } from '@/lib/tauri'
import type { Customer, Quote, Contract, CustomerListItem, QuoteListItem, ContractListItem, SalesStats, CreateCustomerRequest } from '../types/sales.types'

export async function createCustomer(request: CreateCustomerRequest): Promise<Customer> {
  const result = await safeInvoke<Customer>('sales_create_customer', { request })
  return result ?? ({} as Customer)
}

export async function listCustomers(): Promise<CustomerListItem[]> {
  const result = await safeInvoke<CustomerListItem[]>('sales_list_customers')
  return result ?? []
}

export async function getCustomer(id: string): Promise<Customer> {
  const result = await safeInvoke<Customer>('sales_get_customer', { id })
  return result ?? ({} as Customer)
}

export async function updateCustomer(id: string, request: CreateCustomerRequest): Promise<Customer> {
  const result = await safeInvoke<Customer>('sales_update_customer', { id, request })
  return result ?? ({} as Customer)
}

export async function deleteCustomer(id: string): Promise<void> {
  await safeInvoke('sales_delete_customer', { id })
}

export async function listQuotes(): Promise<QuoteListItem[]> {
  const result = await safeInvoke<QuoteListItem[]>('sales_list_quotes')
  return result ?? []
}

export async function getQuote(id: string): Promise<Quote> {
  const result = await safeInvoke<Quote>('sales_get_quote', { id })
  return result ?? ({} as Quote)
}

export async function listContracts(): Promise<ContractListItem[]> {
  const result = await safeInvoke<ContractListItem[]>('sales_list_contracts')
  return result ?? []
}

export async function getContract(id: string): Promise<Contract> {
  const result = await safeInvoke<Contract>('sales_get_contract', { id })
  return result ?? ({} as Contract)
}

export async function getSalesStats(): Promise<SalesStats> {
  const result = await safeInvoke<SalesStats>('sales_get_stats')
  return result ?? ({} as SalesStats)
}

export const salesApi = { createCustomer, listCustomers, getCustomer, updateCustomer, deleteCustomer, listQuotes, getQuote, listContracts, getContract, getStats: getSalesStats }
