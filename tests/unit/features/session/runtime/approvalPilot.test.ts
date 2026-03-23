/**
 * Approval Pilot Integration Module Tests
 * Task 88: Story 50.1 - Approval Pilot Integration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Types
  type ApprovalType,
  type ApprovalStatus,
  type ApprovalPriority,
  type ApprovalDecision,
  type ApprovalToolType,
  type ApprovalContext,
  type ApprovalHistoryEntry,
  type ApprovalAttachment,
  type ApprovalTool,
  type ApprovalToolInput,
  type ApprovalToolOutput,
  type ApprovalSummary,
  type ApprovalKeyField,
  type ApprovalSummaryOptions,
  type ApprovalWritebackAction,
  type ApprovalPilotState,
  type ApprovalToolExecutionRecord,
  type ApprovalPilotContract,

  // ID Generation
  generateApprovalId,
  generateToolId,
  generateSummaryId,
  generateHistoryEntryId,
  generateToolRecordId,
  generateWritebackId,

  // Factory Functions
  createApprovalContext,
  createApprovalTool,
  createApprovalHistoryEntry,
  createApprovalKeyField,
  createApprovalPilotContract,
  createApprovalPilotState,

  // Tool Registration
  getDefaultApprovalTools,
  registerTool,
  registerDefaultTools,
  getTool,
  getToolByType,

  // Permission and Validation
  checkToolPermission,
  checkApprovalType,
  validateToolInput,

  // Tool Execution
  executeApprovalTool,

  // Summary Generation
  generateApprovalSummary,

  // Writeback Integration
  createApprovalWritebackAction,
  prepareSummaryWriteback,
  prepareStatusWriteback,
  prepareFormWriteback,
  prepareHistoryWriteback,

  // Audit Integration
  createApprovalAuditEntry,
  addAuditEntryToState,

  // Serialization
  serializeApprovalContext,
  deserializeApprovalContext,
  serializeApprovalTool,
  deserializeApprovalTool,
  serializeApprovalSummary,
  deserializeApprovalSummary,
  serializeApprovalPilotState,
  deserializeApprovalPilotState,

  // Debug Formatting
  formatApprovalContext,
  formatApprovalTool,
  formatApprovalSummary,
  formatToolExecutionRecord,
} from '@/features/session/runtime/approvalPilot'

describe('Approval Pilot Integration', () => {
  describe('ID Generation', () => {
    it('should generate unique approval IDs', () => {
      const id1 = generateApprovalId()
      const id2 = generateApprovalId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^approval-\d+-\d+$/)
    })

    it('should generate unique tool IDs', () => {
      const id1 = generateToolId()
      const id2 = generateToolId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^approval-tool-\d+$/)
    })

    it('should generate unique summary IDs', () => {
      const id1 = generateSummaryId()
      const id2 = generateSummaryId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^approval-summary-\d+-\d+$/)
    })

    it('should generate unique history entry IDs', () => {
      const id1 = generateHistoryEntryId()
      const id2 = generateHistoryEntryId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^approval-history-\d+-\d+$/)
    })

    it('should generate unique tool record IDs', () => {
      const id1 = generateToolRecordId()
      const id2 = generateToolRecordId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^approval-record-\d+-\d+$/)
    })

    it('should generate unique writeback IDs', () => {
      const id1 = generateWritebackId()
      const id2 = generateWritebackId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^approval-writeback-\d+-\d+$/)
    })
  })

  describe('Factory Functions', () => {
    describe('Approval Context', () => {
      it('should create approval context with required fields', () => {
        const context = createApprovalContext(
          'leave',
          '请假申请',
          'user-1',
          '张三',
          '技术部'
        )
        expect(context.approvalType).toBe('leave')
        expect(context.title).toBe('请假申请')
        expect(context.applicantId).toBe('user-1')
        expect(context.applicantName).toBe('张三')
        expect(context.department).toBe('技术部')
        expect(context.status).toBe('draft')
        expect(context.priority).toBe('normal')
        expect(context.history).toEqual([])
        expect(context.formData).toEqual({})
        expect(context.attachments).toEqual([])
      })

      it('should create approval context with form data', () => {
        const formData = {
          startDate: '2026-03-24',
          endDate: '2026-03-25',
          reason: '个人事务',
        }
        const context = createApprovalContext(
          'leave',
          '请假申请',
          'user-1',
          '张三',
          '技术部',
          formData
        )
        expect(context.formData).toEqual(formData)
      })

      it('should create approval context with options', () => {
        const context = createApprovalContext(
          'expense',
          '报销申请',
          'user-1',
          '张三',
          '技术部',
          {},
          { priority: 'urgent' }
        )
        expect(context.priority).toBe('urgent')
      })
    })

    describe('Approval Tool', () => {
      it('should create approval tool with default values', () => {
        const tool = createApprovalTool('approve')
        expect(tool.toolType).toBe('approve')
        expect(tool.name).toBe('通过审批')
        expect(tool.requiredPermission).toBe('write')
        expect(tool.requiresConfirmation).toBe(true)
        expect(tool.isDestructive).toBe(false)
        expect(tool.riskLevel).toBe('medium')
      })

      it('should create approval tool with custom values', () => {
        const tool = createApprovalTool('reject', {
          name: '拒绝',
          description: '拒绝审批申请',
          requiredPermission: 'admin',
          confirmationMessage: '确认拒绝此审批？',
        })
        expect(tool.name).toBe('拒绝')
        expect(tool.description).toBe('拒绝审批申请')
        expect(tool.requiredPermission).toBe('admin')
        expect(tool.confirmationMessage).toBe('确认拒绝此审批？')
        expect(tool.isDestructive).toBe(true)
        expect(tool.riskLevel).toBe('high')
      })

      it('should create low-risk tools correctly', () => {
        const submitTool = createApprovalTool('submit')
        expect(submitTool.riskLevel).toBe('low')
        expect(submitTool.isDestructive).toBe(false)

        const queryTool = createApprovalTool('query')
        expect(queryTool.riskLevel).toBe('low')
      })
    })

    describe('Approval History Entry', () => {
      it('should create history entry', () => {
        const entry = createApprovalHistoryEntry(
          'submit',
          'user-1',
          '张三',
          '申请人'
        )
        expect(entry.action).toBe('submit')
        expect(entry.actorId).toBe('user-1')
        expect(entry.actorName).toBe('张三')
        expect(entry.actorRole).toBe('申请人')
        expect(entry.timestamp).toBeDefined()
      })

      it('should create history entry with comment', () => {
        const entry = createApprovalHistoryEntry(
          'approve',
          'user-2',
          '李四',
          '审批人',
          { comment: '同意' }
        )
        expect(entry.comment).toBe('同意')
      })
    })

    describe('Approval Key Field', () => {
      it('should create key field', () => {
        const field = createApprovalKeyField('金额', 1000, 'money', true)
        expect(field.label).toBe('金额')
        expect(field.value).toBe(1000)
        expect(field.type).toBe('money')
        expect(field.highlight).toBe(true)
      })

      it('should create key field with defaults', () => {
        const field = createApprovalKeyField('标题', '测试')
        expect(field.type).toBe('text')
        expect(field.highlight).toBe(false)
      })
    })

    describe('Approval Pilot Contract', () => {
      it('should create contract with defaults', () => {
        const contract = createApprovalPilotContract()
        expect(contract.allowedApprovalTypes).toContain('leave')
        expect(contract.allowedApprovalTypes).toContain('expense')
        expect(contract.requiredPermission).toBe('read')
        expect(contract.enableSummaryGeneration).toBe(true)
        expect(contract.enableStructuredContentFill).toBe(true)
        expect(contract.auditLevel).toBe('basic')
      })

      it('should create contract with options', () => {
        const contract = createApprovalPilotContract({
          allowedApprovalTypes: ['leave', 'expense'],
          requiredPermission: 'write',
          requireConfirmationForActions: ['approve', 'reject'],
          auditLevel: 'full',
        })
        expect(contract.allowedApprovalTypes).toEqual(['leave', 'expense'])
        expect(contract.requiredPermission).toBe('write')
        expect(contract.requireConfirmationForActions).toEqual(['approve', 'reject'])
        expect(contract.auditLevel).toBe('full')
      })
    })

    describe('Approval Pilot State', () => {
      it('should create empty state', () => {
        const state = createApprovalPilotState()
        expect(state.currentContext).toBeNull()
        expect(state.availableTools.size).toBe(0)
        expect(state.toolHistory).toEqual([])
        expect(state.pendingConfirmation).toBeNull()
        expect(state.auditEntries).toEqual([])
      })
    })
  })

  describe('Tool Registration', () => {
    let state: ApprovalPilotState

    beforeEach(() => {
      state = createApprovalPilotState()
    })

    describe('Default Tools', () => {
      it('should get all default approval tools', () => {
        const tools = getDefaultApprovalTools()
        expect(tools).toHaveLength(9)
        expect(tools.map(t => t.toolType)).toContain('submit')
        expect(tools.map(t => t.toolType)).toContain('approve')
        expect(tools.map(t => t.toolType)).toContain('reject')
        expect(tools.map(t => t.toolType)).toContain('return')
        expect(tools.map(t => t.toolType)).toContain('transfer')
        expect(tools.map(t => t.toolType)).toContain('withdraw')
        expect(tools.map(t => t.toolType)).toContain('comment')
        expect(tools.map(t => t.toolType)).toContain('query')
        expect(tools.map(t => t.toolType)).toContain('summary')
      })
    })

    describe('Register Tool', () => {
      it('should register tool in state', () => {
        const tool = createApprovalTool('approve')
        registerTool(state, tool)
        expect(state.availableTools.size).toBe(1)
        expect(state.availableTools.get(tool.toolId)).toBe(tool)
      })

      it('should register multiple tools', () => {
        const tool1 = createApprovalTool('approve')
        const tool2 = createApprovalTool('reject')
        registerTool(state, tool1)
        registerTool(state, tool2)
        expect(state.availableTools.size).toBe(2)
      })
    })

    describe('Register Default Tools', () => {
      it('should register all default tools', () => {
        registerDefaultTools(state)
        expect(state.availableTools.size).toBe(9)
      })
    })

    describe('Get Tool', () => {
      it('should get tool by ID', () => {
        const tool = createApprovalTool('approve')
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
        const tool = getToolByType(state, 'approve')
        expect(tool?.toolType).toBe('approve')
      })

      it('should return undefined for unknown type', () => {
        const tool = getToolByType(state, 'nonexistent' as ApprovalToolType)
        expect(tool).toBeUndefined()
      })
    })
  })

  describe('Permission and Validation', () => {
    describe('Check Tool Permission', () => {
      it('should allow with sufficient permission', () => {
        const tool = createApprovalTool('approve', { requiredPermission: 'write' })
        const result = checkToolPermission(tool, 'write')
        expect(result.allowed).toBe(true)
      })

      it('should allow with higher permission', () => {
        const tool = createApprovalTool('approve', { requiredPermission: 'write' })
        const result = checkToolPermission(tool, 'admin')
        expect(result.allowed).toBe(true)
      })

      it('should deny with insufficient permission', () => {
        const tool = createApprovalTool('approve', { requiredPermission: 'write' })
        const result = checkToolPermission(tool, 'read')
        expect(result.allowed).toBe(false)
        expect(result.reason).toBe('Insufficient permission')
      })
    })

    describe('Check Approval Type', () => {
      it('should allow allowed approval types', () => {
        const contract = createApprovalPilotContract({
          allowedApprovalTypes: ['leave', 'expense'],
        })
        expect(checkApprovalType(contract, 'leave')).toBe(true)
        expect(checkApprovalType(contract, 'expense')).toBe(true)
      })

      it('should deny disallowed approval types', () => {
        const contract = createApprovalPilotContract({
          allowedApprovalTypes: ['leave'],
        })
        expect(checkApprovalType(contract, 'expense')).toBe(false)
      })
    })

    describe('Validate Tool Input', () => {
      let contract: ApprovalPilotContract
      let state: ApprovalPilotState

      beforeEach(() => {
        contract = createApprovalPilotContract()
        state = createApprovalPilotState()
        registerDefaultTools(state)
      })

      it('should validate submit tool input', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'submit')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should fail for non-draft submit', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'submitted'
        const tool = getToolByType(state, 'submit')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Can only submit draft approvals')
      })

      it('should fail for approve on non-pending', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'draft'
        const tool = getToolByType(state, 'approve')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-2',
          userName: '李四',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Can only approve/reject/return pending approvals')
      })

      it('should fail for comment without content', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'comment')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
        }

        const result = validateToolInput(input, tool, contract)
        expect(result.valid).toBe(false)
        expect(result.errors).toContain('Comment is required')
      })
    })
  })

  describe('Tool Execution', () => {
    let contract: ApprovalPilotContract
    let state: ApprovalPilotState

    beforeEach(() => {
      contract = createApprovalPilotContract()
      state = createApprovalPilotState()
      registerDefaultTools(state)
    })

    describe('Submit Tool', () => {
      it('should submit approval', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'submit')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          skipConfirmation: true,
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('审批已提交')
        expect(output.updatedContext?.status).toBe('submitted')
        expect(output.updatedContext?.history).toHaveLength(1)
      })
    })

    describe('Approve Tool', () => {
      it('should approve pending approval', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'pending'
        const tool = getToolByType(state, 'approve')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: { comment: '同意' },
          userPermission: 'write',
          userId: 'user-2',
          userName: '李四',
          skipConfirmation: true,
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('审批已通过')
        expect(output.updatedContext?.status).toBe('approved')
      })

      it('should require confirmation', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'pending'
        const tool = getToolByType(state, 'approve')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-2',
          userName: '李四',
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(false)
        expect(output.requiresConfirmation).toBe(true)
        expect(output.confirmationMessage).toContain('确认执行操作')
      })
    })

    describe('Reject Tool', () => {
      it('should reject pending approval', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'pending'
        const tool = getToolByType(state, 'reject')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: { comment: '不同意' },
          userPermission: 'write',
          userId: 'user-2',
          userName: '李四',
          skipConfirmation: true,
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('审批已拒绝')
        expect(output.updatedContext?.status).toBe('rejected')
      })
    })

    describe('Return Tool', () => {
      it('should return pending approval', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'pending'
        const tool = getToolByType(state, 'return')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: { comment: '请补充说明' },
          userPermission: 'write',
          userId: 'user-2',
          userName: '李四',
          skipConfirmation: true,
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('审批已退回修改')
        expect(output.updatedContext?.status).toBe('draft')
      })
    })

    describe('Transfer Tool', () => {
      it('should transfer approval', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'pending'
        const tool = getToolByType(state, 'transfer')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {
            targetUserId: 'user-3',
            targetUserName: '王五',
          },
          userPermission: 'write',
          userId: 'user-2',
          userName: '李四',
          skipConfirmation: true,
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('审批已转交')
        expect(output.updatedContext?.currentApproverId).toBe('user-3')
        expect(output.updatedContext?.currentApproverName).toBe('王五')
      })
    })

    describe('Withdraw Tool', () => {
      it('should withdraw submitted approval', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'submitted'
        const tool = getToolByType(state, 'withdraw')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          skipConfirmation: true,
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('审批已撤回')
        expect(output.updatedContext?.status).toBe('withdrawn')
      })
    })

    describe('Comment Tool', () => {
      it('should add comment', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'comment')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: { comment: '请注意时间' },
          userPermission: 'read',
          userId: 'user-2',
          userName: '李四',
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('评论已添加')
        expect(output.updatedContext?.history).toHaveLength(1)
        expect(output.updatedContext?.history[0].comment).toBe('请注意时间')
      })
    })

    describe('Query Tool', () => {
      it('should query approval', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'query')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'read',
          userId: 'user-2',
          userName: '李四',
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('查询成功')
      })
    })

    describe('Summary Tool', () => {
      it('should generate summary', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'summary')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: { summaryType: 'detailed' },
          userPermission: 'read',
          userId: 'user-2',
          userName: '李四',
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.message).toBe('摘要已生成')
        expect(output.summary).toBeDefined()
        expect(output.summary?.title).toBe('请假')
      })
    })

    describe('Dry Run', () => {
      it('should support dry run mode', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'submit')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          dryRun: true,
        }

        const output = executeApprovalTool(input, tool, contract, state)

        expect(output.success).toBe(true)
        expect(output.warnings).toContain('Dry run - no actual changes made')
        expect(output.updatedContext).toBeUndefined()
      })
    })

    describe('Tool History Recording', () => {
      it('should record tool execution in history', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const tool = getToolByType(state, 'submit')!
        const input: ApprovalToolInput = {
          toolId: tool.toolId,
          context,
          params: {},
          userPermission: 'write',
          userId: 'user-1',
          userName: '张三',
          skipConfirmation: true,
        }

        executeApprovalTool(input, tool, contract, state)

        expect(state.toolHistory).toHaveLength(1)
        expect(state.toolHistory[0].toolType).toBe('submit')
        expect(state.toolHistory[0].success).toBe(true)
      })
    })
  })

  describe('Summary Generation', () => {
    it('should generate brief summary', () => {
      const context = createApprovalContext('leave', '请假申请', 'user-1', '张三', '技术部')
      const summary = generateApprovalSummary(context, { summaryType: 'brief' })

      expect(summary.summaryType).toBe('brief')
      expect(summary.title).toBe('请假申请')
      expect(summary.applicant.name).toBe('张三')
      expect(summary.status).toBe('draft')
      expect(summary.content).toContain('审批标题')
      expect(summary.keyFields).toBeDefined()
    })

    it('should generate detailed summary', () => {
      const context = createApprovalContext('leave', '请假申请', 'user-1', '张三', '技术部')
      context.status = 'pending'
      context.currentApproverId = 'user-2'
      context.currentApproverName = '李四'
      context.history.push(createApprovalHistoryEntry('submit', 'user-1', '张三', '申请人'))

      const summary = generateApprovalSummary(context, { summaryType: 'detailed' })

      expect(summary.summaryType).toBe('detailed')
      expect(summary.currentApprover?.name).toBe('李四')
      expect(summary.timeline).toHaveLength(1)
    })

    it('should generate full summary with history', () => {
      const context = createApprovalContext('expense', '报销申请', 'user-1', '张三', '技术部', {
        amount: 1000,
        category: '差旅费',
      })
      context.history.push(createApprovalHistoryEntry('submit', 'user-1', '张三', '申请人'))
      context.history.push(createApprovalHistoryEntry('approve', 'user-2', '李四', '审批人', { comment: '同意' }))

      const summary = generateApprovalSummary(context, { summaryType: 'full' })

      expect(summary.summaryType).toBe('full')
      expect(summary.timeline).toHaveLength(2)
    })

    it('should extract key fields for leave type', () => {
      const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部', {
        startDate: '2026-03-24',
        endDate: '2026-03-25',
        duration: 2,
        leaveType: '事假',
        reason: '个人事务',
      })

      const summary = generateApprovalSummary(context)

      expect(summary.keyFields).toContainEqual(
        expect.objectContaining({ label: '事由', value: '个人事务' })
      )
    })

    it('should extract key fields for expense type', () => {
      const context = createApprovalContext('expense', '报销', 'user-1', '张三', '技术部', {
        amount: 1500,
        category: '交通费',
        reason: '出差',
      })

      const summary = generateApprovalSummary(context)

      expect(summary.keyFields).toContainEqual(
        expect.objectContaining({ label: '报销金额', value: 1500 })
      )
    })
  })

  describe('Writeback Integration', () => {
    describe('Create Writeback Action', () => {
      it('should create writeback action', () => {
        const action = createApprovalWritebackAction(
          'session-1',
          'approval-1',
          'summary',
          { title: 'Test' }
        )

        expect(action.sessionId).toBe('session-1')
        expect(action.approvalId).toBe('approval-1')
        expect(action.writebackType).toBe('summary')
        expect(action.content).toEqual({ title: 'Test' })
      })
    })

    describe('Prepare Summary Writeback', () => {
      it('should prepare summary for writeback', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const summary = generateApprovalSummary(context)
        const writeback = prepareSummaryWriteback(summary)

        expect(writeback.title).toBe('请假')
        expect(writeback.applicantName).toBe('张三')
        expect(writeback.approvalType).toBe('请假审批')
      })
    })

    describe('Prepare Status Writeback', () => {
      it('should prepare status for writeback', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.status = 'approved'
        context.currentApproverName = '李四'
        const writeback = prepareStatusWriteback(context)

        expect(writeback.status).toBe('approved')
        expect(writeback.statusName).toBe('已通过')
        expect(writeback.currentApprover).toBe('李四')
      })
    })

    describe('Prepare Form Writeback', () => {
      it('should prepare form data for writeback', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部', {
          startDate: '2026-03-24',
          duration: 2,
        })
        const writeback = prepareFormWriteback(context)

        expect(writeback.formData).toEqual({
          startDate: '2026-03-24',
          duration: 2,
        })
      })
    })

    describe('Prepare History Writeback', () => {
      it('should prepare history for writeback', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        context.history.push(createApprovalHistoryEntry('submit', 'user-1', '张三', '申请人'))
        const writeback = prepareHistoryWriteback(context)

        expect(writeback.history).toHaveLength(1)
        expect(writeback.history[0].action).toBe('提交')
      })
    })
  })

  describe('Audit Integration', () => {
    it('should create audit entry', () => {
      const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
      const entry = createApprovalAuditEntry(
        'session-1',
        context,
        'approve',
        '李四',
        true,
        { comment: '同意' }
      )

      expect(entry.sessionId).toBe('session-1')
      expect(entry.targetId).toBe(context.approvalId)
      expect(entry.operation).toBe('approve')
      expect(entry.actor).toBe('李四')
      expect(entry.success).toBe(true)
    })

    it('should add audit entry to state', () => {
      const state = createApprovalPilotState()
      const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
      const entry = createApprovalAuditEntry('session-1', context, 'submit', '张三', true)

      addAuditEntryToState(state, entry)

      expect(state.auditEntries).toHaveLength(1)
      expect(state.auditEntries[0]).toBe(entry)
    })
  })

  describe('Serialization', () => {
    describe('Approval Context', () => {
      it('should serialize and deserialize', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部', {
          startDate: '2026-03-24',
        })
        const json = serializeApprovalContext(context)
        const restored = deserializeApprovalContext(json)
        expect(restored).toEqual(context)
      })
    })

    describe('Approval Tool', () => {
      it('should serialize and deserialize', () => {
        const tool = createApprovalTool('approve')
        const json = serializeApprovalTool(tool)
        const restored = deserializeApprovalTool(json)
        expect(restored).toEqual(tool)
      })
    })

    describe('Approval Summary', () => {
      it('should serialize and deserialize', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const summary = generateApprovalSummary(context)
        const json = serializeApprovalSummary(summary)
        const restored = deserializeApprovalSummary(json)
        expect(restored).toEqual(summary)
      })
    })

    describe('Approval Pilot State', () => {
      it('should serialize and deserialize', () => {
        const state = createApprovalPilotState()
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        state.currentContext = context
        registerDefaultTools(state)

        const json = serializeApprovalPilotState(state)
        const restored = deserializeApprovalPilotState(json)

        expect(restored.currentContext).toEqual(context)
        expect(restored.availableTools.size).toBe(9)
      })
    })
  })

  describe('Debug Formatting', () => {
    describe('Format Approval Context', () => {
      it('should format context', () => {
        const context = createApprovalContext('leave', '请假申请', 'user-1', '张三', '技术部')
        const formatted = formatApprovalContext(context)
        expect(formatted).toContain('请假申请')
        expect(formatted).toContain('请假审批')
        expect(formatted).toContain('张三')
        expect(formatted).toContain('技术部')
        expect(formatted).toContain('草稿')
      })
    })

    describe('Format Approval Tool', () => {
      it('should format low risk tool', () => {
        const tool = createApprovalTool('submit')
        const formatted = formatApprovalTool(tool)
        expect(formatted).toBe('提交审批')
      })

      it('should format medium risk tool', () => {
        const tool = createApprovalTool('approve')
        const formatted = formatApprovalTool(tool)
        expect(formatted).toContain('通过审批')
        expect(formatted).toContain('[中风险]')
        expect(formatted).toContain('[需确认]')
      })

      it('should format high risk tool', () => {
        const tool = createApprovalTool('reject')
        const formatted = formatApprovalTool(tool)
        expect(formatted).toContain('[高风险]')
      })
    })

    describe('Format Approval Summary', () => {
      it('should format summary', () => {
        const context = createApprovalContext('leave', '请假', 'user-1', '张三', '技术部')
        const summary = generateApprovalSummary(context)
        const formatted = formatApprovalSummary(summary)
        expect(formatted).toContain('审批摘要')
        expect(formatted).toContain('请假')
        expect(formatted).toContain('草稿')
      })
    })

    describe('Format Tool Execution Record', () => {
      it('should format successful record', () => {
        const record: ApprovalToolExecutionRecord = {
          recordId: 'record-1',
          toolId: 'tool-1',
          toolType: 'approve',
          timestamp: new Date().toISOString(),
          userId: 'user-1',
          userName: '张三',
          success: true,
          durationMs: 42,
          params: {},
        }
        const formatted = formatToolExecutionRecord(record)
        expect(formatted).toContain('✓')
        expect(formatted).toContain('approve')
        expect(formatted).toContain('张三')
        expect(formatted).toContain('42ms')
      })

      it('should format failed record', () => {
        const record: ApprovalToolExecutionRecord = {
          recordId: 'record-1',
          toolId: 'tool-1',
          toolType: 'reject',
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
