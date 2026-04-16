/**
 * Finance Pilot - Tool Permission, Validation, and Execution
 * Extracted from financePilot.ts for file size compliance (<800 lines)
 */

import type { PermissionLevel } from './fieldActionAuthorization'
import { permissionSatisfies } from './fieldActionAuthorization'
import type {
  InvoiceStatus, ExpenseStatus, BudgetStatus, PaymentStatus,
  InvoiceType, ExpenseCategory, BudgetPeriod, PaymentMethod, FinanceToolType,
  InvoiceContext, ExpenseContext, BudgetContext, PaymentContext,
  FinanceTool, FinanceToolInput, FinanceToolOutput, FinancePilotContract, FinancePilotState,
  FinanceToolExecutionRecord, FinanceWritebackAction, FinanceSummary,
} from './financePilotTypes'
import { generateFinanceRecordId, generateFinanceWritebackId } from './financePilotIds'
import {
  createInvoiceContext, createExpenseContext, createBudgetContext, createPaymentContext,
  getToolByType,
} from './financePilotFactory'
import {
  generateInvoiceSummary, generateExpenseSummary, generateBudgetSummary, generatePaymentSummary,
} from './financePilotWriteback'
import {
  prepareInvoiceWriteback, prepareExpenseWriteback, prepareBudgetWriteback,
  preparePaymentWriteback, prepareStatusWriteback,
} from './financePilotWriteback'

// ============================================================================
// Permission and Validation
// ============================================================================

export function checkToolPermission(
  tool: FinanceTool,
  userPermission: PermissionLevel
): { allowed: boolean; reason?: string } {
  if (permissionSatisfies(userPermission, tool.requiredPermission)) {
    return { allowed: true }
  }
  return { allowed: false, reason: 'Insufficient permission' }
}

export function checkInvoiceStatus(
  contract: FinancePilotContract,
  status: InvoiceStatus
): boolean {
  return contract.allowedInvoiceStatuses.includes(status)
}

export function checkExpenseStatus(
  contract: FinancePilotContract,
  status: ExpenseStatus
): boolean {
  return contract.allowedExpenseStatuses.includes(status)
}

export function checkBudgetStatus(
  contract: FinancePilotContract,
  status: BudgetStatus
): boolean {
  return contract.allowedBudgetStatuses.includes(status)
}

export function checkPaymentStatus(
  contract: FinancePilotContract,
  status: PaymentStatus
): boolean {
  return contract.allowedPaymentStatuses.includes(status)
}

export function validateToolInput(
  input: FinanceToolInput,
  tool: FinanceTool,
  _contract: FinancePilotContract
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check permission
  const permCheck = checkToolPermission(tool, input.userPermission)
  if (!permCheck.allowed) {
    errors.push(permCheck.reason || 'Permission denied')
  }

  // Tool-specific validation
  switch (tool.toolType) {
    case 'create_invoice':
      if (!input.params.invoiceNumber) {
        errors.push('Invoice number is required')
      }
      if (!input.params.amount || (input.params.amount as number) <= 0) {
        errors.push('Valid amount is required')
      }
      break

    case 'update_invoice':
    case 'submit_invoice':
    case 'approve_invoice':
    case 'reject_invoice':
    case 'cancel_invoice':
      if (!input.context) {
        errors.push('Invoice context is required')
      }
      break

    case 'create_expense':
      if (!input.params.category) {
        errors.push('Expense category is required')
      }
      if (!input.params.amount || (input.params.amount as number) <= 0) {
        errors.push('Valid amount is required')
      }
      break

    case 'update_expense':
    case 'submit_expense':
    case 'approve_expense':
    case 'reject_expense':
      if (!input.context) {
        errors.push('Expense context is required')
      }
      break

    case 'create_budget':
      if (!input.params.name) {
        errors.push('Budget name is required')
      }
      if (!input.params.totalAmount || (input.params.totalAmount as number) <= 0) {
        errors.push('Valid total amount is required')
      }
      break

    case 'create_payment':
      if (!input.params.amount || (input.params.amount as number) <= 0) {
        errors.push('Valid amount is required')
      }
      if (!input.params.method) {
        errors.push('Payment method is required')
      }
      break

    case 'process_payment': {
      if (input.contextType !== 'payment') {
        errors.push('Payment context is required')
      }
      const paymentCtx = input.context as PaymentContext
      if (paymentCtx?.status !== 'pending') {
        errors.push('Only pending payments can be processed')
      }
      break
    }
  }

  // Custom validation rules
  if (tool.validationRules) {
    for (const rule of tool.validationRules) {
      const value = input.params[rule.field]
      if (rule.rule === 'required' && !value) {
        errors.push(rule.message)
      }
      if (rule.rule === 'minValue' && typeof value === 'number' && value < (rule.value as number)) {
        errors.push(rule.message)
      }
      if (rule.rule === 'maxValue' && typeof value === 'number' && value > (rule.value as number)) {
        errors.push(rule.message)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Tool Execution
// ============================================================================

export function executeFinanceTool(
  state: FinancePilotState,
  input: FinanceToolInput
): FinanceToolOutput {
  const startTime = Date.now()
  const tool = getToolByType(state, input.toolType)

  if (!tool) {
    return {
      success: false,
      message: `Tool not found: ${input.toolType}`,
      toolType: input.toolType,
      errors: ['Tool not found'],
    }
  }

  // Validate input
  const validation = validateToolInput(input, tool, state.contract)
  if (!validation.valid) {
    return {
      success: false,
      message: 'Validation failed',
      toolType: input.toolType,
      errors: validation.errors,
    }
  }

  // Check if confirmation is needed
  if (tool.requiresConfirmation && !input.dryRun) {
    return {
      success: false,
      message: 'Confirmation required',
      toolType: input.toolType,
      requiresConfirmation: true,
      confirmationMessage: tool.confirmationMessage,
    }
  }

  // Dry run mode
  if (input.dryRun) {
    return {
      success: true,
      message: `Dry run: ${tool.name} would be executed`,
      toolType: input.toolType,
      requiresConfirmation: tool.requiresConfirmation,
      confirmationMessage: tool.confirmationMessage,
    }
  }

  try {
    let updatedContext: InvoiceContext | ExpenseContext | BudgetContext | PaymentContext | undefined
    let summary: FinanceSummary | undefined
    const writebackActions: FinanceWritebackAction[] = []
    const warnings: string[] = []

    switch (input.toolType) {
      case 'create_invoice': {
        const newInvoice = createInvoiceContext(
          input.params.invoiceNumber as string,
          (input.params.type as InvoiceType) || 'sales',
          input.params.amount as number,
          (input.params.currency as string) || state.contract.defaultCurrency,
          {
            customerId: input.params.customerId as string,
            customerName: input.params.customerName as string,
            vendorId: input.params.vendorId as string,
            vendorName: input.params.vendorName as string,
            description: input.params.description as string,
            createdBy: input.userId,
            createdByName: input.userName,
          }
        )
        state.currentInvoice = newInvoice
        updatedContext = newInvoice
        summary = generateInvoiceSummary(newInvoice)
        writebackActions.push(prepareInvoiceWriteback(newInvoice))
        break
      }

      case 'update_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            ...input.params,
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
        }
        break

      case 'submit_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          if (invoiceCtx.status !== 'draft') {
            return {
              success: false,
              message: 'Only draft invoices can be submitted',
              toolType: input.toolType,
              errors: ['Invalid invoice status'],
            }
          }
          updatedContext = {
            ...invoiceCtx,
            status: 'pending',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'pending'))
        }
        break

      case 'approve_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            status: 'approved',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'approved'))
        }
        break

      case 'reject_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            status: 'rejected',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'rejected'))
        }
        break

      case 'cancel_invoice':
        if (input.contextType === 'invoice' && input.context) {
          const invoiceCtx = input.context as InvoiceContext
          updatedContext = {
            ...invoiceCtx,
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          } as InvoiceContext
          state.currentInvoice = updatedContext
          summary = generateInvoiceSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('invoice', updatedContext.invoiceId, 'cancelled'))
        }
        break

      case 'create_expense': {
        const newExpense = createExpenseContext(
          input.params.expenseNumber as string,
          input.params.category as ExpenseCategory,
          input.params.amount as number,
          (input.params.currency as string) || state.contract.defaultCurrency,
          {
            description: input.params.description as string,
            receiptUrl: input.params.receiptUrl as string,
            vendor: input.params.vendor as string,
            projectId: input.params.projectId as string,
            projectName: input.params.projectName as string,
            departmentId: input.params.departmentId as string,
            departmentName: input.params.departmentName as string,
            createdBy: input.userId,
            createdByName: input.userName,
          }
        )
        state.currentExpense = newExpense
        updatedContext = newExpense
        summary = generateExpenseSummary(newExpense)
        writebackActions.push(prepareExpenseWriteback(newExpense))
        break
      }

      case 'update_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          updatedContext = {
            ...expenseCtx,
            ...input.params,
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
        }
        break

      case 'submit_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          if (expenseCtx.status !== 'draft') {
            return {
              success: false,
              message: 'Only draft expenses can be submitted',
              toolType: input.toolType,
              errors: ['Invalid expense status'],
            }
          }
          updatedContext = {
            ...expenseCtx,
            status: 'submitted',
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('expense', updatedContext.expenseId, 'submitted'))
        }
        break

      case 'approve_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          updatedContext = {
            ...expenseCtx,
            status: 'approved',
            approvedBy: input.userId,
            approvedByName: input.userName,
            approvedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('expense', updatedContext.expenseId, 'approved'))
        }
        break

      case 'reject_expense':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          updatedContext = {
            ...expenseCtx,
            status: 'rejected',
            updatedAt: new Date().toISOString(),
          } as ExpenseContext
          state.currentExpense = updatedContext
          summary = generateExpenseSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('expense', updatedContext.expenseId, 'rejected'))
        }
        break

      case 'create_budget': {
        const newBudget = createBudgetContext(
          input.params.name as string,
          input.params.totalAmount as number,
          (input.params.period as BudgetPeriod) || 'monthly',
          {
            departmentId: input.params.departmentId as string,
            departmentName: input.params.departmentName as string,
            projectId: input.params.projectId as string,
            projectName: input.params.projectName as string,
          }
        )
        state.currentBudget = newBudget
        updatedContext = newBudget
        summary = generateBudgetSummary(newBudget)
        writebackActions.push(prepareBudgetWriteback(newBudget))
        break
      }

      case 'update_budget':
        if (input.contextType === 'budget' && input.context) {
          const budgetCtx = input.context as BudgetContext
          updatedContext = {
            ...budgetCtx,
            ...input.params,
            remainingAmount: (input.params.totalAmount as number) ?? budgetCtx.totalAmount - budgetCtx.usedAmount,
            updatedAt: new Date().toISOString(),
          } as BudgetContext
          state.currentBudget = updatedContext
          summary = generateBudgetSummary(updatedContext)
        }
        break

      case 'check_budget':
        if (input.contextType === 'budget' && input.context) {
          const budgetCtx = input.context as BudgetContext
          const usagePercent = (budgetCtx.usedAmount / budgetCtx.totalAmount) * 100
          if (usagePercent >= 90) {
            warnings.push(`预算使用率已达 ${usagePercent.toFixed(1)}%，请注意控制`)
          } else if (usagePercent >= 75) {
            warnings.push(`预算使用率已达 ${usagePercent.toFixed(1)}%`)
          }
          updatedContext = budgetCtx
          summary = generateBudgetSummary(budgetCtx)
        }
        break

      case 'create_payment': {
        const newPayment = createPaymentContext(
          input.params.paymentNumber as string,
          input.params.amount as number,
          (input.params.currency as string) || state.contract.defaultCurrency,
          input.params.method as PaymentMethod,
          {
            invoiceId: input.params.invoiceId as string,
            invoiceNumber: input.params.invoiceNumber as string,
            payerId: input.params.payerId as string,
            payerName: input.params.payerName as string,
            payeeId: input.params.payeeId as string,
            payeeName: input.params.payeeName as string,
            description: input.params.description as string,
            createdBy: input.userId,
            createdByName: input.userName,
          }
        )
        state.currentPayment = newPayment
        updatedContext = newPayment
        summary = generatePaymentSummary(newPayment)
        writebackActions.push(preparePaymentWriteback(newPayment))
        break
      }

      case 'process_payment':
        if (input.contextType === 'payment' && input.context) {
          const paymentCtx = input.context as PaymentContext
          updatedContext = {
            ...paymentCtx,
            status: 'completed',
            transactionId: `TXN-${Date.now()}`,
            paymentDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as PaymentContext
          state.currentPayment = updatedContext
          summary = generatePaymentSummary(updatedContext)
          writebackActions.push(prepareStatusWriteback('payment', updatedContext.paymentId, 'completed'))
        }
        break

      case 'generate_summary':
        if (input.context) {
          switch (input.contextType) {
            case 'invoice':
              summary = generateInvoiceSummary(input.context as InvoiceContext)
              break
            case 'expense':
              summary = generateExpenseSummary(input.context as ExpenseContext)
              break
            case 'budget':
              summary = generateBudgetSummary(input.context as BudgetContext)
              break
            case 'payment':
              summary = generatePaymentSummary(input.context as PaymentContext)
              break
          }
        }
        break

      case 'fill_expense_form':
        if (input.contextType === 'expense' && input.context) {
          const expenseCtx = input.context as ExpenseContext
          writebackActions.push({
            actionId: generateFinanceWritebackId(),
            actionType: 'update_list',
            target: 'expense_form',
            data: {
              category: expenseCtx.category,
              amount: expenseCtx.amount,
              currency: expenseCtx.currency,
              description: expenseCtx.description,
              expenseDate: expenseCtx.expenseDate,
            },
          })
          summary = generateExpenseSummary(expenseCtx)
        }
        break
    }

    // Record execution
    const record: FinanceToolExecutionRecord = {
      recordId: generateFinanceRecordId(),
      toolId: tool.toolId,
      toolType: tool.toolType,
      timestamp: new Date().toISOString(),
      userId: input.userId,
      userName: input.userName,
      success: true,
      durationMs: Date.now() - startTime,
      params: input.params,
      result: updatedContext as unknown as Record<string, unknown>,
    }
    state.toolHistory.push(record)

    return {
      success: true,
      message: getSuccessMessage(tool.toolType),
      toolType: tool.toolType,
      updatedContext,
      summary,
      warnings: warnings.length > 0 ? warnings : undefined,
      writebackActions: writebackActions.length > 0 ? writebackActions : undefined,
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      message: errorMessage,
      toolType: input.toolType,
      errors: [errorMessage],
    }
  }
}

function getSuccessMessage(toolType: FinanceToolType): string {
  const messages: Record<FinanceToolType, string> = {
    create_invoice: '发票创建成功',
    update_invoice: '发票更新成功',
    submit_invoice: '发票已提交审批',
    approve_invoice: '发票审批通过',
    reject_invoice: '发票已拒绝',
    cancel_invoice: '发票已取消',
    query_invoice: '发票查询成功',
    create_expense: '费用创建成功',
    update_expense: '费用更新成功',
    submit_expense: '费用已提交审批',
    approve_expense: '费用审批通过',
    reject_expense: '费用已拒绝',
    query_expense: '费用查询成功',
    create_budget: '预算创建成功',
    update_budget: '预算更新成功',
    check_budget: '预算检查完成',
    query_budget: '预算查询成功',
    create_payment: '付款创建成功',
    process_payment: '付款处理成功',
    query_payment: '付款查询成功',
    generate_summary: '摘要生成成功',
    fill_expense_form: '表单填充成功',
  }
  return messages[toolType] || '操作成功'
}
