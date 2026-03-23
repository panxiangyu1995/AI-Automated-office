/**
 * Sales Pilot Integration Module Tests
 * Task 89: Story 50.2 - Sales Pilot Integration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type CustomerStatus,
  type CustomerPriority,
  type LeadStatus,
  type LeadSource,
  type OpportunityStatus,
  type FollowUpType,
  type FollowUpStatus,
  type SalesToolType,
  type CustomerContext,
  type CustomerContact,
  type LeadContext,
  type OpportunityContext,
  type FollowUpContext,
  type SalesTool,
  type SalesToolInput,
  type SalesToolOutput,
  type CustomerSummary,
  type SalesSummaryOptions,
  type SalesWritebackAction,
  type SalesPilotState,
  type SalesToolExecutionRecord,
  type SalesPilotContract,

  // ID Generation
  generateCustomerId,
  generateLeadId,
  generateOpportunityId,
  generateFollowUpId,
  generateContactId,
  generateToolId,
  generateSalesSummaryId,
  generateToolRecordId,
  generateSalesWritebackId,
  generateSalesAuditId,

  // Factory Functions
  createCustomerContext,
  createCustomerContact,
  createSalesTool,
  createSalesPilotContract,
  createSalesPilotState,

  // Tool Registration
  getDefaultSalesTools,
  registerTool,
  registerDefaultTools,
  getTool,
  getToolByType,

  // Permission and Validation
  checkToolPermission,
  checkCustomerStatus,
  checkLeadStatus,
  validateToolInput,

  // Tool Execution
  executeSalesTool,

  // Summary Generation
  generateCustomerSummary,
  generateLeadSummaryContext,
  generateOpportunitySummaryContext,
  generateFollowUpSummaryContext,

  // Writeback Integration
  createSalesWritebackAction,
  prepareCustomerSummaryWriteback,
  prepareFollowUpFormWriteback,
  prepareWorkbenchCardWriteback,

  // Audit Integration
  createSalesAuditEntry,
  addAuditEntryToState,

  // Serialization
  serializeCustomerContext,
  deserializeCustomerContext,
  serializeSalesTool,
  deserializeSalesTool,
  serializeCustomerSummary,
  deserializeCustomerSummary,
  serializeSalesPilotState,
  deserializeSalesPilotState,

  // Debug Formatting
  formatCustomerContext,
  formatSalesTool,
  formatCustomerSummary,
  formatToolExecutionRecord,
} from '@/features/session/runtime/salesPilot'

describe('Sales Pilot Integration', () => {
  describe('ID Generation', () => {
    it('should generate unique customer IDs', () => {
      const id1 = generateCustomerId()
      const id2 = generateCustomerId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^sales-\d+-[a-z0-9]+$/)
    })

    it('should generate unique lead IDs', () => {
      const id1 = generateLeadId()
      const id2 = generateLeadId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^lead-\d+-[a-z0-9]+$/)
    })

    it('should generate unique opportunity IDs', () => {
      const id1 = generateOpportunityId()
      const id2 = generateOpportunityId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^opp-\d+-[a-z0-9]+$/)
    })

    it('should generate unique follow-up IDs', () => {
      const id1 = generateFollowUpId()
      const id2 = generateFollowUpId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^sales-followup-\d+-[a-z0-9]+$/)
    })

    it('should generate unique tool IDs', () => {
      const id1 = generateToolId()
      const id2 = generateToolId()
      // Tool IDs now include random suffix for uniqueness
      expect(id1).toMatch(/^sales-tool-\d+-[a-z0-9]+$/)
      expect(id2).toMatch(/^sales-tool-\d+-[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should generate unique summary IDs', () => {
      const id1 = generateSalesSummaryId()
      const id2 = generateSalesSummaryId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^sales-summary-\d+-[a-z0-9]+$/)
    })

    it('should generate unique tool record IDs', () => {
      const id1 = generateToolRecordId()
      const id2 = generateToolRecordId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^sales-record-\d+-[a-z0-9]+$/)
    })

    it('should generate unique writeback IDs', () => {
      const id1 = generateSalesWritebackId()
      const id2 = generateSalesWritebackId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^sales-writeback-\d+-[a-z0-9]+$/)
    })
  })

  describe('Factory Functions', () => {
    describe('Customer Context', () => {
      it('should create customer context with defaults', () => {
        const context = createCustomerContext('测试公司')
        expect(context.name).toBe('测试公司')
        expect(context.status).toBe('new')
        expect(context.priority).toBe('normal')
        expect(context.contacts).toEqual([])
        expect(context.leads).toEqual([])
        expect(context.opportunities).toEqual([])
        expect(context.followUps).toEqual([])
        expect(context.tags).toEqual([])
      })

      it('should create customer context with options', () => {
        const context = createCustomerContext('测试公司', 'active', {
          priority: 'vip',
          industry: '科技',
          location: '北京',
          assignedTo: 'user-1',
          assignedToName: '张三',
        })
        expect(context.status).toBe('active')
        expect(context.priority).toBe('vip')
        expect(context.industry).toBe('科技')
        expect(context.location).toBe('北京')
        expect(context.assignedTo).toBe('user-1')
        expect(context.assignedToName).toBe('张三')
      })
    })

    describe('Customer Contact', () => {
      it('should create customer contact', () => {
        const contact = createCustomerContact('李四', {
          title: 'CEO',
          email: 'lisi@example.com',
          isPrimary: true,
        })
        expect(contact.name).toBe('李四')
        expect(contact.title).toBe('CEO')
        expect(contact.email).toBe('lisi@example.com')
        expect(contact.isPrimary).toBe(true)
      })
    })

    describe('Sales Tool', () => {
      it('should create create_customer tool', () => {
        const tool = createSalesTool('create_customer')
        expect(tool.toolType).toBe('create_customer')
        expect(tool.name).toBe('创建客户')
        expect(tool.requiredPermission).toBe('write')
        expect(tool.requiresConfirmation).toBe(false)
        expect(tool.isDestructive).toBe(false)
        expect(tool.riskLevel).toBe('low')
      })

      it('should create delete_customer tool with confirmation', () => {
        const tool = createSalesTool('delete_customer')
        expect(tool.name).toBe('删除客户')
        expect(tool.requiredPermission).toBe('delete')
        expect(tool.requiresConfirmation).toBe(true)
        expect(tool.isDestructive).toBe(true)
        expect(tool.riskLevel).toBe('high')
        expect(tool.confirmationMessage).toContain('删除')
      })

      it('should create convert_lead tool', () => {
        const tool = createSalesTool('convert_lead')
        expect(tool.name).toBe('转化线索')
        expect(tool.requiresConfirmation).toBe(true)
        expect(tool.riskLevel).toBe('medium')
      })
    })

    describe('Sales Pilot Contract', () => {
      it('should create contract with defaults', () => {
        const contract = createSalesPilotContract()
        expect(contract.allowedCustomerStatuses).toContain('new')
        expect(contract.allowedCustomerStatuses).toContain('active')
        expect(contract.requiredPermission).toBe('read')
        expect(contract.enableSummaryGeneration).toBe(true)
        expect(contract.enableFollowUpFormFill).toBe(true)
        expect(contract.auditLevel).toBe('basic')
      })

      it('should create contract with options', () => {
        const contract = createSalesPilotContract({
          requiredPermission: 'write',
          requireConfirmationForActions: ['delete_customer', 'convert_lead'],
          auditLevel: 'full',
        })
        expect(contract.requiredPermission).toBe('write')
        expect(contract.requireConfirmationForActions).toEqual(['delete_customer', 'convert_lead'])
        expect(contract.auditLevel).toBe('full')
      })
    })

    describe('Sales Pilot State', () => {
      it('should create empty state', () => {
        const state = createSalesPilotState()
        expect(state.currentCustomer).toBeNull()
        expect(state.currentLead).toBeNull()
        expect(state.currentOpportunity).toBeNull()
        expect(state.currentFollowUp).toBeNull()
        expect(state.availableTools.size).toBe(0)
        expect(state.toolHistory).toEqual([])
        expect(state.pendingConfirmation).toBeNull()
        expect(state.auditEntries).toEqual([])
      })
    })
  })

  describe('Tool Registration', () => {
    let state: SalesPilotState

    beforeEach(() => {
      state = createSalesPilotState()
    })

    describe('Default Tools', () => {
      it('should get all default sales tools', () => {
        const tools = getDefaultSalesTools()
        expect(tools).toHaveLength(16)
        expect(tools.map(t => t.toolType)).toContain('create_customer')
        expect(tools.map(t => t.toolType)).toContain('update_customer')
        expect(tools.map(t => t.toolType)).toContain('delete_customer')
        expect(tools.map(t => t.toolType)).toContain('create_lead')
        expect(tools.map(t => t.toolType)).toContain('convert_lead')
        expect(tools.map(t => t.toolType)).toContain('create_opportunity')
        expect(tools.map(t => t.toolType)).toContain('create_followup')
        expect(tools.map(t => t.toolType)).toContain('generate_summary')
        expect(tools.map(t => t.toolType)).toContain('fill_followup_form')
      })
    })

    describe('Register Tool', () => {
      it('should register tool in state', () => {
        const tool = createSalesTool('create_customer')
        registerTool(state, tool)
        expect(state.availableTools.size).toBe(1)
        expect(state.availableTools.get(tool.toolId)).toBe(tool)
      })

      it('should register multiple tools', () => {
        const tool1 = createSalesTool('create_customer')
        const tool2 = createSalesTool('create_lead')
        registerTool(state, tool1)
        registerTool(state, tool2)
        expect(state.availableTools.size).toBe(2)
      })
    })

    describe('Register Default Tools', () => {
      it('should register all default tools', () => {
        registerDefaultTools(state)
        expect(state.availableTools.size).toBe(16)
      })
    })

    describe('Get Tool', () => {
      it('should get tool by ID', () => {
        const tool = createSalesTool('create_customer')
        registerTool(state, tool)
        const found = getTool(state, tool.toolId)
        expect(found).toBe(tool)
      })

      it('should return undefined for unknown ID', () => {
        const found = getTool(state, 'unknown')
        expect(found).toBeUndefined()
      })
    })

    describe('Get Tool By Type', () => {
      it('should get tool by type', () => {
        registerDefaultTools(state)
        const tool = getToolByType(state, 'create_customer')
        expect(tool?.toolType).toBe('create_customer')
      })

      it('should return undefined for unknown type', () => {
        const tool = getToolByType(state, 'nonexistent' as SalesToolType)
        expect(tool).toBeUndefined()
      })
    })
  })

  describe('Permission and Validation', () => {
    describe('Check Tool Permission', () => {
      it('should allow with sufficient permission', () => {
        const tool = createSalesTool('create_customer', { requiredPermission: 'write' })
        const result = checkToolPermission(tool, 'write')
        expect(result.allowed).toBe(true)
      })

      it('should allow with higher permission', () => {
        const tool = createSalesTool('create_customer', { requiredPermission: 'write' })
        const result = checkToolPermission(tool, 'admin')
        expect(result.allowed).toBe(true)
      })

      it('should deny with insufficient permission', () => {
        const tool = createSalesTool('delete_customer', { requiredPermission: 'delete' })
        const result = checkToolPermission(tool, 'write')
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe('Insufficient permission')
      })
    })

    describe('Check Customer Status', () => {
      it('should allow allowed customer statuses', () => {
        const contract = createSalesPilotContract()
        expect(checkCustomerStatus(contract, 'new')).toBe(true)
        expect(checkCustomerStatus(contract, 'active')).toBe(true)
      })
    })

    describe('Check Lead Status', () => {
      it('should allow allowed lead statuses', () => {
        const contract = createSalesPilotContract()
        expect(checkLeadStatus(contract, 'new')).toBe(true)
        expect(checkLeadStatus(contract, 'won')).toBe(true)
      })
    })

    describe('Validate Tool Input', () => {
      let contract: SalesPilotContract
      let state: SalesPilotState

      beforeEach(() => {
        contract = createSalesPilotContract()
        state = createSalesPilotState()
        registerDefaultTools(state)
      })

      it('should validate create_customer tool input', () => {
        const tool = getToolByType(state, 'create_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: createCustomerContext('测试公司'),
          params: { name: '测试公司' },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should fail for create_customer without name', () => {
        const tool = getToolByType(state, 'create_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: createCustomerContext('测试公司'),
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Customer name is required')
      })

      it('should fail for convert_lead on won lead', () => {
        const leadContext: LeadContext = {
          leadId: 'lead-1',
          title: '测试线索',
          status: 'won',
          source: 'website',
          contacts: [],
          followUps: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const tool = getToolByType(state, 'convert_lead')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'lead',
          context: leadContext,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Cannot convert a won or lost lead')
      })

      it('should fail for create_followup without type', () => {
        const tool = getToolByType(state, 'create_followup')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'followup',
          context: {} as FollowUpContext,
          params: { subject: '测试跟进' },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Follow-up type is required')
      })

      it('should fail for complete_followup on already completed', () => {
        const followUpContext: FollowUpContext = {
          followUpId: 'followup-1',
          type: 'call',
          subject: '测试跟进',
          status: 'completed',
          scheduledAt: new Date().toISOString(),
          contacts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: 'user-1',
          assignedToName: '张三',
        }
        const tool = getToolByType(state, 'complete_followup')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'followup',
          context: followUpContext,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Follow-up is already completed')
      })
    })
  })

  describe('Tool Execution', () => {
    let contract: SalesPilotContract
    let state: SalesPilotState

    beforeEach(() => {
      contract = createSalesPilotContract()
      state = createSalesPilotState()
      registerDefaultTools(state)
    })

    describe('Create Customer Tool', () => {
      it('should create customer', () => {
        const tool = getToolByType(state, 'create_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: {} as CustomerContext,
          params: {
            name: '测试公司',
            industry: '科技',
            location: '北京',
          },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          skipConfirmation: true,
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('客户已创建')
        expect(output.updatedContext).toBeDefined()
        expect((output.updatedContext as CustomerContext).name).toBe('测试公司')
        expect((output.updatedContext as CustomerContext).industry).toBe('科技')
      })
    })

    describe('Update Customer Tool', () => {
      it('should update customer', () => {
        const customer = createCustomerContext('测试公司', 'new', { industry: '科技' })
        const tool = getToolByType(state, 'update_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: customer,
          params: { industry: '金融', status: 'active' },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('客户已更新')
        expect((output.updatedContext as CustomerContext).industry).toBe('金融')
        expect((output.updatedContext as CustomerContext).status).toBe('active')
      })
    })

    describe('Delete Customer Tool', () => {
      it('should require confirmation', () => {
        const customer = createCustomerContext('测试公司')
        const tool = getToolByType(state, 'delete_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: customer,
          params: {},
          userPermission: 'delete',
          userId: 'user-1',
          userName: '张三',
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(false)
        expect(output.requiresConfirmation).toBe(true)
        expect(output.confirmationMessage).toContain('删除')
      })

      it('should soft delete after confirmation', () => {
        const customer = createCustomerContext('测试公司')
        const tool = getToolByType(state, 'delete_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: customer,
          params: {},
          userPermission: 'delete',
          userId: 'user-1',
          userName: '张三',
          skipConfirmation: true,
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect((output.updatedContext as CustomerContext).status).toBe('churned')
        expect(output.warnings).toContain('Customer marked as churned')
      })
    })

    describe('Create Lead Tool', () => {
      it('should create lead', () => {
        const tool = getToolByType(state, 'create_lead')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'lead',
          context: {} as LeadContext,
          params: {
            title: '新销售线索',
            source: 'website',
            estimatedValue: 50000,
          },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('线索已创建')
        expect((output.updatedContext as LeadContext).title).toBe('新销售线索')
        expect((output.updatedContext as LeadContext).status).toBe('new')
      })
    })

    describe('Convert Lead Tool', () => {
      it('should convert lead to opportunity', () => {
        const leadContext: LeadContext = {
          leadId: 'lead-1',
          title: '测试线索',
          customerId: 'customer-1',
          customerName: '测试公司',
          status: 'qualified',
          source: 'website',
          estimatedValue: 100000,
          probability: 50,
          contacts: [],
          followUps: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const tool = getToolByType(state, 'convert_lead')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'lead',
          context: leadContext,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          skipConfirmation: true,
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('线索已转化为商机')
        const opp = output.updatedContext as OpportunityContext
        expect(opp.name).toBe('测试线索')
        expect(opp.status).toBe('prospecting')
        expect(opp.value).toBe(100000)
      })
    })

    describe('Create Opportunity Tool', () => {
      it('should create opportunity', () => {
        const tool = getToolByType(state, 'create_opportunity')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'opportunity',
          context: {} as OpportunityContext,
          params: {
            name: '新商机',
            customerId: 'customer-1',
            customerName: '测试公司',
            value: 200000,
            probability: 30,
          },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('商机已创建')
        expect((output.updatedContext as OpportunityContext).name).toBe('新商机')
        expect((output.updatedContext as OpportunityContext).value).toBe(200000)
      })
    })

    describe('Create Follow-up Tool', () => {
      it('should create follow-up', () => {
        const tool = getToolByType(state, 'create_followup')!
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'followup',
          context: {} as FollowUpContext,
          params: {
            type: 'call',
            subject: '电话跟进',
            scheduledAt: tomorrow.toISOString(),
            customerId: 'customer-1',
            customerName: '测试公司',
          },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('跟进已创建')
        const followUp = output.updatedContext as FollowUpContext
        expect(followUp.type).toBe('call')
        expect(followUp.subject).toBe('电话跟进')
        expect(followUp.status).toBe('scheduled')
      })
    })

    describe('Complete Follow-up Tool', () => {
      it('should complete follow-up', () => {
        const followUpContext: FollowUpContext = {
          followUpId: 'followup-1',
          type: 'call',
          subject: '电话跟进',
          status: 'scheduled',
          scheduledAt: new Date().toISOString(),
          contacts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: 'user-1',
          assignedToName: '张三',
        }
        const tool = getToolByType(state, 'complete_followup')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'followup',
          context: followUpContext,
          params: {
            duration: 30,
            outcome: '客户有兴趣，需要发送报价',
            nextSteps: '发送报价单',
          },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('跟进已完成')
        const completed = output.updatedContext as FollowUpContext
        expect(completed.status).toBe('completed')
        expect(completed.completedAt).toBeDefined()
        expect(completed.duration).toBe(30)
        expect(completed.outcome).toBe('客户有兴趣，需要发送报价')
      })
    })

    describe('Generate Summary Tool', () => {
      it('should generate customer summary', () => {
        const customer = createCustomerContext('测试公司', 'active', {
          industry: '科技',
          priority: 'high',
        })
        const tool = getToolByType(state, 'generate_summary')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: customer,
          params: {},
          userPermission: 'read',
          userId: 'user-1',
          userName: '张三',
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('摘要已生成')
        expect(output.summary).toBeDefined()
        expect((output.summary as CustomerSummary).customerName).toBe('测试公司')
      })
    })

    describe('Dry Run', () => {
      it('should support dry run mode', () => {
        const tool = getToolByType(state, 'create_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: {} as CustomerContext,
          params: { name: '测试公司' },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          dryRun: true,
        }

        const output = executeSalesTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.warnings).toContain('Dry run - no actual changes made')
        expect(output.updatedContext).toBeUndefined()
      })
    })

    describe('Tool History Recording', () => {
      it('should record tool execution in history', () => {
        const tool = getToolByType(state, 'create_customer')!
        const input: SalesToolInput = {
          toolId: tool.toolId,
          contextType: 'customer',
          context: {} as CustomerContext,
          params: { name: '测试公司' },
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          skipConfirmation: true,
        }

        executeSalesTool(input, tool, contract, state)

        expect(state.toolHistory).toHaveLength(1)
        expect(state.toolHistory[0].toolType).toBe('create_customer')
        expect(state.toolHistory[0].success).toBe(true)
      })
    })
  })

  describe('Summary Generation', () => {
    it('should generate brief customer summary', () => {
      const customer = createCustomerContext('测试公司', 'active', {
        industry: '科技',
        priority: 'high',
      })
      customer.opportunities.push({
        opportunityId: 'opp-1',
        name: '商机1',
        status: 'proposal',
        value: 100000,
        probability: 50,
        createdAt: new Date().toISOString(),
      })

      const summary = generateCustomerSummary(customer, { summaryType: 'brief' })

      expect(summary.summaryType).toBeUndefined() // brief doesn't set type
      expect(summary.customerName).toBe('测试公司')
      expect(summary.status).toBe('active')
      expect(summary.priority).toBe('high')
      expect(summary.industry).toBe('科技')
      expect(summary.opportunityCount).toBe(1)
      expect(summary.activeOpportunityValue).toBe(100000)
    })

    it('should generate detailed customer summary with insights', () => {
      const customer = createCustomerContext('测试公司', 'active', {
        priority: 'vip',
      })
      // Add multiple opportunities
      for (let i = 0; i < 4; i++) {
        customer.opportunities.push({
          opportunityId: `opp-${i}`,
          name: `商机${i}`,
          status: 'proposal',
          value: 50000,
          probability: 50,
          createdAt: new Date().toISOString(),
        })
      }
      // Add overdue follow-up
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      customer.followUps.push({
        followUpId: 'followup-1',
        type: 'call',
        subject: '过期跟进',
        status: 'scheduled',
        scheduledAt: yesterday.toISOString(),
      })

      const summary = generateCustomerSummary(customer, {
        summaryType: 'detailed',
        includeInsights: true,
      })

      expect(summary.keyInsights).toContain('VIP客户，需要重点维护')
      expect(summary.keyInsights).toContain('有 4 个活跃商机')
      expect(summary.keyInsights).toContain('有逾期未完成的跟进任务')
    })

    it('should calculate total revenue from won opportunities', () => {
      const customer = createCustomerContext('测试公司')
      customer.opportunities.push({
        opportunityId: 'opp-1',
        name: '商机1',
        status: 'closed_won',
        value: 100000,
        probability: 100,
        createdAt: new Date().toISOString(),
      })
      customer.opportunities.push({
        opportunityId: 'opp-2',
        name: '商机2',
        status: 'closed_won',
        value: 50000,
        probability: 100,
        createdAt: new Date().toISOString(),
      })

      const summary = generateCustomerSummary(customer)

      expect(summary.totalRevenue).toBe(150000)
    })

    it('should generate lead summary', () => {
      const lead: LeadContext = {
        leadId: 'lead-1',
        title: '测试线索',
        customerId: 'customer-1',
        customerName: '测试公司',
        status: 'qualified',
        source: 'website',
        estimatedValue: 80000,
        probability: 60,
        contacts: [{ contactId: 'c1', name: '李四', isPrimary: true }],
        followUps: [],
        tags: ['重要'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const summary = generateLeadSummaryContext(lead)

      expect(summary.leadId).toBe('lead-1')
      expect(summary.title).toBe('测试线索')
      expect(summary.status).toBe('qualified')
      expect(summary.estimatedValue).toBe(80000)
      expect(summary.contactCount).toBe(1)
    })

    it('should generate opportunity summary with days to close', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const opportunity: OpportunityContext = {
        opportunityId: 'opp-1',
        name: '测试商机',
        customerId: 'customer-1',
        customerName: '测试公司',
        status: 'negotiation',
        value: 200000,
        probability: 70,
        expectedCloseDate: futureDate.toISOString(),
        contacts: [],
        followUps: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const summary = generateOpportunitySummaryContext(opportunity)

      expect(summary.opportunityId).toBe('opp-1')
      expect(summary.status).toBe('negotiation')
      expect(summary.value).toBe(200000)
      expect(summary.daysToClose).toBeGreaterThan(28)
      expect(summary.daysToClose).toBeLessThan(32)
    })

    it('should generate follow-up summary with overdue detection', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const followUp: FollowUpContext = {
        followUpId: 'followup-1',
        type: 'call',
        subject: '过期跟进',
        status: 'scheduled',
        scheduledAt: yesterday.toISOString(),
        customerName: '测试公司',
        contacts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: 'user-1',
        assignedToName: '张三',
      }

      const summary = generateFollowUpSummaryContext(followUp)

      expect(summary.followUpId).toBe('followup-1')
      expect(summary.type).toBe('call')
      expect(summary.isOverdue).toBe(true)
    })
  })

  describe('Writeback Integration', () => {
    describe('Create Writeback Action', () => {
      it('should create writeback action', () => {
        const action = createSalesWritebackAction(
          'session-1',
          'customer-1',
          'customer',
          'summary',
          { name: '测试公司' }
        )

        expect(action.sessionId).toBe('session-1')
        expect(action.contextId).toBe('customer-1')
        expect(action.contextType).toBe('customer')
        expect(action.writebackType).toBe('summary')
        expect(action.content).toEqual({ name: '测试公司' })
      })
    })

    describe('Prepare Customer Summary Writeback', () => {
      it('should prepare customer summary for writeback', () => {
        const summary: CustomerSummary = {
          summaryId: 'summary-1',
          customerId: 'customer-1',
          customerName: '测试公司',
          status: 'active',
          priority: 'high',
          leadCount: 2,
          opportunityCount: 3,
          activeOpportunityValue: 100000,
          totalRevenue: 200000,
          followUpCount: 5,
          createdAt: new Date().toISOString(),
          tags: ['重要'],
          keyInsights: ['VIP客户'],
        }

        const writeback = prepareCustomerSummaryWriteback(summary)

        expect(writeback.customerName).toBe('测试公司')
        expect(writeback.opportunityCount).toBe(3)
        expect(writeback.activeValue).toBe(100000)
        expect(writeback.totalRevenue).toBe(200000)
      })
    })

    describe('Prepare Follow-up Form Writeback', () => {
      it('should prepare follow-up form for writeback', () => {
        const followUp: FollowUpContext = {
          followUpId: 'followup-1',
          type: 'call',
          subject: '电话跟进',
          status: 'scheduled',
          scheduledAt: new Date().toISOString(),
          customerId: 'customer-1',
          customerName: '测试公司',
          contacts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignedTo: 'user-1',
          assignedToName: '张三',
        }

        const writeback = prepareFollowUpFormWriteback(followUp)

        expect(writeback.followUpId).toBe('followup-1')
        expect(writeback.type).toBe('call')
        expect(writeback.customerName).toBe('测试公司')
      })
    })

    describe('Prepare Workbench Card Writeback', () => {
      it('should prepare customer card writeback', () => {
        const customer = createCustomerContext('测试公司', 'active', {
          industry: '科技',
        })
        customer.opportunities.push({
          opportunityId: 'opp-1',
          name: '商机1',
          status: 'proposal',
          value: 50000,
          probability: 50,
          createdAt: new Date().toISOString(),
        })

        const writeback = prepareWorkbenchCardWriteback(customer, 'metric')

        expect(writeback.title).toBe('测试公司')
        expect(writeback.subtitle).toBe('科技')
        expect(writeback.metrics).toBeDefined()
      })

      it('should prepare lead card writeback', () => {
        const lead: LeadContext = {
          leadId: 'lead-1',
          title: '测试线索',
          status: 'qualified',
          source: 'website',
          estimatedValue: 80000,
          probability: 60,
          contacts: [],
          followUps: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const writeback = prepareWorkbenchCardWriteback(lead, 'list')

        expect(writeback.title).toBe('测试线索')
        expect(writeback.metrics).toBeDefined()
      })
    })
  })

  describe('Audit Integration', () => {
    it('should create audit entry', () => {
      const entry = createSalesAuditEntry(
        'session-1',
        'customer-1',
        'customer',
        'create',
        '张三',
        'user-1',
        true
      )

      expect(entry.sessionId).toBe('session-1')
      expect(entry.targetId).toBe('customer-1')
      expect(entry.targetType).toBe('customer')
      expect(entry.operation).toBe('create')
      expect(entry.actor).toBe('张三')
      expect(entry.success).toBe(true)
    })

    it('should add audit entry to state', () => {
      const state = createSalesPilotState()
      const entry = createSalesAuditEntry(
        'session-1',
        'customer-1',
        'customer',
        'update',
        '张三',
        'user-1',
        true
      )

      addAuditEntryToState(state, entry)

      expect(state.auditEntries).toHaveLength(1)
      expect(state.auditEntries[0]).toBe(entry)
    })
  })

  describe('Serialization', () => {
    describe('Customer Context', () => {
      it('should serialize and deserialize', () => {
        const context = createCustomerContext('测试公司', 'active', {
          industry: '科技',
        })
        const json = serializeCustomerContext(context)
        const restored = deserializeCustomerContext(json)
        expect(restored).toEqual(context)
      })
    })

    describe('Sales Tool', () => {
      it('should serialize and deserialize', () => {
        const tool = createSalesTool('create_customer')
        const json = serializeSalesTool(tool)
        const restored = deserializeSalesTool(json)
        expect(restored).toEqual(tool)
      })
    })

    describe('Customer Summary', () => {
      it('should serialize and deserialize', () => {
        const customer = createCustomerContext('测试公司')
        const summary = generateCustomerSummary(customer)
        const json = serializeCustomerSummary(summary)
        const restored = deserializeCustomerSummary(json)
        expect(restored).toEqual(summary)
      })
    })

    describe('Sales Pilot State', () => {
      it('should serialize and deserialize', () => {
        const state = createSalesPilotState()
        const customer = createCustomerContext('测试公司')
        state.currentCustomer = customer
        registerDefaultTools(state)

        const json = serializeSalesPilotState(state)
        const restored = deserializeSalesPilotState(json)

        expect(restored.currentCustomer).toEqual(customer)
        expect(restored.availableTools.size).toBe(16)
      })
    })
  })

  describe('Debug Formatting', () => {
    describe('Format Customer Context', () => {
      it('should format context', () => {
        const customer = createCustomerContext('测试公司', 'active', {
          industry: '科技',
          priority: 'vip',
          assignedToName: '张三',
        })
        const formatted = formatCustomerContext(customer)
        expect(formatted).toContain('测试公司')
        expect(formatted).toContain('活跃')
        expect(formatted).toContain('VIP')
        expect(formatted).toContain('科技')
        expect(formatted).toContain('张三')
      })
    })

    describe('Format Sales Tool', () => {
      it('should format low risk tool', () => {
        const tool = createSalesTool('create_customer')
        const formatted = formatSalesTool(tool)
        expect(formatted).toBe('创建客户')
      })

      it('should format medium risk tool', () => {
        const tool = createSalesTool('convert_lead')
        const formatted = formatSalesTool(tool)
        expect(formatted).toContain('转化线索')
        expect(formatted).toContain('[中风险]')
        expect(formatted).toContain('[需确认]')
      })

      it('should format high risk tool', () => {
        const tool = createSalesTool('delete_customer')
        const formatted = formatSalesTool(tool)
        expect(formatted).toContain('[高风险]')
      })
    })

    describe('Format Customer Summary', () => {
      it('should format summary', () => {
        const customer = createCustomerContext('测试公司', 'active', {
          priority: 'vip',
        })
        customer.opportunities.push({
          opportunityId: 'opp-1',
          name: '商机',
          status: 'proposal',
          value: 50000,
          probability: 50,
          createdAt: new Date().toISOString(),
        })
        const summary = generateCustomerSummary(customer, {
          summaryType: 'full',
          includeInsights: true,
        })
        const formatted = formatCustomerSummary(summary)
        expect(formatted).toContain('客户摘要')
        expect(formatted).toContain('测试公司')
        expect(formatted).toContain('VIP客户')
      })
    })

    describe('Format Tool Execution Record', () => {
      it('should format successful record', () => {
        const record: SalesToolExecutionRecord = {
          recordId: 'record-1',
          toolId: 'tool-1',
          toolType: 'create_customer',
          timestamp: new Date().toISOString(),
          userId: 'user-1',
          userName: '张三',
          success: true,
          durationMs: 42,
          params: {},
        }
        const formatted = formatToolExecutionRecord(record)
        expect(formatted).toContain('✓')
        expect(formatted).toContain('create_customer')
        expect(formatted).toContain('张三')
        expect(formatted).toContain('42ms')
      })

      it('should format failed record', () => {
        const record: SalesToolExecutionRecord = {
          recordId: 'record-1',
          toolId: 'tool-1',
          toolType: 'delete_customer',
          timestamp: new Date().toISOString(),
          userId: 'user-1',
          userName: '张三',
          success: false,
          durationMs: 15,
          params: {},
          errors: ['Permission denied'],
        }
        const formatted = formatToolExecutionRecord(record)
        expect(formatted).toContain('✗')
      })
    })
  })
})
