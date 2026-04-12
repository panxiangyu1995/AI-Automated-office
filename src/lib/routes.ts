import type { TabType } from '../stores/workbenchStore'

export const ROUTE_KEYS = {
  // Dashboard
  DASHBOARD: 'dashboard.home',

  // HR (人事)
  HR_EMPLOYEES: 'hr.employee.list',
  HR_EMPLOYEE_DETAIL: 'hr.employee.detail',
  HR_EMPLOYEE_CREATE: 'hr.employee.create',

  // Finance (财务)
  FINANCE_INVOICES: 'finance.invoice.list',
  FINANCE_INVOICE_DETAIL: 'finance.invoice.detail',
  FINANCE_INVOICE_CREATE: 'finance.invoice.create',
  FINANCE_EXPENSES: 'finance.expense.list',
  FINANCE_REPORTS: 'finance.report.list',

  // Sales (销售)
  SALES_QUOTES: 'sales.quote.list',
  SALES_QUOTE_DETAIL: 'sales.quote.detail',
  SALES_QUOTE_CREATE: 'sales.quote.create',
  SALES_CONTRACTS: 'sales.contract.list',
  SALES_CONTRACT_DETAIL: 'sales.contract.detail',
  SALES_CONTRACT_CREATE: 'sales.contract.create',

  // Approval (审批)
  APPROVAL_LIST: 'approval.list',
  APPROVAL_DETAIL: 'approval.detail',

  // Warehouse (仓储)
  WAREHOUSE_STOCK: 'warehouse.stock.list',
  WAREHOUSE_STOCK_DETAIL: 'warehouse.stock.detail',
  WAREHOUSE_INBOUND: 'warehouse.inbound.list',
  WAREHOUSE_OUTBOUND: 'warehouse.outbound.list',
  WAREHOUSE_WARNING: 'warehouse.warning.list',
  WAREHOUSE_LOGISTICS: 'warehouse.logistics.list',
  WAREHOUSE_LOCATION: 'warehouse.location.list',
  WAREHOUSE_MOVEMENT: 'warehouse.movement.list',

  // Service (售后)
  SERVICE_TICKETS: 'service.ticket.list',
  SERVICE_TICKET_DETAIL: 'service.ticket.detail',
  SERVICE_TICKET_CREATE: 'service.ticket.create',

  // Knowledge (知识库)
  KNOWLEDGE_DOCS: 'knowledge.doc.list',
  KNOWLEDGE_DOC_DETAIL: 'knowledge.doc.detail',
  KNOWLEDGE_DOC_CREATE: 'knowledge.doc.create',

  // Settings (设置)
  SETTINGS: 'settings',
} as const

export type RouteKey = (typeof ROUTE_KEYS)[keyof typeof ROUTE_KEYS]

export interface RouteDefinition {
  key: RouteKey
  path: string
  tabType: TabType
  title: string
}

export const ROUTE_DEFINITIONS: RouteDefinition[] = [
  // Dashboard
  { key: ROUTE_KEYS.DASHBOARD, path: '/', tabType: 'custom', title: '首页' },

  // HR
  { key: ROUTE_KEYS.HR_EMPLOYEES, path: '/hr/employees', tabType: 'list', title: '员工列表' },
  { key: ROUTE_KEYS.HR_EMPLOYEE_DETAIL, path: '/hr/employees/:id', tabType: 'detail', title: '员工详情' },
  { key: ROUTE_KEYS.HR_EMPLOYEE_CREATE, path: '/hr/employees/create', tabType: 'form', title: '新建员工' },

  // Finance
  { key: ROUTE_KEYS.FINANCE_INVOICES, path: '/finance/invoices', tabType: 'list', title: '发票列表' },
  { key: ROUTE_KEYS.FINANCE_INVOICE_DETAIL, path: '/finance/invoices/:id', tabType: 'detail', title: '发票详情' },
  { key: ROUTE_KEYS.FINANCE_INVOICE_CREATE, path: '/finance/invoices/create', tabType: 'form', title: '新建发票' },
  { key: ROUTE_KEYS.FINANCE_EXPENSES, path: '/finance/expenses', tabType: 'list', title: '报销列表' },
  { key: ROUTE_KEYS.FINANCE_REPORTS, path: '/finance/reports', tabType: 'report', title: '财务报表' },

  // Sales
  { key: ROUTE_KEYS.SALES_QUOTES, path: '/sales/quotes', tabType: 'list', title: '报价单列表' },
  { key: ROUTE_KEYS.SALES_QUOTE_DETAIL, path: '/sales/quotes/:id', tabType: 'detail', title: '报价单详情' },
  { key: ROUTE_KEYS.SALES_QUOTE_CREATE, path: '/sales/quotes/create', tabType: 'form', title: '新建报价单' },
  { key: ROUTE_KEYS.SALES_CONTRACTS, path: '/sales/contracts', tabType: 'list', title: '合同列表' },
  { key: ROUTE_KEYS.SALES_CONTRACT_DETAIL, path: '/sales/contracts/:id', tabType: 'detail', title: '合同详情' },
  { key: ROUTE_KEYS.SALES_CONTRACT_CREATE, path: '/sales/contracts/create', tabType: 'form', title: '新建合同' },

  // Approval
  { key: ROUTE_KEYS.APPROVAL_LIST, path: '/approval', tabType: 'list', title: '审批列表' },
  { key: ROUTE_KEYS.APPROVAL_DETAIL, path: '/approval/:id', tabType: 'detail', title: '审批详情' },

  // Warehouse
  { key: ROUTE_KEYS.WAREHOUSE_STOCK, path: '/warehouse/stock', tabType: 'list', title: '库存列表' },
  { key: ROUTE_KEYS.WAREHOUSE_STOCK_DETAIL, path: '/warehouse/stock/:id', tabType: 'detail', title: '库存详情' },
  { key: ROUTE_KEYS.WAREHOUSE_INBOUND, path: '/warehouse/inbound', tabType: 'list', title: '入库单列表' },
  { key: ROUTE_KEYS.WAREHOUSE_OUTBOUND, path: '/warehouse/outbound', tabType: 'list', title: '出库单列表' },
  { key: ROUTE_KEYS.WAREHOUSE_WARNING, path: '/warehouse/warning', tabType: 'list', title: '库存预警' },
  { key: ROUTE_KEYS.WAREHOUSE_LOGISTICS, path: '/warehouse/logistics', tabType: 'list', title: '物流追踪' },
  { key: ROUTE_KEYS.WAREHOUSE_LOCATION, path: '/warehouse/location', tabType: 'list', title: '库位管理' },
  { key: ROUTE_KEYS.WAREHOUSE_MOVEMENT, path: '/warehouse/movement', tabType: 'list', title: '库存流水' },

  // Service
  { key: ROUTE_KEYS.SERVICE_TICKETS, path: '/service/tickets', tabType: 'list', title: '工单列表' },
  { key: ROUTE_KEYS.SERVICE_TICKET_DETAIL, path: '/service/tickets/:id', tabType: 'detail', title: '工单详情' },
  { key: ROUTE_KEYS.SERVICE_TICKET_CREATE, path: '/service/tickets/create', tabType: 'form', title: '新建工单' },

  // Knowledge
  { key: ROUTE_KEYS.KNOWLEDGE_DOCS, path: '/knowledge/docs', tabType: 'list', title: '文档列表' },
  { key: ROUTE_KEYS.KNOWLEDGE_DOC_DETAIL, path: '/knowledge/docs/:id', tabType: 'detail', title: '文档详情' },
  { key: ROUTE_KEYS.KNOWLEDGE_DOC_CREATE, path: '/knowledge/docs/create', tabType: 'form', title: '新建文档' },

  // Settings
  { key: ROUTE_KEYS.SETTINGS, path: '/settings', tabType: 'custom', title: '设置' },
]

export function getRouteDefinition(path: string): RouteDefinition | undefined {
  return ROUTE_DEFINITIONS.find((def) => {
    const regex = new RegExp('^' + def.path.replace(/:[^/]+/g, '[^/]+') + '$')
    return regex.test(path)
  })
}

export function matchRouteKey(path: string): RouteKey | undefined {
  const def = getRouteDefinition(path)
  return def?.key
}

export function getRouteTitle(path: string): string {
  const def = getRouteDefinition(path)
  return def?.title ?? '未命名'
}

export function getTabTypeByPath(path: string): TabType {
  const def = getRouteDefinition(path)
  return def?.tabType ?? 'custom'
}
