/**
 * Sales 模块类型定义
 */

export type CustomerType = 'individual' | 'corporate'
export type CustomerLevel = 'A' | 'B' | 'C'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type ContractStatus = 'draft' | 'signed' | 'executing' | 'completed'

export interface Customer {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  address: string
  customerType: CustomerType
  level: CustomerLevel
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface QuoteItem {
  id: string
  product: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Quote {
  id: string
  number: string
  customerId: string
  customerName: string
  items: QuoteItem[]
  totalAmount: number
  status: QuoteStatus
  validUntil: number
  createdAt: number
  updatedAt: number
}

export interface ContractItem {
  id: string
  product: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Contract {
  id: string
  number: string
  customerId: string
  customerName: string
  quoteId?: string
  items: ContractItem[]
  totalAmount: number
  status: ContractStatus
  signDate?: number
  expireDate?: number
  createdAt: number
  updatedAt: number
}

export interface CreateCustomerRequest {
  name: string
  contact: string
  phone: string
  email: string
  address: string
  customerType?: CustomerType
  level?: CustomerLevel
  tags?: string[]
}

export interface CustomerListItem {
  id: string
  name: string
  phone: string
  email: string
  customerType: CustomerType
  level: CustomerLevel
  createdAt: number
}

export interface QuoteListItem {
  id: string
  number: string
  customerName: string
  totalAmount: number
  status: QuoteStatus
  validUntil: number
  createdAt: number
}

export interface ContractListItem {
  id: string
  number: string
  customerName: string
  totalAmount: number
  status: ContractStatus
  signDate?: number
  createdAt: number
}

export interface SalesStats {
  totalCustomers: number
  totalQuotes: number
  totalContracts: number
  totalAmount: number
}

export const LEVEL_LABELS: Record<CustomerLevel, string> = { A: 'A级', B: 'B级', C: 'C级' }
export const LEVEL_COLORS: Record<CustomerLevel, string> = { A: 'text-red-500', B: 'text-yellow-500', C: 'text-gray-400' }
