/**
 * Finance Pilot Integration Tests
 *
 * Story 50.3 - Finance Pilot Integration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type InvoiceContext,
  type ExpenseContext,
  type BudgetContext,
  type PaymentContext,
  type FinanceTool,
  type FinanceToolInput,
  type FinanceToolOutput,
  type FinanceSummary,
  type FinancePilotState,
  type FinancePilotContract,
  type FinanceToolExecutionRecord,
  type FinanceWritebackAction,
  type InvoiceStatus,
  type ExpenseStatus,
  type BudgetStatus,
  type PaymentStatus,
  type InvoiceType,
  type ExpenseCategory,
  type BudgetPeriod,
  type PaymentMethod,
  type FinanceToolType,

  // ID Generation
  generateInvoiceId,
  generateExpenseId,
  generateBudgetId,
  generatePaymentId,
  generateFinanceSummaryId,
  generateFinanceToolId,
  generateFinanceRecordId,
  generateFinanceWritebackId,

  // Context Factory
  createInvoiceContext,
  createExpenseContext,
  createBudgetContext,
  createPaymentContext,

  // Tool Factory
  createFinanceTool,

  // Contract and State Factory
  createFinancePilotContract,
  createFinancePilotState,

  // Tool Registration
  getDefaultFinanceTools,
  registerTool,
  registerDefaultTools,
  getTool,
  getToolByType,

  // Permission and Validation
  checkToolPermission,
  checkInvoiceStatus,
  checkExpenseStatus,
  checkBudgetStatus,
  checkPaymentStatus,
  validateToolInput,

  // Tool Execution
  executeFinanceTool,

  // Summary Generation
  generateInvoiceSummary,
  generateExpenseSummary,
  generateBudgetSummary,
  generatePaymentSummary,

  // Writeback Integration
  createFinanceWritebackAction,
  prepareInvoiceWriteback,
  prepareExpenseWriteback,
  prepareBudgetWriteback,
  preparePaymentWriteback,
  prepareStatusWriteback,

  // Serialization
  serializeInvoiceContext,
  deserializeInvoiceContext,
  serializeExpenseContext,
  deserializeExpenseContext,
  serializeBudgetContext,
  deserializeBudgetContext,
  serializePaymentContext,
  deserializePaymentContext,
  serializeFinanceTool,
  deserializeFinanceTool,
  serializeFinanceSummary,
  deserializeFinanceSummary,
  serializeFinancePilotState,
  deserializeFinancePilotState,

  // Debug Formatting
  getInvoiceStatusName,
  getInvoiceTypeName,
  getExpenseStatusName,
  getExpenseCategoryName,
  getBudgetStatusName,
  getBudgetPeriodName,
  getPaymentStatusName,
  getPaymentMethodName,
  formatInvoiceContext,
  formatExpenseContext,
  formatBudgetContext,
  formatPaymentContext,
  formatFinanceTool,
  formatFinanceSummary,
  formatToolExecutionRecord,
} from '@/features/session/runtime/financePilot'

describe('Finance Pilot Integration', () => {
  describe('ID Generation', () => {
    it('should generate unique invoice IDs', () => {
      const id1 = generateInvoiceId()
      const id2 = generateInvoiceId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-invoice-\d+-[a-z0-9]+$/)
      expect(id2).toMatch(/^fin-invoice-\d+-[a-z0-9]+$/)
    })

    it('should generate unique expense IDs', () => {
      const id1 = generateExpenseId()
      const id2 = generateExpenseId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-expense-\d+-[a-z0-9]+$/)
    })

    it('should generate unique budget IDs', () => {
      const id1 = generateBudgetId()
      const id2 = generateBudgetId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-budget-\d+-[a-z0-9]+$/)
    })

    it('should generate unique payment IDs', () => {
      const id1 = generatePaymentId()
      const id2 = generatePaymentId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-payment-\d+-[a-z0-9]+$/)
    })

    it('should generate unique summary IDs', () => {
      const id1 = generateFinanceSummaryId()
      const id2 = generateFinanceSummaryId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-summary-\d+-[a-z0-9]+$/)
    })

    it('should generate unique tool IDs', () => {
      const id1 = generateFinanceToolId()
      const id2 = generateFinanceToolId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-tool-\d+-[a-z0-9]+$/)
    })

    it('should generate unique record IDs', () => {
      const id1 = generateFinanceRecordId()
      const id2 = generateFinanceRecordId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-record-\d+-[a-z0-9]+$/)
    })

    it('should generate unique writeback IDs', () => {
      const id1 = generateFinanceWritebackId()
      const id2 = generateFinanceWritebackId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^fin-writeback-\d+-[a-z0-9]+$/)
    })
  })

  describe('Context Factory', () => {
    describe('Create Invoice Context', () => {
      it('should create invoice context with defaults', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        expect(invoice.invoiceNumber).toBe('INV-001')
        expect(invoice.type).toBe('sales')
        expect(invoice.status).toBe('draft')
        expect(invoice.amount).toBe(1000)
        expect(invoice.currency).toBe('CNY')
        expect(invoice.invoiceId).toBeDefined()
        expect(invoice.createdAt).toBeDefined()
        expect(invoice.createdBy).toBe('system')
      })

      it('should create invoice context with options', () => {
        const invoice = createInvoiceContext('INV-002', 'purchase', 2000, 'USD', {
          customerId: 'cust-001',
          customerName: '测试客户',
          description: '测试发票',
          createdBy: 'user-001',
        })
        expect(invoice.customerId).toBe('cust-001')
        expect(invoice.customerName).toBe('测试客户')
        expect(invoice.description).toBe('测试发票')
        expect(invoice.createdBy).toBe('user-001')
      })

      it('should calculate due date', () => {
        const invoice = createInvoiceContext('INV-003', 'sales', 1000, 'CNY')
        const issueDate = new Date(invoice.issueDate)
        const dueDate = new Date(invoice.dueDate)
        const diffDays = Math.round((dueDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24))
        expect(diffDays).toBe(30)
      })
    })

    describe('Create Expense Context', () => {
      it('should create expense context with defaults', () => {
        const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY')
        expect(expense.expenseNumber).toBe('EXP-001')
        expect(expense.category).toBe('travel')
        expect(expense.status).toBe('draft')
        expect(expense.amount).toBe(500)
        expect(expense.currency).toBe('CNY')
        expect(expense.expenseId).toBeDefined()
      })

      it('should create expense context with options', () => {
        const expense = createExpenseContext('EXP-002', 'meals', 200, 'CNY', {
          description: '客户招待',
          vendor: '测试餐厅',
          projectId: 'proj-001',
          createdBy: 'user-001',
        })
        expect(expense.description).toBe('客户招待')
        expect(expense.vendor).toBe('测试餐厅')
        expect(expense.projectId).toBe('proj-001')
        expect(expense.createdBy).toBe('user-001')
      })
    })

    describe('Create Budget Context', () => {
      it('should create budget context with defaults', () => {
        const budget = createBudgetContext('市场推广预算', 100000, 'monthly')
        expect(budget.name).toBe('市场推广预算')
        expect(budget.period).toBe('monthly')
        expect(budget.status).toBe('draft')
        expect(budget.totalAmount).toBe(100000)
        expect(budget.usedAmount).toBe(0)
        expect(budget.remainingAmount).toBe(100000)
        expect(budget.budgetId).toBeDefined()
      })

      it('should calculate period end date', () => {
        const monthly = createBudgetContext('月度预算', 10000, 'monthly')
        const quarterly = createBudgetContext('季度预算', 30000, 'quarterly')
        const yearly = createBudgetContext('年度预算', 120000, 'yearly')

        const monthlyDiff = Math.round(
          (new Date(monthly.endDate).getTime() - new Date(monthly.startDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        const quarterlyDiff = Math.round(
          (new Date(quarterly.endDate).getTime() - new Date(quarterly.startDate).getTime()) / (1000 * 60 * 60 * 24)
        )
        const yearlyDiff = Math.round(
          (new Date(yearly.endDate).getTime() - new Date(yearly.startDate).getTime()) / (1000 * 60 * 60 * 24)
        )

        expect(monthlyDiff).toBeGreaterThanOrEqual(28)
        expect(monthlyDiff).toBeLessThanOrEqual(31)
        expect(quarterlyDiff).toBeGreaterThanOrEqual(89)
        expect(quarterlyDiff).toBeLessThanOrEqual(92)
        expect(yearlyDiff).toBeGreaterThanOrEqual(364)
        expect(yearlyDiff).toBeLessThanOrEqual(366)
      })
    })

    describe('Create Payment Context', () => {
      it('should create payment context with defaults', () => {
        const payment = createPaymentContext('PAY-001', 1000, 'CNY', 'bank_transfer')
        expect(payment.paymentNumber).toBe('PAY-001')
        expect(payment.status).toBe('pending')
        expect(payment.method).toBe('bank_transfer')
        expect(payment.amount).toBe(1000)
        expect(payment.currency).toBe('CNY')
        expect(payment.paymentId).toBeDefined()
      })

      it('should create payment context with options', () => {
        const payment = createPaymentContext('PAY-002', 2000, 'USD', 'credit_card', {
          invoiceId: 'inv-001',
          invoiceNumber: 'INV-001',
          payerName: '付款方',
          payeeName: '收款方',
          createdBy: 'user-001',
        })
        expect(payment.invoiceId).toBe('inv-001')
        expect(payment.invoiceNumber).toBe('INV-001')
        expect(payment.payerName).toBe('付款方')
        expect(payment.payeeName).toBe('收款方')
        expect(payment.createdBy).toBe('user-001')
      })
    })
  })

  describe('Tool Factory', () => {
    it('should create finance tool', () => {
      const tool = createFinanceTool('create_invoice')
      expect(tool.toolType).toBe('create_invoice')
      expect(tool.name).toBe('创建发票')
      expect(tool.requiredPermission).toBe('write')
      expect(tool.requiresConfirmation).toBe(false)
      expect(tool.isDestructive).toBe(false)
      expect(tool.riskLevel).toBe('low')
    })

    it('should create tool with custom options', () => {
      const tool = createFinanceTool('approve_invoice', {
        name: '自定义审批',
        riskLevel: 'high',
      })
      expect(tool.name).toBe('自定义审批')
      expect(tool.riskLevel).toBe('high')
      expect(tool.requiresConfirmation).toBe(true) // Default for approve_invoice
    })

    it('should create high-risk tools with confirmation', () => {
      const approveTool = createFinanceTool('approve_invoice')
      expect(approveTool.requiresConfirmation).toBe(true)
      expect(approveTool.riskLevel).toBe('high')

      const processPaymentTool = createFinanceTool('process_payment')
      expect(processPaymentTool.requiresConfirmation).toBe(true)
      expect(processPaymentTool.riskLevel).toBe('high')
    })
  })

  describe('Contract and State Factory', () => {
    it('should create finance pilot contract', () => {
      const contract = createFinancePilotContract()
      expect(contract.contractId).toBeDefined()
      expect(contract.allowedInvoiceStatuses).toContain('draft')
      expect(contract.allowedInvoiceStatuses).toContain('approved')
      expect(contract.allowedExpenseStatuses).toContain('draft')
      expect(contract.defaultCurrency).toBe('CNY')
    })

    it('should create contract with custom options', () => {
      const contract = createFinancePilotContract({
        defaultCurrency: 'USD',
        maxInvoiceAmount: 1000000,
        maxExpenseAmount: 50000,
      })
      expect(contract.defaultCurrency).toBe('USD')
      expect(contract.maxInvoiceAmount).toBe(1000000)
      expect(contract.maxExpenseAmount).toBe(50000)
    })

    it('should create finance pilot state', () => {
      const state = createFinancePilotState()
      expect(state.availableTools).toBeInstanceOf(Map)
      expect(state.toolHistory).toEqual([])
      expect(state.contract).toBeDefined()
    })
  })

  describe('Tool Registration', () => {
    let state: FinancePilotState

    beforeEach(() => {
      state = createFinancePilotState()
    })

    it('should register tool', () => {
      const tool = createFinanceTool('create_invoice')
      registerTool(state, tool)
      expect(state.availableTools.size).toBe(1)
      expect(state.availableTools.get(tool.toolId)).toBe(tool)
    })

    it('should register multiple tools', () => {
      const tool1 = createFinanceTool('create_invoice')
      const tool2 = createFinanceTool('create_expense')
      registerTool(state, tool1)
      registerTool(state, tool2)
      expect(state.availableTools.size).toBe(2)
    })

    it('should register all default tools', () => {
      registerDefaultTools(state)
      expect(state.availableTools.size).toBe(22)
    })

    it('should get tool by ID', () => {
      const tool = createFinanceTool('create_invoice')
      registerTool(state, tool)
      const found = getTool(state, tool.toolId)
      expect(found).toBe(tool)
    })

    it('should return undefined for non-existent tool ID', () => {
      const found = getTool(state, 'non-existent')
      expect(found).toBeUndefined()
    })

    it('should get tool by type', () => {
      const tool = createFinanceTool('create_invoice')
      registerTool(state, tool)
      const found = getToolByType(state, 'create_invoice')
      expect(found).toBe(tool)
    })

    it('should return undefined for non-existent tool type', () => {
      const found = getToolByType(state, 'non_existent_type' as FinanceToolType)
      expect(found).toBeUndefined()
    })

    it('should get default finance tools', () => {
      const tools = getDefaultFinanceTools()
      expect(tools.length).toBe(22)
      expect(tools.map(t => t.toolType)).toContain('create_invoice')
      expect(tools.map(t => t.toolType)).toContain('create_expense')
      expect(tools.map(t => t.toolType)).toContain('create_budget')
      expect(tools.map(t => t.toolType)).toContain('create_payment')
      expect(tools.map(t => t.toolType)).toContain('generate_summary')
    })
  })

  describe('Permission and Validation', () => {
    let state: FinancePilotState

    beforeEach(() => {
      state = createFinancePilotState()
      registerDefaultTools(state)
    })

    describe('Check Tool Permission', () => {
      it('should allow read permission for read tools', () => {
        const tool = createFinanceTool('query_invoice')
        const result = checkToolPermission(tool, 'read')
        expect(result.allowed).toBe(true)
      })

      it('should allow write permission for write tools', () => {
        const tool = createFinanceTool('create_invoice')
        const result = checkToolPermission(tool, 'write')
        expect(result.allowed).toBe(true)
      })

      it('should allow admin permission for admin tools', () => {
        const tool = createFinanceTool('approve_invoice')
        const result = checkToolPermission(tool, 'admin')
        expect(result.allowed).toBe(true)
      })

      it('should deny insufficient permission', () => {
        const tool = createFinanceTool('approve_invoice')
        const result = checkToolPermission(tool, 'read')
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe('Insufficient permission')
      })
    })

    describe('Check Status', () => {
      it('should check invoice status', () => {
        expect(checkInvoiceStatus(state.contract, 'draft')).toBe(true)
        expect(checkInvoiceStatus(state.contract, 'approved')).toBe(true)
      })

      it('should check expense status', () => {
        expect(checkExpenseStatus(state.contract, 'draft')).toBe(true)
        expect(checkExpenseStatus(state.contract, 'approved')).toBe(true)
      })

      it('should check budget status', () => {
        expect(checkBudgetStatus(state.contract, 'active')).toBe(true)
        expect(checkBudgetStatus(state.contract, 'draft')).toBe(true)
      })

      it('should check payment status', () => {
        expect(checkPaymentStatus(state.contract, 'pending')).toBe(true)
        expect(checkPaymentStatus(state.contract, 'completed')).toBe(true)
      })
    })

    describe('Validate Tool Input', () => {
      it('should validate create_invoice input', () => {
        const tool = createFinanceTool('create_invoice')
        const input: FinanceToolInput = {
          toolId: tool.toolId,
          toolType: 'create_invoice',
          userId: 'user-001',
          userPermission: 'write',
          params: {
            invoiceNumber: 'INV-001',
            amount: 1000,
          },
        }
        const result = validateToolInput(input, tool, state.contract)
        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
      })

      it('should fail validation for missing required fields', () => {
        const tool = createFinanceTool('create_invoice')
        const input: FinanceToolInput = {
          toolId: tool.toolId,
          toolType: 'create_invoice',
          userId: 'user-001',
          userPermission: 'write',
          params: {},
        }
        const result = validateToolInput(input, tool, state.contract)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should fail validation for insufficient permission', () => {
        const tool = createFinanceTool('approve_invoice')
        const input: FinanceToolInput = {
          toolId: tool.toolId,
          toolType: 'approve_invoice',
          userId: 'user-001',
          userPermission: 'read',
          params: {},
        }
        const result = validateToolInput(input, tool, state.contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Insufficient permission')
      })

      it('should validate expense input', () => {
        const tool = createFinanceTool('create_expense')
        const input: FinanceToolInput = {
          toolId: tool.toolId,
          toolType: 'create_expense',
          userId: 'user-001',
          userPermission: 'write',
          params: {
            expenseNumber: 'EXP-001',
            category: 'travel',
            amount: 500,
          },
        }
        const result = validateToolInput(input, tool, state.contract)
        expect(result.valid).toBe(true)
      })

      it('should validate payment input', () => {
        const tool = createFinanceTool('create_payment')
        const input: FinanceToolInput = {
          toolId: tool.toolId,
          toolType: 'create_payment',
          userId: 'user-001',
          userPermission: 'write',
          params: {
            paymentNumber: 'PAY-001',
            amount: 1000,
            method: 'bank_transfer',
          },
        }
        const result = validateToolInput(input, tool, state.contract)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('Tool Execution', () => {
    let state: FinancePilotState

    beforeEach(() => {
      state = createFinancePilotState()
      registerDefaultTools(state)
    })

    describe('Create Invoice', () => {
      it('should create invoice', () => {
        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'create_invoice',
          userId: 'user-001',
          userName: '测试用户',
          userPermission: 'write',
          params: {
            invoiceNumber: 'INV-001',
            type: 'sales',
            amount: 1000,
            currency: 'CNY',
            customerName: '测试客户',
          },
        })
        expect(result.success).toBe(true)
        expect(result.message).toBe('发票创建成功')
        expect(result.updatedContext).toBeDefined()
        expect(result.summary).toBeDefined()
        expect(state.currentInvoice).toBeDefined()
        expect(state.currentInvoice?.invoiceNumber).toBe('INV-001')
        expect(state.currentInvoice?.customerName).toBe('测试客户')
      })

      it('should fail for missing invoice number', () => {
        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'create_invoice',
          userId: 'user-001',
          userPermission: 'write',
          params: {
            amount: 1000,
          },
        })
        expect(result.success).toBe(false)
        expect(result.errors).toBeDefined()
      })
    })

    describe('Submit Invoice', () => {
      it('should submit invoice', () => {
        // First create invoice
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        state.currentInvoice = invoice

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'submit_invoice',
          userId: 'user-001',
          userPermission: 'write',
          params: {},
          contextType: 'invoice',
          context: invoice,
        })
        expect(result.success).toBe(true)
        expect(result.message).toBe('发票已提交审批')
        expect(result.updatedContext?.status).toBe('pending')
      })

      it('should fail to submit non-draft invoice', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        invoice.status = 'approved'
        state.currentInvoice = invoice

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'submit_invoice',
          userId: 'user-001',
          userPermission: 'write',
          params: {},
          contextType: 'invoice',
          context: invoice,
        })
        expect(result.success).toBe(false)
      })
    })

    describe('Approve Invoice', () => {
      it('should require confirmation', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        invoice.status = 'pending'
        state.currentInvoice = invoice

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'approve_invoice',
          userId: 'user-001',
          userPermission: 'admin',
          params: {},
          contextType: 'invoice',
          context: invoice,
        })
        expect(result.success).toBe(false)
        expect(result.requiresConfirmation).toBe(true)
        expect(result.confirmationMessage).toContain('确认审批')
      })

      it('should approve with dry run', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        invoice.status = 'pending'
        state.currentInvoice = invoice

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'approve_invoice',
          userId: 'user-001',
          userPermission: 'admin',
          params: {},
          contextType: 'invoice',
          context: invoice,
          dryRun: true,
        })
        expect(result.success).toBe(true)
        expect(result.message).toContain('Dry run')
        expect(result.requiresConfirmation).toBe(true)
      })
    })

    describe('Create Expense', () => {
      it('should create expense', () => {
        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'create_expense',
          userId: 'user-001',
          userName: '测试用户',
          userPermission: 'write',
          params: {
            expenseNumber: 'EXP-001',
            category: 'travel',
            amount: 500,
            currency: 'CNY',
            description: '出差报销',
          },
        })
        expect(result.success).toBe(true)
        expect(result.message).toBe('费用创建成功')
        expect(state.currentExpense).toBeDefined()
        expect(state.currentExpense?.category).toBe('travel')
      })
    })

    describe('Submit Expense', () => {
      it('should submit expense', () => {
        const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY')
        state.currentExpense = expense

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'submit_expense',
          userId: 'user-001',
          userPermission: 'write',
          params: {},
          contextType: 'expense',
          context: expense,
        })
        expect(result.success).toBe(true)
        expect(result.updatedContext?.status).toBe('submitted')
      })
    })

    describe('Approve Expense', () => {
      it('should require confirmation', () => {
        const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY')
        expense.status = 'submitted'
        state.currentExpense = expense

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'approve_expense',
          userId: 'user-001',
          userPermission: 'admin',
          params: {},
          contextType: 'expense',
          context: expense,
        })
        expect(result.success).toBe(false)
        expect(result.requiresConfirmation).toBe(true)
      })
    })

    describe('Create Budget', () => {
      it('should create budget', () => {
        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'create_budget',
          userId: 'user-001',
          userPermission: 'admin',
          params: {
            name: '市场预算',
            totalAmount: 100000,
            period: 'monthly',
          },
        })
        expect(result.success).toBe(true)
        expect(result.message).toBe('预算创建成功')
        expect(state.currentBudget).toBeDefined()
        expect(state.currentBudget?.name).toBe('市场预算')
      })
    })

    describe('Check Budget', () => {
      it('should check budget and add warnings', () => {
        const budget = createBudgetContext('测试预算', 10000, 'monthly')
        budget.usedAmount = 8000 // 80% usage
        budget.remainingAmount = 2000
        state.currentBudget = budget

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'check_budget',
          userId: 'user-001',
          userPermission: 'read',
          params: {},
          contextType: 'budget',
          context: budget,
        })
        expect(result.success).toBe(true)
        expect(result.warnings).toBeDefined()
        expect(result.warnings?.length).toBeGreaterThan(0)
      })
    })

    describe('Create Payment', () => {
      it('should create payment', () => {
        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'create_payment',
          userId: 'user-001',
          userName: '测试用户',
          userPermission: 'write',
          params: {
            paymentNumber: 'PAY-001',
            amount: 1000,
            currency: 'CNY',
            method: 'bank_transfer',
            invoiceNumber: 'INV-001',
          },
        })
        expect(result.success).toBe(true)
        expect(result.message).toBe('付款创建成功')
        expect(state.currentPayment).toBeDefined()
        expect(state.currentPayment?.method).toBe('bank_transfer')
      })
    })

    describe('Process Payment', () => {
      it('should require confirmation', () => {
        const payment = createPaymentContext('PAY-001', 1000, 'CNY', 'bank_transfer')
        state.currentPayment = payment

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'process_payment',
          userId: 'user-001',
          userPermission: 'admin',
          params: {},
          contextType: 'payment',
          context: payment,
        })
        expect(result.success).toBe(false)
        expect(result.requiresConfirmation).toBe(true)
        expect(result.confirmationMessage).toContain('确认执行此付款')
      })
    })

    describe('Generate Summary', () => {
      it('should generate invoice summary', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        state.currentInvoice = invoice

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'generate_summary',
          userId: 'user-001',
          userPermission: 'read',
          params: {},
          contextType: 'invoice',
          context: invoice,
        })
        expect(result.success).toBe(true)
        expect(result.summary).toBeDefined()
        expect(result.summary?.summaryType).toBe('invoice')
      })

      it('should generate expense summary', () => {
        const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY')
        state.currentExpense = expense

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'generate_summary',
          userId: 'user-001',
          userPermission: 'read',
          params: {},
          contextType: 'expense',
          context: expense,
        })
        expect(result.success).toBe(true)
        expect(result.summary?.summaryType).toBe('expense')
      })
    })

    describe('Fill Expense Form', () => {
      it('should fill expense form', () => {
        const expense = createExpenseContext('EXP-001', 'meals', 200, 'CNY', {
          description: '客户招待',
          expenseDate: '2026-03-23',
        })
        state.currentExpense = expense

        const result = executeFinanceTool(state, {
          toolId: '',
          toolType: 'fill_expense_form',
          userId: 'user-001',
          userPermission: 'write',
          params: {},
          contextType: 'expense',
          context: expense,
        })
        expect(result.success).toBe(true)
        expect(result.writebackActions).toBeDefined()
        expect(result.writebackActions?.length).toBeGreaterThan(0)
      })
    })

    describe('Tool History', () => {
      it('should record tool execution', () => {
        executeFinanceTool(state, {
          toolId: '',
          toolType: 'create_invoice',
          userId: 'user-001',
          userName: '测试用户',
          userPermission: 'write',
          params: {
            invoiceNumber: 'INV-001',
            amount: 1000,
          },
        })
        expect(state.toolHistory.length).toBe(1)
        const record = state.toolHistory[0]
        expect(record.toolType).toBe('create_invoice')
        expect(record.userId).toBe('user-001')
        expect(record.userName).toBe('测试用户')
        expect(record.success).toBe(true)
      })
    })
  })

  describe('Summary Generation', () => {
    it('should generate invoice summary', () => {
      const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY', {
        customerName: '测试客户',
      })
      const summary = generateInvoiceSummary(invoice)
      expect(summary.summaryType).toBe('invoice')
      expect(summary.title).toContain('INV-001')
      expect(summary.keyFields.length).toBeGreaterThan(0)
      expect(summary.amount).toBe(1000)
      expect(summary.currency).toBe('CNY')
      expect(summary.status).toBe('draft')
    })

    it('should generate expense summary', () => {
      const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY')
      const summary = generateExpenseSummary(expense)
      expect(summary.summaryType).toBe('expense')
      expect(summary.title).toContain('EXP-001')
      expect(summary.amount).toBe(500)
    })

    it('should generate budget summary with usage percent', () => {
      const budget = createBudgetContext('测试预算', 10000, 'monthly')
      budget.usedAmount = 3000
      budget.remainingAmount = 7000
      const summary = generateBudgetSummary(budget)
      expect(summary.summaryType).toBe('budget')
      expect(summary.title).toContain('测试预算')
      const usageField = summary.keyFields.find(f => f.key === 'usagePercent')
      expect(usageField).toBeDefined()
      expect(usageField?.value).toContain('30.0%')
    })

    it('should generate payment summary', () => {
      const payment = createPaymentContext('PAY-001', 1000, 'CNY', 'bank_transfer')
      const summary = generatePaymentSummary(payment)
      expect(summary.summaryType).toBe('payment')
      expect(summary.title).toContain('PAY-001')
      expect(summary.amount).toBe(1000)
    })
  })

  describe('Writeback Integration', () => {
    it('should create finance writeback action', () => {
      const action = createFinanceWritebackAction('update_list', 'test_target', { key: 'value' })
      expect(action.actionId).toBeDefined()
      expect(action.actionType).toBe('update_list')
      expect(action.target).toBe('test_target')
      expect(action.data.key).toBe('value')
    })

    it('should prepare invoice writeback', () => {
      const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
      const action = prepareInvoiceWriteback(invoice)
      expect(action.actionType).toBe('update_list')
      expect(action.target).toBe('invoice_list')
      expect(action.data.invoiceNumber).toBe('INV-001')
    })

    it('should prepare expense writeback', () => {
      const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY')
      const action = prepareExpenseWriteback(expense)
      expect(action.actionType).toBe('update_list')
      expect(action.target).toBe('expense_list')
      expect(action.data.expenseNumber).toBe('EXP-001')
    })

    it('should prepare budget writeback', () => {
      const budget = createBudgetContext('测试预算', 10000, 'monthly')
      const action = prepareBudgetWriteback(budget)
      expect(action.actionType).toBe('update_list')
      expect(action.target).toBe('budget_list')
      expect(action.data.name).toBe('测试预算')
    })

    it('should prepare payment writeback', () => {
      const payment = createPaymentContext('PAY-001', 1000, 'CNY', 'bank_transfer')
      const action = preparePaymentWriteback(payment)
      expect(action.actionType).toBe('update_list')
      expect(action.target).toBe('payment_list')
      expect(action.data.paymentNumber).toBe('PAY-001')
    })

    it('should prepare status writeback', () => {
      const action = prepareStatusWriteback('invoice', 'inv-001', 'approved')
      expect(action.actionType).toBe('update_status')
      expect(action.target).toBe('invoice_inv-001')
      expect(action.data.status).toBe('approved')
    })
  })

  describe('Serialization', () => {
    describe('Invoice Context', () => {
      it('should serialize and deserialize', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        const json = serializeInvoiceContext(invoice)
        const restored = deserializeInvoiceContext(json)
        expect(restored).toEqual(invoice)
      })
    })

    describe('Expense Context', () => {
      it('should serialize and deserialize', () => {
        const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY')
        const json = serializeExpenseContext(expense)
        const restored = deserializeExpenseContext(json)
        expect(restored).toEqual(expense)
      })
    })

    describe('Budget Context', () => {
      it('should serialize and deserialize', () => {
        const budget = createBudgetContext('测试预算', 10000, 'monthly')
        const json = serializeBudgetContext(budget)
        const restored = deserializeBudgetContext(json)
        expect(restored).toEqual(budget)
      })
    })

    describe('Payment Context', () => {
      it('should serialize and deserialize', () => {
        const payment = createPaymentContext('PAY-001', 1000, 'CNY', 'bank_transfer')
        const json = serializePaymentContext(payment)
        const restored = deserializePaymentContext(json)
        expect(restored).toEqual(payment)
      })
    })

    describe('Finance Tool', () => {
      it('should serialize and deserialize', () => {
        const tool = createFinanceTool('create_invoice')
        const json = serializeFinanceTool(tool)
        const restored = deserializeFinanceTool(json)
        expect(restored).toEqual(tool)
      })
    })

    describe('Finance Summary', () => {
      it('should serialize and deserialize', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        const summary = generateInvoiceSummary(invoice)
        const json = serializeFinanceSummary(summary)
        const restored = deserializeFinanceSummary(json)
        expect(restored).toEqual(summary)
      })
    })

    describe('Finance Pilot State', () => {
      it('should serialize and deserialize', () => {
        const state = createFinancePilotState()
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        state.currentInvoice = invoice
        registerDefaultTools(state)

        const json = serializeFinancePilotState(state)
        const restored = deserializeFinancePilotState(json)

        expect(restored.currentInvoice).toEqual(invoice)
        expect(restored.availableTools.size).toBe(22)
      })
    })
  })

  describe('Debug Formatting', () => {
    describe('Format Invoice Context', () => {
      it('should format context', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY', {
          customerName: '测试客户',
        })
        const formatted = formatInvoiceContext(invoice)
        expect(formatted).toContain('INV-001')
        expect(formatted).toContain('销售发票')
        expect(formatted).toContain('草稿')
        expect(formatted).toContain('1000')
        expect(formatted).toContain('测试客户')
      })
    })

    describe('Format Expense Context', () => {
      it('should format context', () => {
        const expense = createExpenseContext('EXP-001', 'travel', 500, 'CNY', {
          description: '出差报销',
        })
        const formatted = formatExpenseContext(expense)
        expect(formatted).toContain('EXP-001')
        expect(formatted).toContain('差旅')
        expect(formatted).toContain('草稿')
        expect(formatted).toContain('出差报销')
      })
    })

    describe('Format Budget Context', () => {
      it('should format context', () => {
        const budget = createBudgetContext('测试预算', 10000, 'monthly')
        budget.usedAmount = 3000
        const formatted = formatBudgetContext(budget)
        expect(formatted).toContain('测试预算')
        expect(formatted).toContain('月度')
        expect(formatted).toContain('10000')
        expect(formatted).toContain('3000')
        expect(formatted).toContain('30.0%')
      })
    })

    describe('Format Payment Context', () => {
      it('should format context', () => {
        const payment = createPaymentContext('PAY-001', 1000, 'CNY', 'bank_transfer')
        const formatted = formatPaymentContext(payment)
        expect(formatted).toContain('PAY-001')
        expect(formatted).toContain('银行转账')
        expect(formatted).toContain('待处理')
        expect(formatted).toContain('1000')
      })
    })

    describe('Format Finance Tool', () => {
      it('should format tool', () => {
        const tool = createFinanceTool('approve_invoice')
        const formatted = formatFinanceTool(tool)
        expect(formatted).toContain('审批发票')
        expect(formatted).toContain('admin')
        expect(formatted).toContain('high')
        expect(formatted).toContain('需要确认')
      })
    })

    describe('Format Finance Summary', () => {
      it('should format summary', () => {
        const invoice = createInvoiceContext('INV-001', 'sales', 1000, 'CNY')
        const summary = generateInvoiceSummary(invoice)
        const formatted = formatFinanceSummary(summary)
        expect(formatted).toContain('INV-001')
        expect(formatted).toContain('发票编号')
        expect(formatted).toContain('状态')
      })
    })

    describe('Format Tool Execution Record', () => {
      it('should format record', () => {
        const record: FinanceToolExecutionRecord = {
          recordId: 'rec-001',
          toolId: 'tool-001',
          toolType: 'create_invoice',
          timestamp: '2026-03-23T00:00:00Z',
          userId: 'user-001',
          userName: '测试用户',
          success: true,
          durationMs: 150,
          params: {},
        }
        const formatted = formatToolExecutionRecord(record)
        expect(formatted).toContain('create_invoice')
        expect(formatted).toContain('测试用户')
        expect(formatted).toContain('成功')
        expect(formatted).toContain('150ms')
      })
    })

    describe('Status Names', () => {
      it('should get invoice status names', () => {
        expect(getInvoiceStatusName('draft')).toBe('草稿')
        expect(getInvoiceStatusName('approved')).toBe('已审批')
        expect(getInvoiceStatusName('paid')).toBe('已付款')
      })

      it('should get invoice type names', () => {
        expect(getInvoiceTypeName('sales')).toBe('销售发票')
        expect(getInvoiceTypeName('purchase')).toBe('采购发票')
        expect(getInvoiceTypeName('credit_note')).toBe('贷项通知单')
      })

      it('should get expense status names', () => {
        expect(getExpenseStatusName('draft')).toBe('草稿')
        expect(getExpenseStatusName('approved')).toBe('已审批')
        expect(getExpenseStatusName('reimbursed')).toBe('已报销')
      })

      it('should get expense category names', () => {
        expect(getExpenseCategoryName('travel')).toBe('差旅')
        expect(getExpenseCategoryName('meals')).toBe('餐饮')
        expect(getExpenseCategoryName('office')).toBe('办公')
      })

      it('should get budget status names', () => {
        expect(getBudgetStatusName('active')).toBe('进行中')
        expect(getBudgetStatusName('exceeded')).toBe('超支')
        expect(getBudgetStatusName('closed')).toBe('已关闭')
      })

      it('should get budget period names', () => {
        expect(getBudgetPeriodName('monthly')).toBe('月度')
        expect(getBudgetPeriodName('quarterly')).toBe('季度')
        expect(getBudgetPeriodName('yearly')).toBe('年度')
      })

      it('should get payment status names', () => {
        expect(getPaymentStatusName('pending')).toBe('待处理')
        expect(getPaymentStatusName('completed')).toBe('已完成')
        expect(getPaymentStatusName('failed')).toBe('失败')
      })

      it('should get payment method names', () => {
        expect(getPaymentMethodName('bank_transfer')).toBe('银行转账')
        expect(getPaymentMethodName('credit_card')).toBe('信用卡')
        expect(getPaymentMethodName('online')).toBe('在线支付')
      })
    })
  })
})
