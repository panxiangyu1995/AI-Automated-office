/**
 * Sales 模块 API
 */

import { invoke } from '@tauri-apps/api/core'
import type { Customer, Quote, Contract, CustomerListItem, QuoteListItem, ContractListItem, SalesStats, CreateCustomerRequest } from '../types/sales.types'

export async function createCustomer(request: CreateCustomerRequest): Promise<Customer> {
  return invoke('sales_create_customer', { request })
}

export async function listCustomers(): Promise<CustomerListItem[]> {
  return invoke('sales_list_customers')
}

export async function getCustomer(id: string): Promise<Customer> {
  return invoke('sales_get_customer', { id })
}

export async function updateCustomer(id: string, request: CreateCustomerRequest): Promise<Customer> {
  return invoke('sales_update_customer', { id, request })
}

export async function deleteCustomer(id: string): Promise<void> {
  return invoke('sales_delete_customer', { id })
}

export async function listQuotes(): Promise<QuoteListItem[]> {
  return invoke('sales_list_quotes')
}

export async function getQuote(id: string): Promise<Quote> {
  return invoke('sales_get_quote', { id })
}

export async function listContracts(): Promise<ContractListItem[]> {
  return invoke('sales_list_contracts')
}

export async function getContract(id: string): Promise<Contract> {
  return invoke('sales_get_contract', { id })
}

export async function getSalesStats(): Promise<SalesStats> {
  return invoke('sales_get_stats')
}

export const salesApi = { createCustomer, listCustomers, getCustomer, updateCustomer, deleteCustomer, listQuotes, getQuote, listContracts, getContract, getStats: getSalesStats }
